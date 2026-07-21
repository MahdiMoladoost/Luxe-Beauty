import { Prisma, type PrismaClient } from "@prisma/client"

import type { RequestContext, SessionPrincipal } from "@/lib/auth/types"
import { prisma } from "@/lib/infrastructure/prisma"

type CatalogDatabase = PrismaClient | Prisma.TransactionClient

const offeringInclude = {
  standardService: { include: { category: true } },
  branch: true,
  professional: true,
  provider: true,
} satisfies Prisma.ServiceOfferingInclude

export class CatalogRepository {
  constructor(private readonly database: PrismaClient = prisma) {}

  transaction<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.database.$transaction(operation, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    })
  }

  listPublicCatalog() {
    return this.database.serviceCategory.findMany({
      where: { active: true },
      include: {
        services: {
          where: { active: true },
          orderBy: { titleFa: "asc" },
        },
      },
      orderBy: [{ parentId: "asc" }, { nameFa: "asc" }],
    })
  }

  async createCategory(input: {
    principal: SessionPrincipal
    parentId?: string | null
    nameFa: string
    nameEn?: string | null
    normalizedName: string
    slug: string
    context: RequestContext
  }) {
    return this.transaction(async (tx) => {
      if (input.parentId) {
        const parent = await tx.serviceCategory.findFirst({
          where: { id: input.parentId, active: true },
          select: { id: true },
        })
        if (!parent) return { kind: "PARENT_NOT_FOUND" as const }
      }

      const category = await tx.serviceCategory.create({
        data: {
          parentId: input.parentId ?? null,
          nameFa: input.nameFa,
          nameEn: input.nameEn ?? null,
          normalizedName: input.normalizedName,
          slug: input.slug,
          active: true,
        },
      })
      await this.audit(tx, {
        principal: input.principal,
        action: "catalog.category.created",
        resourceType: "ServiceCategory",
        resourceId: category.id,
        correlationId: input.context.correlationId,
        metadata: { parentId: category.parentId, slug: category.slug },
      })
      return { kind: "CREATED" as const, category }
    })
  }

  async createStandardService(input: {
    principal: SessionPrincipal
    categoryId: string
    titleFa: string
    titleEn?: string | null
    normalizedTitle: string
    slug: string
    description?: string | null
    context: RequestContext
  }) {
    return this.transaction(async (tx) => {
      const category = await tx.serviceCategory.findFirst({
        where: { id: input.categoryId, active: true },
        select: { id: true },
      })
      if (!category) return { kind: "CATEGORY_NOT_FOUND" as const }

      const service = await tx.standardService.create({
        data: {
          categoryId: input.categoryId,
          titleFa: input.titleFa,
          titleEn: input.titleEn ?? null,
          normalizedTitle: input.normalizedTitle,
          slug: input.slug,
          description: input.description ?? null,
          active: true,
        },
      })
      await this.audit(tx, {
        principal: input.principal,
        action: "catalog.standard-service.created",
        resourceType: "StandardService",
        resourceId: service.id,
        correlationId: input.context.correlationId,
        metadata: { categoryId: service.categoryId, slug: service.slug },
      })
      return { kind: "CREATED" as const, service }
    })
  }

  async listOwnedOfferings(userId: string, providerId: string) {
    const provider = await this.database.providerOrganization.findFirst({
      where: { id: providerId, ownerUserId: userId, deletedAt: null },
      select: { id: true },
    })
    if (!provider) return null
    return this.database.serviceOffering.findMany({
      where: { providerId, deletedAt: null },
      include: offeringInclude,
      orderBy: { updatedAt: "desc" },
    })
  }

  async createOffering(input: {
    principal: SessionPrincipal
    providerId: string
    branchId?: string | null
    professionalId?: string | null
    standardServiceId: string
    titleFa: string
    priceModel: Prisma.ServiceOfferingCreateInput["priceModel"]
    priceMinToman?: bigint | null
    priceMaxToman?: bigint | null
    baseDurationMinute: number
    preparationMinute: number
    cleanupMinute: number
    bufferBeforeMinute: number
    bufferAfterMinute: number
    audienceRules: Prisma.InputJsonValue
    bookingPolicy: Prisma.InputJsonValue
    pricingRules?: Prisma.InputJsonValue | null
    active: boolean
    published: boolean
    context: RequestContext
  }) {
    return this.transaction(async (tx) => {
      const provider = await tx.providerOrganization.findFirst({
        where: {
          id: input.providerId,
          ownerUserId: input.principal.userId,
          status: "APPROVED",
          deletedAt: null,
        },
      })
      if (!provider) return { kind: "PROVIDER_NOT_APPROVED" as const }

      const standardService = await tx.standardService.findFirst({
        where: { id: input.standardServiceId, active: true },
        select: { id: true },
      })
      if (!standardService) return { kind: "STANDARD_SERVICE_NOT_FOUND" as const }

      const target = await this.validateOfferingTarget(tx, {
        providerId: provider.id,
        providerOwnerUserId: provider.ownerUserId,
        branchId: input.branchId ?? null,
        professionalId: input.professionalId ?? null,
        requireOperational: input.active || input.published,
      })
      if (target !== "VALID") return { kind: target }
      if ((input.active || input.published) && !provider.bookingEnabled) {
        return { kind: "PROVIDER_BOOKING_DISABLED" as const }
      }

      const offering = await tx.serviceOffering.create({
        data: {
          providerId: provider.id,
          branchId: input.branchId ?? null,
          professionalId: input.professionalId ?? null,
          standardServiceId: input.standardServiceId,
          titleFa: input.titleFa,
          priceModel: input.priceModel,
          priceMinToman: input.priceMinToman ?? null,
          priceMaxToman: input.priceMaxToman ?? null,
          baseDurationMinute: input.baseDurationMinute,
          preparationMinute: input.preparationMinute,
          cleanupMinute: input.cleanupMinute,
          bufferBeforeMinute: input.bufferBeforeMinute,
          bufferAfterMinute: input.bufferAfterMinute,
          audienceRules: input.audienceRules,
          bookingPolicy: input.bookingPolicy,
          pricingRules: input.pricingRules ?? Prisma.JsonNull,
          active: input.active,
          published: input.published,
          version: 1,
        },
        include: offeringInclude,
      })
      await this.audit(tx, {
        principal: input.principal,
        action: "catalog.offering.created",
        resourceType: "ServiceOffering",
        resourceId: offering.id,
        scopeType: "PROVIDER",
        scopeId: provider.id,
        correlationId: input.context.correlationId,
        metadata: {
          standardServiceId: offering.standardServiceId,
          branchId: offering.branchId,
          professionalId: offering.professionalId,
          version: offering.version,
        },
      })
      return { kind: "CREATED" as const, offering }
    })
  }

  async updateOffering(input: {
    principal: SessionPrincipal
    providerId: string
    offeringId: string
    expectedVersion: number
    changes: {
      titleFa?: string
      priceModel?: Prisma.ServiceOfferingUpdateInput["priceModel"]
      priceMinToman?: bigint | null
      priceMaxToman?: bigint | null
      baseDurationMinute?: number
      preparationMinute?: number
      cleanupMinute?: number
      bufferBeforeMinute?: number
      bufferAfterMinute?: number
      audienceRules?: Prisma.InputJsonValue
      bookingPolicy?: Prisma.InputJsonValue
      pricingRules?: Prisma.InputJsonValue | null
      active?: boolean
      published?: boolean
    }
    context: RequestContext
  }) {
    return this.transaction(async (tx) => {
      const offering = await tx.serviceOffering.findFirst({
        where: {
          id: input.offeringId,
          providerId: input.providerId,
          provider: { ownerUserId: input.principal.userId, deletedAt: null },
          deletedAt: null,
        },
        include: offeringInclude,
      })
      if (!offering) return { kind: "OFFERING_NOT_FOUND" as const }
      if (offering.version !== input.expectedVersion) return { kind: "VERSION_CONFLICT" as const }

      const nextActive = input.changes.active ?? offering.active
      const nextPublished = input.changes.published ?? offering.published
      if (nextActive || nextPublished) {
        if (offering.provider.status !== "APPROVED" || !offering.provider.bookingEnabled) {
          return { kind: "PROVIDER_BOOKING_DISABLED" as const }
        }
        const target = await this.validateOfferingTarget(tx, {
          providerId: offering.providerId,
          providerOwnerUserId: offering.provider.ownerUserId,
          branchId: offering.branchId,
          professionalId: offering.professionalId,
          requireOperational: true,
        })
        if (target !== "VALID") return { kind: target }
      }

      const updateResult = await tx.serviceOffering.updateMany({
        where: { id: offering.id, version: input.expectedVersion, deletedAt: null },
        data: {
          ...input.changes,
          pricingRules:
            input.changes.pricingRules === undefined
              ? undefined
              : input.changes.pricingRules ?? Prisma.JsonNull,
          version: { increment: 1 },
        },
      })
      if (updateResult.count !== 1) return { kind: "VERSION_CONFLICT" as const }

      const updated = await tx.serviceOffering.findUniqueOrThrow({
        where: { id: offering.id },
        include: offeringInclude,
      })
      await this.audit(tx, {
        principal: input.principal,
        action: "catalog.offering.updated",
        resourceType: "ServiceOffering",
        resourceId: updated.id,
        scopeType: "PROVIDER",
        scopeId: updated.providerId,
        correlationId: input.context.correlationId,
        metadata: {
          previousVersion: input.expectedVersion,
          version: updated.version,
          active: updated.active,
          published: updated.published,
        },
      })
      return { kind: "UPDATED" as const, offering: updated }
    })
  }

  async softDeleteOffering(input: {
    principal: SessionPrincipal
    providerId: string
    offeringId: string
    expectedVersion: number
    context: RequestContext
  }) {
    return this.transaction(async (tx) => {
      const owned = await tx.serviceOffering.findFirst({
        where: {
          id: input.offeringId,
          providerId: input.providerId,
          provider: { ownerUserId: input.principal.userId, deletedAt: null },
          deletedAt: null,
        },
      })
      if (!owned) return { kind: "OFFERING_NOT_FOUND" as const }
      if (owned.version !== input.expectedVersion) return { kind: "VERSION_CONFLICT" as const }

      const deletedAt = new Date()
      const result = await tx.serviceOffering.updateMany({
        where: { id: owned.id, version: input.expectedVersion, deletedAt: null },
        data: { deletedAt, active: false, published: false, version: { increment: 1 } },
      })
      if (result.count !== 1) return { kind: "VERSION_CONFLICT" as const }
      await this.audit(tx, {
        principal: input.principal,
        action: "catalog.offering.archived",
        resourceType: "ServiceOffering",
        resourceId: owned.id,
        scopeType: "PROVIDER",
        scopeId: owned.providerId,
        correlationId: input.context.correlationId,
        metadata: { previousVersion: input.expectedVersion },
      })
      return { kind: "DELETED" as const, deletedAt }
    })
  }

  publicOffering(offeringId: string) {
    return this.database.serviceOffering.findFirst({
      where: {
        id: offeringId,
        active: true,
        published: true,
        deletedAt: null,
        standardService: { active: true },
        provider: { status: "APPROVED", bookingEnabled: true, deletedAt: null },
        AND: [
          { OR: [{ branchId: null }, { branch: { active: true, deletedAt: null } }] },
          { OR: [{ professionalId: null }, { professional: { active: true, verified: true } }] },
        ],
      },
      include: offeringInclude,
    })
  }

  createQuote(input: {
    offeringId: string
    providerId: string
    customerUserId?: string | null
    quantity: number
    unitPriceToman: bigint
    totalToman: bigint
    durationMinute: number
    snapshot: Prisma.InputJsonValue
    expiresAt: Date
  }) {
    return this.database.serviceQuote.create({ data: input })
  }

  private async validateOfferingTarget(
    tx: Prisma.TransactionClient,
    input: {
      providerId: string
      providerOwnerUserId: string
      branchId: string | null
      professionalId: string | null
      requireOperational: boolean
    },
  ): Promise<
    | "VALID"
    | "BRANCH_NOT_FOUND"
    | "BRANCH_NOT_ACTIVE"
    | "PROFESSIONAL_NOT_FOUND"
    | "PROFESSIONAL_NOT_AFFILIATED"
  > {
    if (input.branchId) {
      const branch = await tx.branch.findFirst({
        where: { id: input.branchId, organizationId: input.providerId, deletedAt: null },
        select: { active: true },
      })
      if (!branch) return "BRANCH_NOT_FOUND"
      if (input.requireOperational && !branch.active) return "BRANCH_NOT_ACTIVE"
    }

    if (!input.professionalId) return "VALID"
    const professional = await tx.professionalProfile.findFirst({
      where: {
        id: input.professionalId,
        ...(input.requireOperational ? { active: true, verified: true } : {}),
      },
    })
    if (!professional) return "PROFESSIONAL_NOT_FOUND"
    if (professional.userId === input.providerOwnerUserId) return "VALID"

    const affiliation = await tx.professionalAffiliation.findFirst({
      where: {
        professionalId: professional.id,
        organizationId: input.providerId,
        status: "ACTIVE",
        OR: input.branchId
          ? [{ branchId: null }, { branchId: input.branchId }]
          : [{ branchId: null }, { branchId: { not: null } }],
      },
      select: { id: true },
    })
    return affiliation ? "VALID" : "PROFESSIONAL_NOT_AFFILIATED"
  }

  private async audit(
    db: CatalogDatabase,
    input: {
      principal: SessionPrincipal
      action: string
      resourceType: string
      resourceId: string
      scopeType?: string
      scopeId?: string
      correlationId: string
      metadata?: Record<string, unknown>
    },
  ) {
    await db.auditLog.create({
      data: {
        actorUserId: input.principal.userId,
        action: input.action,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        scopeType: input.scopeType ?? "PLATFORM",
        scopeId: input.scopeId ?? null,
        correlationId: input.correlationId,
        metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined,
      },
    })
  }
}

export const catalogRepository = new CatalogRepository()
