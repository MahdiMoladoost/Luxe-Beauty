import { Prisma, type AffiliationStatus, type PrismaClient } from "@prisma/client"

import type { RequestContext, SessionPrincipal } from "@/lib/auth/types"
import { prisma } from "@/lib/infrastructure/prisma"
import {
  affiliationRequestStatus,
  assertAffiliationCanBeCreated,
  transitionAffiliation,
  type AffiliationAction,
  type AffiliationParty,
} from "@/lib/provider/affiliation-policy"

const OPEN_AFFILIATION_STATUSES: AffiliationStatus[] = [
  "REQUESTED_BY_PROVIDER",
  "REQUESTED_BY_PROFESSIONAL",
  "PENDING_COUNTERPART",
  "ACTIVE",
  "TERMINATION_REQUESTED",
  "DISPUTED",
]

export class AffiliationRepository {
  constructor(private readonly database: PrismaClient = prisma) {}

  transaction<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.database.$transaction(operation, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    })
  }

  async approvedProviderOwnedBy(userId: string, organizationId: string) {
    return this.database.providerOrganization.findFirst({
      where: {
        id: organizationId,
        ownerUserId: userId,
        status: "APPROVED",
        deletedAt: null,
      },
    })
  }

  async professionalProfileForUser(userId: string) {
    return this.database.professionalProfile.findUnique({ where: { userId } })
  }

  async ensureProfessionalProfile(input: {
    principal: SessionPrincipal
    displayNameFa?: string | null
    normalizedName?: string | null
    bio?: string | null
    context: RequestContext
  }) {
    return this.transaction(async (tx) => {
      const approvedProfessionalProvider = await tx.providerOrganization.findFirst({
        where: {
          ownerUserId: input.principal.userId,
          status: "APPROVED",
          deletedAt: null,
          type: {
            in: [
              "INDEPENDENT_PROFESSIONAL",
              "HOME_SERVICE_PROFESSIONAL",
              "HOME_STUDIO_PROFESSIONAL",
              "HYBRID_PROFESSIONAL",
              "OTHER",
            ],
          },
        },
        orderBy: { createdAt: "asc" },
      })
      if (!approvedProfessionalProvider) return null

      const displayNameFa = input.displayNameFa || approvedProfessionalProvider.nameFa
      const normalizedName = input.normalizedName || approvedProfessionalProvider.normalizedName
      const profile = await tx.professionalProfile.upsert({
        where: { userId: input.principal.userId },
        update: {
          displayNameFa,
          normalizedName,
          bio: input.bio ?? undefined,
          verified: true,
          active: true,
        },
        create: {
          userId: input.principal.userId,
          displayNameFa,
          normalizedName,
          bio: input.bio ?? null,
          verified: true,
          active: true,
        },
      })

      await tx.auditLog.create({
        data: {
          actorUserId: input.principal.userId,
          action: "professional.profile.ensured",
          resourceType: "ProfessionalProfile",
          resourceId: profile.id,
          scopeType: "PROFESSIONAL",
          scopeId: profile.id,
          correlationId: input.context.correlationId,
          metadata: {
            sourceProviderId: approvedProfessionalProvider.id,
          } as Prisma.InputJsonValue,
        },
      })

      return profile
    })
  }

  async createAffiliation(input: {
    principal: SessionPrincipal
    actorParty: AffiliationParty
    organizationId: string
    branchId?: string | null
    professionalProfileId: string
    permissions?: Prisma.InputJsonValue
    context: RequestContext
  }) {
    return this.transaction(async (tx) => {
      const organization = await tx.providerOrganization.findFirst({
        where: {
          id: input.organizationId,
          status: "APPROVED",
          deletedAt: null,
        },
      })
      if (!organization) return { kind: "ORGANIZATION_NOT_FOUND" as const }

      const professional = await tx.professionalProfile.findFirst({
        where: {
          id: input.professionalProfileId,
          active: true,
          verified: true,
        },
      })
      if (!professional) return { kind: "PROFESSIONAL_NOT_FOUND" as const }
      if (professional.userId === organization.ownerUserId) {
        return { kind: "SELF_AFFILIATION" as const }
      }

      if (input.actorParty === "PROVIDER" && organization.ownerUserId !== input.principal.userId) {
        return { kind: "FORBIDDEN" as const }
      }
      if (input.actorParty === "PROFESSIONAL" && professional.userId !== input.principal.userId) {
        return { kind: "FORBIDDEN" as const }
      }

      if (input.branchId) {
        const branch = await tx.branch.findFirst({
          where: {
            id: input.branchId,
            organizationId: organization.id,
            deletedAt: null,
          },
          select: { id: true },
        })
        if (!branch) return { kind: "BRANCH_NOT_FOUND" as const }
      }

      const existing = await tx.professionalAffiliation.findFirst({
        where: {
          professionalId: professional.id,
          organizationId: organization.id,
          branchId: input.branchId ?? null,
          status: { in: OPEN_AFFILIATION_STATUSES },
        },
        orderBy: { createdAt: "desc" },
      })
      assertAffiliationCanBeCreated(existing?.status)

      const status = affiliationRequestStatus(input.actorParty)
      const affiliation = await tx.professionalAffiliation.create({
        data: {
          professionalId: professional.id,
          organizationId: organization.id,
          branchId: input.branchId ?? null,
          status,
          requestedBy: input.actorParty,
          permissions: input.permissions ?? Prisma.JsonNull,
        },
        include: {
          professional: true,
          organization: true,
          branch: true,
        },
      })

      await tx.auditLog.create({
        data: {
          actorUserId: input.principal.userId,
          action: "professional.affiliation.requested",
          resourceType: "ProfessionalAffiliation",
          resourceId: affiliation.id,
          scopeType: "PROVIDER",
          scopeId: organization.id,
          correlationId: input.context.correlationId,
          metadata: {
            actorParty: input.actorParty,
            professionalProfileId: professional.id,
            branchId: input.branchId ?? null,
            status,
          } as Prisma.InputJsonValue,
        },
      })

      return { kind: "CREATED" as const, affiliation }
    })
  }

  async listForPrincipal(userId: string) {
    const profile = await this.database.professionalProfile.findUnique({
      where: { userId },
      select: { id: true },
    })
    const ownedProviders = await this.database.providerOrganization.findMany({
      where: { ownerUserId: userId, deletedAt: null },
      select: { id: true },
    })
    const organizationIds = ownedProviders.map((provider) => provider.id)
    if (!profile && organizationIds.length === 0) return []

    return this.database.professionalAffiliation.findMany({
      where: {
        OR: [
          ...(profile ? [{ professionalId: profile.id }] : []),
          ...(organizationIds.length ? [{ organizationId: { in: organizationIds } }] : []),
        ],
      },
      include: {
        professional: true,
        organization: true,
        branch: true,
      },
      orderBy: { updatedAt: "desc" },
    })
  }

  async transition(input: {
    principal: SessionPrincipal
    affiliationId: string
    action: AffiliationAction
    context: RequestContext
  }) {
    return this.transaction(async (tx) => {
      const affiliation = await tx.professionalAffiliation.findUnique({
        where: { id: input.affiliationId },
        include: {
          professional: true,
          organization: true,
          branch: true,
        },
      })
      if (!affiliation) return { kind: "NOT_FOUND" as const }

      let actorParty: AffiliationParty | null = null
      if (affiliation.organization.ownerUserId === input.principal.userId) actorParty = "PROVIDER"
      if (affiliation.professional.userId === input.principal.userId) actorParty = "PROFESSIONAL"
      if (!actorParty) return { kind: "FORBIDDEN" as const }

      const transition = transitionAffiliation(
        affiliation.status,
        affiliation.requestedBy,
        actorParty,
        input.action,
      )
      const now = new Date()
      const updated = await tx.professionalAffiliation.update({
        where: { id: affiliation.id },
        data: {
          status: transition.status,
          requestedBy: transition.requestedBy,
          startsAt: transition.setStartsAt ? affiliation.startsAt ?? now : affiliation.startsAt,
          endsAt: transition.setEndsAt ? now : affiliation.endsAt,
        },
        include: {
          professional: true,
          organization: true,
          branch: true,
        },
      })

      await tx.auditLog.create({
        data: {
          actorUserId: input.principal.userId,
          action: `professional.affiliation.${input.action.toLowerCase()}`,
          resourceType: "ProfessionalAffiliation",
          resourceId: affiliation.id,
          scopeType: "PROVIDER",
          scopeId: affiliation.organizationId,
          correlationId: input.context.correlationId,
          metadata: {
            actorParty,
            fromStatus: affiliation.status,
            toStatus: transition.status,
            branchId: affiliation.branchId,
          } as Prisma.InputJsonValue,
        },
      })

      return { kind: "UPDATED" as const, affiliation: updated }
    })
  }
}

export const affiliationRepository = new AffiliationRepository()
