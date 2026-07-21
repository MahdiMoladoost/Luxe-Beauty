import { randomUUID } from "node:crypto"
import { z } from "zod"

import { AuthError } from "@/lib/auth/errors"
import type { RequestContext, SessionPrincipal } from "@/lib/auth/types"
import { normalizePersianText } from "@/lib/localization/normalize-fa"
import { branchRepository } from "@/lib/provider/branch-repository"

const coordinatesSchema = {
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
}

const createBranchSchema = z.object({
  nameFa: z.string().trim().min(2).max(180),
  cityId: z.string().uuid(),
  districtId: z.string().uuid().nullable().optional(),
  neighborhoodId: z.string().uuid().nullable().optional(),
  ...coordinatesSchema,
})

const updateBranchSchema = z
  .object({
    expectedUpdatedAt: z.string().datetime(),
    nameFa: z.string().trim().min(2).max(180).optional(),
    cityId: z.string().uuid().optional(),
    districtId: z.string().uuid().nullable().optional(),
    neighborhoodId: z.string().uuid().nullable().optional(),
    active: z.boolean().optional(),
    ...coordinatesSchema,
  })
  .refine(
    (value) =>
      value.nameFa !== undefined ||
      value.cityId !== undefined ||
      value.districtId !== undefined ||
      value.neighborhoodId !== undefined ||
      value.latitude !== undefined ||
      value.longitude !== undefined ||
      value.active !== undefined,
    { message: "At least one branch field must be changed." },
  )

function branchDto(branch: {
  id: string
  organizationId: string
  nameFa: string
  slug: string
  latitude: { toString(): string } | null
  longitude: { toString(): string } | null
  addressVerified: boolean
  active: boolean
  createdAt: Date
  updatedAt: Date
  city: { id: string; nameFa: string; slug: string }
  district: { id: string; nameFa: string; slug: string } | null
  neighborhood: { id: string; nameFa: string; slug: string } | null
}) {
  return {
    id: branch.id,
    providerId: branch.organizationId,
    nameFa: branch.nameFa,
    slug: branch.slug,
    location: {
      city: { id: branch.city.id, nameFa: branch.city.nameFa, slug: branch.city.slug },
      district: branch.district
        ? { id: branch.district.id, nameFa: branch.district.nameFa, slug: branch.district.slug }
        : null,
      neighborhood: branch.neighborhood
        ? {
            id: branch.neighborhood.id,
            nameFa: branch.neighborhood.nameFa,
            slug: branch.neighborhood.slug,
          }
        : null,
      latitude: branch.latitude?.toString() ?? null,
      longitude: branch.longitude?.toString() ?? null,
    },
    addressVerified: branch.addressVerified,
    active: branch.active,
    createdAt: branch.createdAt,
    updatedAt: branch.updatedAt,
  }
}

function repositoryError(kind: string): never {
  switch (kind) {
    case "PROVIDER_NOT_FOUND":
      throw new AuthError("PROVIDER_NOT_FOUND", "پرونده ارائه‌دهنده یافت نشد.", 404)
    case "BRANCH_NOT_FOUND":
      throw new AuthError("BRANCH_NOT_FOUND", "شعبه یافت نشد.", 404)
    case "CITY_NOT_FOUND":
      throw new AuthError("CITY_NOT_FOUND", "شهر فعال یافت نشد.", 404)
    case "DISTRICT_NOT_FOUND":
      throw new AuthError("DISTRICT_NOT_FOUND", "منطقه متعلق به شهر انتخاب‌شده نیست.", 409)
    case "NEIGHBORHOOD_NOT_FOUND":
      throw new AuthError("NEIGHBORHOOD_NOT_FOUND", "محله متعلق به شهر انتخاب‌شده نیست.", 409)
    case "LOCATION_HIERARCHY_MISMATCH":
      throw new AuthError("LOCATION_HIERARCHY_MISMATCH", "شهر، منطقه و محله با یکدیگر سازگار نیستند.", 409)
    case "PROVIDER_NOT_APPROVED":
      throw new AuthError("PROVIDER_NOT_APPROVED", "فعال‌سازی شعبه فقط پس از تأیید ارائه‌دهنده ممکن است.", 409)
    case "VERSION_CONFLICT":
      throw new AuthError(
        "VERSION_CONFLICT",
        "اطلاعات شعبه هم‌زمان تغییر کرده است. اطلاعات جدید را دریافت و دوباره تلاش کنید.",
        409,
      )
    default:
      throw new AuthError("BRANCH_OPERATION_FAILED", "عملیات شعبه انجام نشد.", 400)
  }
}

export async function listOwnedBranches(principal: SessionPrincipal, providerId: string) {
  const validatedProviderId = z.string().uuid().parse(providerId)
  const branches = await branchRepository.listOwned(principal.userId, validatedProviderId)
  if (!branches) repositoryError("PROVIDER_NOT_FOUND")
  return branches.map(branchDto)
}

export async function getOwnedBranch(
  principal: SessionPrincipal,
  providerId: string,
  branchId: string,
) {
  const branches = await listOwnedBranches(principal, providerId)
  const branch = branches.find((candidate) => candidate.id === z.string().uuid().parse(branchId))
  if (!branch) repositoryError("BRANCH_NOT_FOUND")
  return branch
}

export async function createOwnedBranch(
  principal: SessionPrincipal,
  providerId: string,
  rawInput: unknown,
  context: RequestContext,
) {
  const validatedProviderId = z.string().uuid().parse(providerId)
  const input = createBranchSchema.parse(rawInput)
  const result = await branchRepository.create({
    principal,
    providerId: validatedProviderId,
    nameFa: normalizePersianText(input.nameFa),
    slug: `branch-${randomUUID()}`,
    cityId: input.cityId,
    districtId: input.districtId ?? null,
    neighborhoodId: input.neighborhoodId ?? null,
    latitude: input.latitude,
    longitude: input.longitude,
    context,
  })
  if (result.kind !== "CREATED") repositoryError(result.kind)
  return branchDto(result.branch)
}

export async function updateOwnedBranch(
  principal: SessionPrincipal,
  providerId: string,
  branchId: string,
  rawInput: unknown,
  context: RequestContext,
) {
  const input = updateBranchSchema.parse(rawInput)
  const result = await branchRepository.update({
    principal,
    providerId: z.string().uuid().parse(providerId),
    branchId: z.string().uuid().parse(branchId),
    expectedUpdatedAt: new Date(input.expectedUpdatedAt),
    nameFa: input.nameFa ? normalizePersianText(input.nameFa) : undefined,
    cityId: input.cityId,
    districtId: input.districtId,
    neighborhoodId: input.neighborhoodId,
    latitude: input.latitude,
    longitude: input.longitude,
    active: input.active,
    context,
  })
  if (result.kind !== "UPDATED") repositoryError(result.kind)
  return branchDto(result.branch)
}

export async function deleteOwnedBranch(
  principal: SessionPrincipal,
  providerId: string,
  branchId: string,
  expectedUpdatedAt: string,
  context: RequestContext,
) {
  const parsedExpectedUpdatedAt = z.string().datetime().parse(expectedUpdatedAt)
  const result = await branchRepository.softDelete({
    principal,
    providerId: z.string().uuid().parse(providerId),
    branchId: z.string().uuid().parse(branchId),
    expectedUpdatedAt: new Date(parsedExpectedUpdatedAt),
    context,
  })
  if (result.kind !== "DELETED") repositoryError(result.kind)
  return result
}
