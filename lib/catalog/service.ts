import { Prisma } from "@prisma/client"
import { z } from "zod"

import { AuthError } from "@/lib/auth/errors"
import { assertPermission } from "@/lib/auth/rbac"
import type { RequestContext, SessionPrincipal } from "@/lib/auth/types"
import { catalogRepository } from "@/lib/catalog/repository"
import {
  calculateOfferingQuote,
  OfferingPricingError,
  pricingSnapshot,
  supportedPriceModels,
  validateOfferingPricing,
} from "@/lib/catalog/pricing"
import { normalizePersianText, normalizeSearchText } from "@/lib/localization/normalize-fa"

const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(220)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must contain lowercase Latin letters, numbers and hyphens")

const jsonObjectSchema = z.record(z.string().min(1).max(100), z.unknown())
const tomanStringSchema = z.string().trim().regex(/^\d+$/).transform((value) => BigInt(value))

const categorySchema = z.object({
  parentId: z.string().uuid().nullable().optional(),
  nameFa: z.string().trim().min(2).max(160),
  nameEn: z.string().trim().min(2).max(160).nullable().optional(),
  slug: slugSchema,
})

const standardServiceSchema = z.object({
  categoryId: z.string().uuid(),
  titleFa: z.string().trim().min(2).max(180),
  titleEn: z.string().trim().min(2).max(180).nullable().optional(),
  slug: slugSchema,
  description: z.string().trim().max(4000).nullable().optional(),
})

const pricingFields = {
  priceModel: z.enum(supportedPriceModels),
  priceMinToman: tomanStringSchema.nullable().optional(),
  priceMaxToman: tomanStringSchema.nullable().optional(),
  baseDurationMinute: z.number().int().min(5).max(720),
  preparationMinute: z.number().int().min(0).max(180).default(0),
  cleanupMinute: z.number().int().min(0).max(180).default(0),
  bufferBeforeMinute: z.number().int().min(0).max(180).default(0),
  bufferAfterMinute: z.number().int().min(0).max(180).default(0),
}

const createOfferingSchema = z.object({
  branchId: z.string().uuid().nullable().optional(),
  professionalId: z.string().uuid().nullable().optional(),
  standardServiceId: z.string().uuid(),
  titleFa: z.string().trim().min(2).max(180),
  ...pricingFields,
  audienceRules: jsonObjectSchema.default({}),
  bookingPolicy: jsonObjectSchema.default({}),
  pricingRules: jsonObjectSchema.nullable().optional(),
  active: z.boolean().default(false),
  published: z.boolean().default(false),
})

const updateOfferingSchema = z
  .object({
    expectedVersion: z.number().int().positive(),
    titleFa: z.string().trim().min(2).max(180).optional(),
    priceModel: z.enum(supportedPriceModels).optional(),
    priceMinToman: tomanStringSchema.nullable().optional(),
    priceMaxToman: tomanStringSchema.nullable().optional(),
    baseDurationMinute: z.number().int().min(5).max(720).optional(),
    preparationMinute: z.number().int().min(0).max(180).optional(),
    cleanupMinute: z.number().int().min(0).max(180).optional(),
    bufferBeforeMinute: z.number().int().min(0).max(180).optional(),
    bufferAfterMinute: z.number().int().min(0).max(180).optional(),
    audienceRules: jsonObjectSchema.optional(),
    bookingPolicy: jsonObjectSchema.optional(),
    pricingRules: jsonObjectSchema.nullable().optional(),
    active: z.boolean().optional(),
    published: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).some((key) => key !== "expectedVersion"), {
    message: "At least one offering field must be changed.",
  })

const quoteSchema = z.object({ quantity: z.number().int().min(1).max(20).default(1) })

function providerOperationError(kind: string): never {
  switch (kind) {
    case "PROVIDER_NOT_APPROVED":
      throw new AuthError("PROVIDER_NOT_APPROVED", "برای مدیریت خدمت، پرونده ارائه‌دهنده باید تأیید شده باشد.", 409)
    case "PROVIDER_BOOKING_DISABLED":
      throw new AuthError("PROVIDER_BOOKING_DISABLED", "انتشار خدمت تا فعال‌شدن رزرو ارائه‌دهنده ممکن نیست.", 409)
    case "STANDARD_SERVICE_NOT_FOUND":
      throw new AuthError("STANDARD_SERVICE_NOT_FOUND", "خدمت استاندارد فعال یافت نشد.", 404)
    case "BRANCH_NOT_FOUND":
      throw new AuthError("BRANCH_NOT_FOUND", "شعبه متعلق به این ارائه‌دهنده نیست.", 404)
    case "BRANCH_NOT_ACTIVE":
      throw new AuthError("BRANCH_NOT_ACTIVE", "برای انتشار، شعبه باید فعال باشد.", 409)
    case "PROFESSIONAL_NOT_FOUND":
      throw new AuthError("PROFESSIONAL_NOT_FOUND", "متخصص فعال و تأییدشده یافت نشد.", 404)
    case "PROFESSIONAL_NOT_AFFILIATED":
      throw new AuthError("PROFESSIONAL_NOT_AFFILIATED", "متخصص همکاری فعال با این ارائه‌دهنده ندارد.", 409)
    case "OFFERING_NOT_FOUND":
      throw new AuthError("OFFERING_NOT_FOUND", "خدمت ارائه‌دهنده یافت نشد.", 404)
    case "VERSION_CONFLICT":
      throw new AuthError(
        "VERSION_CONFLICT",
        "خدمت هم‌زمان تغییر کرده است. نسخه جدید را دریافت و دوباره تلاش کنید.",
        409,
      )
    default:
      throw new AuthError("OFFERING_OPERATION_FAILED", "عملیات خدمت انجام نشد.", 400)
  }
}

function pricingError(error: OfferingPricingError): never {
  throw new AuthError(error.code, "قیمت یا مدت خدمت با قواعد پلتفرم سازگار نیست.", 409, {
    reason: error.message,
  })
}

function jsonValue(value: Record<string, unknown>): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue
}

function offeringDto(offering: Awaited<ReturnType<typeof catalogRepository.publicOffering>>) {
  if (!offering) return null
  return {
    id: offering.id,
    providerId: offering.providerId,
    branchId: offering.branchId,
    professionalId: offering.professionalId,
    standardServiceId: offering.standardServiceId,
    titleFa: offering.titleFa,
    priceModel: offering.priceModel,
    priceMinToman: offering.priceMinToman?.toString() ?? null,
    priceMaxToman: offering.priceMaxToman?.toString() ?? null,
    duration: {
      baseMinute: offering.baseDurationMinute,
      preparationMinute: offering.preparationMinute,
      cleanupMinute: offering.cleanupMinute,
      bufferBeforeMinute: offering.bufferBeforeMinute,
      bufferAfterMinute: offering.bufferAfterMinute,
    },
    audienceRules: offering.audienceRules,
    bookingPolicy: offering.bookingPolicy,
    pricingRules: offering.pricingRules,
    active: offering.active,
    published: offering.published,
    version: offering.version,
    updatedAt: offering.updatedAt,
    provider: {
      id: offering.provider.id,
      nameFa: offering.provider.nameFa,
      status: offering.provider.status,
      bookingEnabled: offering.provider.bookingEnabled,
    },
    branch: offering.branch
      ? { id: offering.branch.id, nameFa: offering.branch.nameFa, active: offering.branch.active }
      : null,
    professional: offering.professional
      ? {
          id: offering.professional.id,
          displayNameFa: offering.professional.displayNameFa,
          verified: offering.professional.verified,
          active: offering.professional.active,
        }
      : null,
    standardService: {
      id: offering.standardService.id,
      titleFa: offering.standardService.titleFa,
      slug: offering.standardService.slug,
      category: {
        id: offering.standardService.category.id,
        nameFa: offering.standardService.category.nameFa,
        slug: offering.standardService.category.slug,
      },
    },
  }
}

function ownedOfferingDto(offering: NonNullable<Awaited<ReturnType<typeof catalogRepository.listOwnedOfferings>>>[number]) {
  return offeringDto(offering)
}

export async function listPublicCatalog() {
  const categories = await catalogRepository.listPublicCatalog()
  return categories.map((category) => ({
    id: category.id,
    parentId: category.parentId,
    nameFa: category.nameFa,
    nameEn: category.nameEn,
    slug: category.slug,
    services: category.services.map((service) => ({
      id: service.id,
      titleFa: service.titleFa,
      titleEn: service.titleEn,
      slug: service.slug,
      description: service.description,
    })),
  }))
}

export async function createCatalogCategory(
  principal: SessionPrincipal,
  rawInput: unknown,
  context: RequestContext,
) {
  assertPermission(principal, "content.manage")
  const input = categorySchema.parse(rawInput)
  try {
    const result = await catalogRepository.createCategory({
      principal,
      parentId: input.parentId ?? null,
      nameFa: normalizePersianText(input.nameFa),
      nameEn: input.nameEn ?? null,
      normalizedName: normalizeSearchText(input.nameFa),
      slug: input.slug,
      context,
    })
    if (result.kind !== "CREATED") {
      throw new AuthError("CATEGORY_PARENT_NOT_FOUND", "دسته والد فعال یافت نشد.", 404)
    }
    return result.category
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AuthError("CATALOG_SLUG_CONFLICT", "این شناسه متنی قبلاً استفاده شده است.", 409)
    }
    throw error
  }
}

export async function createCatalogStandardService(
  principal: SessionPrincipal,
  rawInput: unknown,
  context: RequestContext,
) {
  assertPermission(principal, "content.manage")
  const input = standardServiceSchema.parse(rawInput)
  try {
    const result = await catalogRepository.createStandardService({
      principal,
      categoryId: input.categoryId,
      titleFa: normalizePersianText(input.titleFa),
      titleEn: input.titleEn ?? null,
      normalizedTitle: normalizeSearchText(input.titleFa),
      slug: input.slug,
      description: input.description ? normalizePersianText(input.description) : null,
      context,
    })
    if (result.kind !== "CREATED") {
      throw new AuthError("CATEGORY_NOT_FOUND", "دسته فعال یافت نشد.", 404)
    }
    return result.service
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AuthError("CATALOG_SLUG_CONFLICT", "این شناسه متنی قبلاً استفاده شده است.", 409)
    }
    throw error
  }
}

export async function listOwnedOfferings(principal: SessionPrincipal, providerId: string) {
  const rows = await catalogRepository.listOwnedOfferings(principal.userId, z.string().uuid().parse(providerId))
  if (!rows) providerOperationError("OFFERING_NOT_FOUND")
  return rows.map(ownedOfferingDto)
}

export async function createOwnedOffering(
  principal: SessionPrincipal,
  providerId: string,
  rawInput: unknown,
  context: RequestContext,
) {
  const input = createOfferingSchema.parse(rawInput)
  try {
    validateOfferingPricing({
      priceModel: input.priceModel,
      priceMinToman: input.priceMinToman ?? null,
      priceMaxToman: input.priceMaxToman ?? null,
      baseDurationMinute: input.baseDurationMinute,
      preparationMinute: input.preparationMinute,
      cleanupMinute: input.cleanupMinute,
      bufferBeforeMinute: input.bufferBeforeMinute,
      bufferAfterMinute: input.bufferAfterMinute,
    })
  } catch (error) {
    if (error instanceof OfferingPricingError) pricingError(error)
    throw error
  }

  const result = await catalogRepository.createOffering({
    principal,
    providerId: z.string().uuid().parse(providerId),
    branchId: input.branchId ?? null,
    professionalId: input.professionalId ?? null,
    standardServiceId: input.standardServiceId,
    titleFa: normalizePersianText(input.titleFa),
    priceModel: input.priceModel,
    priceMinToman: input.priceMinToman ?? null,
    priceMaxToman: input.priceMaxToman ?? null,
    baseDurationMinute: input.baseDurationMinute,
    preparationMinute: input.preparationMinute,
    cleanupMinute: input.cleanupMinute,
    bufferBeforeMinute: input.bufferBeforeMinute,
    bufferAfterMinute: input.bufferAfterMinute,
    audienceRules: jsonValue(input.audienceRules),
    bookingPolicy: jsonValue(input.bookingPolicy),
    pricingRules: input.pricingRules ? jsonValue(input.pricingRules) : null,
    active: input.active,
    published: input.published,
    context,
  })
  if (result.kind !== "CREATED") providerOperationError(result.kind)
  return ownedOfferingDto(result.offering)
}

export async function updateOwnedOffering(
  principal: SessionPrincipal,
  providerId: string,
  offeringId: string,
  rawInput: unknown,
  context: RequestContext,
) {
  const input = updateOfferingSchema.parse(rawInput)
  const providerUuid = z.string().uuid().parse(providerId)
  const offeringUuid = z.string().uuid().parse(offeringId)
  const owned = await catalogRepository.listOwnedOfferings(principal.userId, providerUuid)
  const current = owned?.find((offering) => offering.id === offeringUuid)
  if (!current) providerOperationError("OFFERING_NOT_FOUND")
  if (current.version !== input.expectedVersion) providerOperationError("VERSION_CONFLICT")

  const effective = {
    priceModel: input.priceModel ?? current.priceModel,
    priceMinToman: input.priceMinToman === undefined ? current.priceMinToman : input.priceMinToman,
    priceMaxToman: input.priceMaxToman === undefined ? current.priceMaxToman : input.priceMaxToman,
    baseDurationMinute: input.baseDurationMinute ?? current.baseDurationMinute,
    preparationMinute: input.preparationMinute ?? current.preparationMinute,
    cleanupMinute: input.cleanupMinute ?? current.cleanupMinute,
    bufferBeforeMinute: input.bufferBeforeMinute ?? current.bufferBeforeMinute,
    bufferAfterMinute: input.bufferAfterMinute ?? current.bufferAfterMinute,
  }
  try {
    validateOfferingPricing(effective)
  } catch (error) {
    if (error instanceof OfferingPricingError) pricingError(error)
    throw error
  }

  const { expectedVersion, ...changes } = input
  const result = await catalogRepository.updateOffering({
    principal,
    providerId: providerUuid,
    offeringId: offeringUuid,
    expectedVersion,
    changes: {
      ...changes,
      titleFa: changes.titleFa ? normalizePersianText(changes.titleFa) : undefined,
      audienceRules: changes.audienceRules ? jsonValue(changes.audienceRules) : undefined,
      bookingPolicy: changes.bookingPolicy ? jsonValue(changes.bookingPolicy) : undefined,
      pricingRules:
        changes.pricingRules === undefined
          ? undefined
          : changes.pricingRules === null
            ? null
            : jsonValue(changes.pricingRules),
    },
    context,
  })
  if (result.kind !== "UPDATED") providerOperationError(result.kind)
  return ownedOfferingDto(result.offering)
}

export async function deleteOwnedOffering(
  principal: SessionPrincipal,
  providerId: string,
  offeringId: string,
  expectedVersion: number,
  context: RequestContext,
) {
  const parsedVersion = z.number().int().positive().parse(expectedVersion)
  const result = await catalogRepository.softDeleteOffering({
    principal,
    providerId: z.string().uuid().parse(providerId),
    offeringId: z.string().uuid().parse(offeringId),
    expectedVersion: parsedVersion,
    context,
  })
  if (result.kind !== "DELETED") providerOperationError(result.kind)
  return result
}

export async function getPublicOffering(offeringId: string) {
  const offering = await catalogRepository.publicOffering(z.string().uuid().parse(offeringId))
  if (!offering) throw new AuthError("OFFERING_NOT_FOUND", "خدمت فعال و قابل رزرو یافت نشد.", 404)
  return offeringDto(offering)
}

export async function quotePublicOffering(
  principal: SessionPrincipal | null,
  offeringId: string,
  rawInput: unknown,
) {
  const input = quoteSchema.parse(rawInput)
  const offering = await catalogRepository.publicOffering(z.string().uuid().parse(offeringId))
  if (!offering) throw new AuthError("OFFERING_NOT_FOUND", "خدمت فعال و قابل قیمت‌گذاری یافت نشد.", 404)

  let calculation
  try {
    calculation = calculateOfferingQuote(offering, input.quantity)
  } catch (error) {
    if (error instanceof OfferingPricingError) pricingError(error)
    throw error
  }

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000)
  const calculationSnapshot = pricingSnapshot(calculation)
  const snapshot = {
    schemaVersion: 1,
    offering: {
      id: offering.id,
      version: offering.version,
      titleFa: offering.titleFa,
      standardServiceId: offering.standardServiceId,
      providerId: offering.providerId,
      branchId: offering.branchId,
      professionalId: offering.professionalId,
      priceModel: offering.priceModel,
    },
    durationFormula: {
      baseMinutePerQuantity: offering.baseDurationMinute,
      preparationMinute: offering.preparationMinute,
      cleanupMinute: offering.cleanupMinute,
      bufferBeforeMinute: offering.bufferBeforeMinute,
      bufferAfterMinute: offering.bufferAfterMinute,
    },
    audienceRules: offering.audienceRules,
    bookingPolicy: offering.bookingPolicy,
    pricingRules: offering.pricingRules,
    calculation: calculationSnapshot,
    expiresAt: expiresAt.toISOString(),
  } as Prisma.InputJsonValue

  const quote = await catalogRepository.createQuote({
    offeringId: offering.id,
    providerId: offering.providerId,
    customerUserId: principal?.userId ?? null,
    quantity: calculation.quantity,
    unitPriceToman: calculation.unitPriceToman,
    totalToman: calculation.totalToman,
    durationMinute: calculation.durationMinute,
    snapshot,
    expiresAt,
  })

  return {
    id: quote.id,
    offeringId: quote.offeringId,
    quantity: quote.quantity,
    unitPriceToman: quote.unitPriceToman.toString(),
    totalToman: quote.totalToman.toString(),
    durationMinute: quote.durationMinute,
    finalPrice: calculation.finalPrice,
    directlyBookable: calculation.directlyBookable,
    priceKind: calculation.priceKind,
    priceMinToman: calculation.priceMinToman?.toString() ?? null,
    priceMaxToman: calculation.priceMaxToman?.toString() ?? null,
    currency: "TOMAN",
    expiresAt: quote.expiresAt,
    snapshotVersion: 1,
  }
}
