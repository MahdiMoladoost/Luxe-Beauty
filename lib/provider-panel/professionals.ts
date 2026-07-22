import { z } from "zod"

import { AuthError } from "@/lib/auth/errors"
import type { SessionPrincipal } from "@/lib/auth/types"
import { prisma } from "@/lib/infrastructure/prisma"
import { normalizeSearchText } from "@/lib/localization/normalize-fa"

const providerIdSchema = z.string().uuid()
const searchSchema = z.string().trim().min(2).max(80)

async function ownedProvider(principal: SessionPrincipal, providerId: string) {
  const provider = await prisma.providerOrganization.findFirst({
    where: {
      id: providerIdSchema.parse(providerId),
      ownerUserId: principal.userId,
      deletedAt: null,
    },
    select: {
      id: true,
      nameFa: true,
      status: true,
      bookingEnabled: true,
      ownerUserId: true,
    },
  })
  if (!provider) throw new AuthError("PROVIDER_NOT_FOUND", "مجموعه قابل مدیریت یافت نشد.", 404)
  return provider
}

function affiliationDto(affiliation: {
  id: string
  status: string
  requestedBy: string
  startsAt: Date | null
  endsAt: Date | null
  createdAt: Date
  updatedAt: Date
  permissions: unknown
  professional: { id: string; displayNameFa: string; verified: boolean; active: boolean; bio: string | null }
  branch: { id: string; nameFa: string; active: boolean } | null
}) {
  return {
    id: affiliation.id,
    status: affiliation.status,
    requestedBy: affiliation.requestedBy,
    startsAt: affiliation.startsAt,
    endsAt: affiliation.endsAt,
    createdAt: affiliation.createdAt,
    updatedAt: affiliation.updatedAt,
    permissions: affiliation.permissions,
    professional: affiliation.professional,
    branch: affiliation.branch,
  }
}

export async function providerProfessionalWorkspace(
  principal: SessionPrincipal,
  providerId: string,
  rawQuery?: string | null,
) {
  const provider = await ownedProvider(principal, providerId)
  const affiliations = await prisma.professionalAffiliation.findMany({
    where: { organizationId: provider.id },
    include: {
      professional: {
        select: {
          id: true,
          displayNameFa: true,
          verified: true,
          active: true,
          bio: true,
        },
      },
      branch: { select: { id: true, nameFa: true, active: true } },
    },
    orderBy: { updatedAt: "desc" },
  })

  const query = rawQuery?.trim() ? searchSchema.parse(rawQuery) : null
  let candidates: Array<{
    id: string
    displayNameFa: string
    bio: string | null
    verified: boolean
    active: boolean
    existingAffiliation: { id: string; status: string; branchId: string | null } | null
  }> = []

  if (query) {
    const normalizedQuery = normalizeSearchText(query)
    const rows = await prisma.professionalProfile.findMany({
      where: {
        active: true,
        verified: true,
        userId: { not: provider.ownerUserId },
        normalizedName: { contains: normalizedQuery, mode: "insensitive" },
      },
      select: {
        id: true,
        displayNameFa: true,
        bio: true,
        verified: true,
        active: true,
        affiliations: {
          where: {
            organizationId: provider.id,
            status: {
              in: [
                "REQUESTED_BY_PROVIDER",
                "REQUESTED_BY_PROFESSIONAL",
                "PENDING_COUNTERPART",
                "ACTIVE",
                "TERMINATION_REQUESTED",
                "DISPUTED",
              ],
            },
          },
          select: { id: true, status: true, branchId: true },
          orderBy: { updatedAt: "desc" },
          take: 1,
        },
      },
      orderBy: { displayNameFa: "asc" },
      take: 20,
    })
    candidates = rows.map((row) => ({
      id: row.id,
      displayNameFa: row.displayNameFa,
      bio: row.bio,
      verified: row.verified,
      active: row.active,
      existingAffiliation: row.affiliations[0] ?? null,
    }))
  }

  return {
    provider: {
      id: provider.id,
      nameFa: provider.nameFa,
      status: provider.status,
      bookingEnabled: provider.bookingEnabled,
    },
    affiliations: affiliations.map(affiliationDto),
    candidates,
    searchQuery: query ?? "",
  }
}
