import { z } from "zod"

import { AuthError } from "@/lib/auth/errors"
import type { RequestContext, SessionPrincipal } from "@/lib/auth/types"
import { normalizePersianText, normalizeSearchText } from "@/lib/localization/normalize-fa"
import {
  affiliationActions,
  AffiliationTransitionError,
  type AffiliationAction,
  type AffiliationParty,
} from "@/lib/provider/affiliation-policy"
import { affiliationRepository } from "@/lib/provider/affiliation-repository"

const profileSchema = z.object({
  displayNameFa: z.string().trim().min(2).max(180).optional(),
  bio: z.string().trim().max(4000).optional(),
})

const requestSchema = z.object({
  organizationId: z.string().uuid(),
  branchId: z.string().uuid().nullable().optional(),
  professionalProfileId: z.string().uuid().optional(),
  permissions: z.record(z.string().min(1).max(80), z.boolean()).optional(),
})

const transitionSchema = z.object({
  action: z.enum(affiliationActions),
})

function affiliationDto(affiliation: {
  id: string
  status: string
  requestedBy: string
  startsAt: Date | null
  endsAt: Date | null
  createdAt: Date
  updatedAt: Date
  permissions: unknown
  professional: { id: string; displayNameFa: string; verified: boolean; active: boolean }
  organization: { id: string; nameFa: string; status: string; bookingEnabled: boolean }
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
    professional: {
      id: affiliation.professional.id,
      displayNameFa: affiliation.professional.displayNameFa,
      verified: affiliation.professional.verified,
      active: affiliation.professional.active,
    },
    organization: {
      id: affiliation.organization.id,
      nameFa: affiliation.organization.nameFa,
      status: affiliation.organization.status,
      bookingEnabled: affiliation.organization.bookingEnabled,
    },
    branch: affiliation.branch
      ? {
          id: affiliation.branch.id,
          nameFa: affiliation.branch.nameFa,
          active: affiliation.branch.active,
        }
      : null,
  }
}

export async function ensureOwnProfessionalProfile(
  principal: SessionPrincipal,
  rawInput: unknown,
  context: RequestContext,
) {
  const input = profileSchema.parse(rawInput)
  const displayNameFa = input.displayNameFa ? normalizePersianText(input.displayNameFa) : null
  const profile = await affiliationRepository.ensureProfessionalProfile({
    principal,
    displayNameFa,
    normalizedName: displayNameFa ? normalizeSearchText(displayNameFa) : null,
    bio: input.bio ? normalizePersianText(input.bio) : null,
    context,
  })
  if (!profile) {
    throw new AuthError(
      "APPROVED_PROFESSIONAL_PROVIDER_REQUIRED",
      "برای ساخت پروفایل متخصص، ابتدا پرونده متخصص باید تأیید شود.",
      409,
    )
  }
  return {
    id: profile.id,
    displayNameFa: profile.displayNameFa,
    bio: profile.bio,
    verified: profile.verified,
    active: profile.active,
  }
}

export async function getOwnProfessionalProfile(principal: SessionPrincipal) {
  const profile = await affiliationRepository.professionalProfileForUser(principal.userId)
  if (!profile) {
    throw new AuthError("PROFESSIONAL_PROFILE_NOT_FOUND", "پروفایل متخصص یافت نشد.", 404)
  }
  return {
    id: profile.id,
    displayNameFa: profile.displayNameFa,
    bio: profile.bio,
    verified: profile.verified,
    active: profile.active,
  }
}

export async function listMyProfessionalAffiliations(principal: SessionPrincipal) {
  const rows = await affiliationRepository.listForPrincipal(principal.userId)
  return rows.map(affiliationDto)
}

export async function requestProfessionalAffiliation(
  principal: SessionPrincipal,
  rawInput: unknown,
  context: RequestContext,
) {
  const input = requestSchema.parse(rawInput)
  const ownProfile = await affiliationRepository.professionalProfileForUser(principal.userId)
  const ownedProvider = await affiliationRepository.approvedProviderOwnedBy(
    principal.userId,
    input.organizationId,
  )

  let actorParty: AffiliationParty
  let professionalProfileId: string
  if (input.professionalProfileId) {
    if (!ownedProvider) {
      throw new AuthError(
        "FORBIDDEN",
        "فقط مالک ارائه‌دهنده تأییدشده می‌تواند برای متخصص دیگری درخواست اتصال ارسال کند.",
        403,
      )
    }
    actorParty = "PROVIDER"
    professionalProfileId = input.professionalProfileId
  } else {
    if (!ownProfile?.active || !ownProfile.verified) {
      throw new AuthError(
        "PROFESSIONAL_PROFILE_REQUIRED",
        "پروفایل متخصص تأییدشده برای ارسال درخواست اتصال لازم است.",
        409,
      )
    }
    actorParty = "PROFESSIONAL"
    professionalProfileId = ownProfile.id
  }

  try {
    const result = await affiliationRepository.createAffiliation({
      principal,
      actorParty,
      organizationId: input.organizationId,
      branchId: input.branchId ?? null,
      professionalProfileId,
      permissions: input.permissions,
      context,
    })

    if (result.kind === "ORGANIZATION_NOT_FOUND") {
      throw new AuthError("PROVIDER_NOT_FOUND", "ارائه‌دهنده تأییدشده یافت نشد.", 404)
    }
    if (result.kind === "PROFESSIONAL_NOT_FOUND") {
      throw new AuthError("PROFESSIONAL_NOT_FOUND", "متخصص تأییدشده یافت نشد.", 404)
    }
    if (result.kind === "BRANCH_NOT_FOUND") {
      throw new AuthError("BRANCH_NOT_FOUND", "شعبه متعلق به این ارائه‌دهنده نیست.", 404)
    }
    if (result.kind === "SELF_AFFILIATION") {
      throw new AuthError("SELF_AFFILIATION_NOT_ALLOWED", "اتصال یک حساب به خودش مجاز نیست.", 409)
    }
    if (result.kind === "FORBIDDEN") {
      throw new AuthError("FORBIDDEN", "دسترسی لازم برای این درخواست وجود ندارد.", 403)
    }

    return affiliationDto(result.affiliation)
  } catch (error) {
    if (error instanceof AffiliationTransitionError) {
      throw new AuthError("AFFILIATION_CONFLICT", "درخواست اتصال فعال یا در انتظار دیگری وجود دارد.", 409)
    }
    throw error
  }
}

export async function transitionProfessionalAffiliation(
  principal: SessionPrincipal,
  affiliationId: string,
  rawInput: unknown,
  context: RequestContext,
) {
  const id = z.string().uuid().parse(affiliationId)
  const { action } = transitionSchema.parse(rawInput) as { action: AffiliationAction }

  try {
    const result = await affiliationRepository.transition({
      principal,
      affiliationId: id,
      action,
      context,
    })
    if (result.kind === "NOT_FOUND") {
      throw new AuthError("AFFILIATION_NOT_FOUND", "درخواست همکاری یافت نشد.", 404)
    }
    if (result.kind === "FORBIDDEN") {
      throw new AuthError("FORBIDDEN", "فقط طرف‌های این همکاری می‌توانند وضعیت آن را تغییر دهند.", 403)
    }
    return affiliationDto(result.affiliation)
  } catch (error) {
    if (error instanceof AffiliationTransitionError) {
      const status = error.code === "AFFILIATION_COUNTERPART_REQUIRED" ? 403 : 409
      throw new AuthError(error.code, "این تغییر وضعیت برای کاربر یا وضعیت فعلی مجاز نیست.", status)
    }
    throw error
  }
}
