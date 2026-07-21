import { Prisma, type PrismaClient } from "@prisma/client"

import type { RequestContext, SessionPrincipal } from "@/lib/auth/types"
import { prisma } from "@/lib/infrastructure/prisma"

export class BranchRepository {
  constructor(private readonly database: PrismaClient = prisma) {}

  transaction<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.database.$transaction(operation, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    })
  }

  async listOwned(userId: string, providerId: string) {
    const provider = await this.database.providerOrganization.findFirst({
      where: { id: providerId, ownerUserId: userId, deletedAt: null },
      select: { id: true },
    })
    if (!provider) return null
    return this.database.branch.findMany({
      where: { organizationId: providerId, deletedAt: null },
      include: {
        city: true,
        district: true,
        neighborhood: true,
      },
      orderBy: [{ active: "desc" }, { createdAt: "asc" }],
    })
  }

  async create(input: {
    principal: SessionPrincipal
    providerId: string
    nameFa: string
    slug: string
    cityId: string
    districtId?: string | null
    neighborhoodId?: string | null
    latitude?: number | null
    longitude?: number | null
    context: RequestContext
  }) {
    return this.transaction(async (tx) => {
      const provider = await tx.providerOrganization.findFirst({
        where: {
          id: input.providerId,
          ownerUserId: input.principal.userId,
          deletedAt: null,
        },
      })
      if (!provider) return { kind: "PROVIDER_NOT_FOUND" as const }

      const location = await this.resolveLocation(tx, {
        cityId: input.cityId,
        districtId: input.districtId ?? null,
        neighborhoodId: input.neighborhoodId ?? null,
      })
      if (location.kind !== "VALID") return location

      const branch = await tx.branch.create({
        data: {
          organizationId: provider.id,
          cityId: location.cityId,
          districtId: location.districtId,
          neighborhoodId: location.neighborhoodId,
          nameFa: input.nameFa,
          slug: input.slug,
          latitude: input.latitude ?? null,
          longitude: input.longitude ?? null,
          addressVerified: false,
          active: false,
        },
        include: {
          city: true,
          district: true,
          neighborhood: true,
        },
      })

      await tx.auditLog.create({
        data: {
          actorUserId: input.principal.userId,
          action: "provider.branch.created",
          resourceType: "Branch",
          resourceId: branch.id,
          scopeType: "PROVIDER",
          scopeId: provider.id,
          correlationId: input.context.correlationId,
          metadata: {
            cityId: branch.cityId,
            districtId: branch.districtId,
            neighborhoodId: branch.neighborhoodId,
          } as Prisma.InputJsonValue,
        },
      })

      return { kind: "CREATED" as const, branch }
    })
  }

  async update(input: {
    principal: SessionPrincipal
    providerId: string
    branchId: string
    expectedUpdatedAt: Date
    nameFa?: string
    cityId?: string
    districtId?: string | null
    neighborhoodId?: string | null
    latitude?: number | null
    longitude?: number | null
    active?: boolean
    context: RequestContext
  }) {
    return this.transaction(async (tx) => {
      const provider = await tx.providerOrganization.findFirst({
        where: {
          id: input.providerId,
          ownerUserId: input.principal.userId,
          deletedAt: null,
        },
      })
      if (!provider) return { kind: "PROVIDER_NOT_FOUND" as const }

      const current = await tx.branch.findFirst({
        where: {
          id: input.branchId,
          organizationId: provider.id,
          deletedAt: null,
        },
      })
      if (!current) return { kind: "BRANCH_NOT_FOUND" as const }
      if (input.active === true && provider.status !== "APPROVED") {
        return { kind: "PROVIDER_NOT_APPROVED" as const }
      }

      const location = await this.resolveLocation(tx, {
        cityId: input.cityId ?? current.cityId,
        districtId: input.districtId === undefined ? current.districtId : input.districtId,
        neighborhoodId:
          input.neighborhoodId === undefined ? current.neighborhoodId : input.neighborhoodId,
      })
      if (location.kind !== "VALID") return location

      const updated = await tx.branch.updateMany({
        where: {
          id: current.id,
          organizationId: provider.id,
          updatedAt: input.expectedUpdatedAt,
          deletedAt: null,
        },
        data: {
          nameFa: input.nameFa ?? current.nameFa,
          cityId: location.cityId,
          districtId: location.districtId,
          neighborhoodId: location.neighborhoodId,
          latitude: input.latitude === undefined ? current.latitude : input.latitude,
          longitude: input.longitude === undefined ? current.longitude : input.longitude,
          active: input.active ?? current.active,
        },
      })
      if (updated.count !== 1) return { kind: "VERSION_CONFLICT" as const }

      const branch = await tx.branch.findUniqueOrThrow({
        where: { id: current.id },
        include: {
          city: true,
          district: true,
          neighborhood: true,
        },
      })
      await tx.auditLog.create({
        data: {
          actorUserId: input.principal.userId,
          action: "provider.branch.updated",
          resourceType: "Branch",
          resourceId: branch.id,
          scopeType: "PROVIDER",
          scopeId: provider.id,
          correlationId: input.context.correlationId,
          metadata: {
            previousUpdatedAt: current.updatedAt.toISOString(),
            active: branch.active,
            cityId: branch.cityId,
            districtId: branch.districtId,
            neighborhoodId: branch.neighborhoodId,
          } as Prisma.InputJsonValue,
        },
      })

      return { kind: "UPDATED" as const, branch }
    })
  }

  async softDelete(input: {
    principal: SessionPrincipal
    providerId: string
    branchId: string
    expectedUpdatedAt: Date
    context: RequestContext
  }) {
    return this.transaction(async (tx) => {
      const provider = await tx.providerOrganization.findFirst({
        where: {
          id: input.providerId,
          ownerUserId: input.principal.userId,
          deletedAt: null,
        },
        select: { id: true },
      })
      if (!provider) return { kind: "PROVIDER_NOT_FOUND" as const }

      const current = await tx.branch.findFirst({
        where: {
          id: input.branchId,
          organizationId: provider.id,
          deletedAt: null,
        },
      })
      if (!current) return { kind: "BRANCH_NOT_FOUND" as const }

      const deletedAt = new Date()
      const updated = await tx.branch.updateMany({
        where: {
          id: current.id,
          organizationId: provider.id,
          updatedAt: input.expectedUpdatedAt,
          deletedAt: null,
        },
        data: { active: false, deletedAt },
      })
      if (updated.count !== 1) return { kind: "VERSION_CONFLICT" as const }

      await tx.auditLog.create({
        data: {
          actorUserId: input.principal.userId,
          action: "provider.branch.deleted",
          resourceType: "Branch",
          resourceId: current.id,
          scopeType: "PROVIDER",
          scopeId: provider.id,
          correlationId: input.context.correlationId,
          metadata: { deletedAt: deletedAt.toISOString() } as Prisma.InputJsonValue,
        },
      })

      return { kind: "DELETED" as const, id: current.id, deletedAt }
    })
  }

  private async resolveLocation(
    tx: Prisma.TransactionClient,
    input: { cityId: string; districtId: string | null; neighborhoodId: string | null },
  ) {
    const city = await tx.city.findFirst({
      where: { id: input.cityId, active: true },
      select: { id: true },
    })
    if (!city) return { kind: "CITY_NOT_FOUND" as const }

    let districtId = input.districtId
    if (districtId) {
      const district = await tx.district.findFirst({
        where: { id: districtId, cityId: city.id, active: true },
        select: { id: true },
      })
      if (!district) return { kind: "DISTRICT_NOT_FOUND" as const }
    }

    let neighborhoodId = input.neighborhoodId
    if (neighborhoodId) {
      const neighborhood = await tx.neighborhood.findFirst({
        where: { id: neighborhoodId, cityId: city.id, active: true },
        select: { id: true, districtId: true },
      })
      if (!neighborhood) return { kind: "NEIGHBORHOOD_NOT_FOUND" as const }
      if (districtId && neighborhood.districtId && neighborhood.districtId !== districtId) {
        return { kind: "LOCATION_HIERARCHY_MISMATCH" as const }
      }
      districtId ??= neighborhood.districtId
    }

    return {
      kind: "VALID" as const,
      cityId: city.id,
      districtId,
      neighborhoodId,
    }
  }
}

export const branchRepository = new BranchRepository()
