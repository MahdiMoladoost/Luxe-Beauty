import { randomUUID } from "node:crypto"
import { z } from "zod"

import { AuthError } from "@/lib/auth/errors"
import type { RequestContext, SessionPrincipal } from "@/lib/auth/types"
import {
  decryptNationalId,
  encryptNationalId,
  maskNationalId,
  mobileIdentityHmac,
  nameFingerprint,
  nationalIdHmac,
} from "@/lib/identity/crypto"
import { assertRecentIdentityStepUp } from "@/lib/identity/policy"
import { identityProvider, identityProviderMode } from "@/lib/identity/provider"
import { identityRepository } from "@/lib/identity/repository"
import type { IdentityDecisionStatus, PublicIdentityStatus } from "@/lib/identity/types"
import { normalizeIranNationalId, normalizePersianText } from "@/lib/localization/normalize-fa"

const submissionSchema = z.object({
  firstName: z.string().trim().min(2).max(100),
  lastName: z.string().trim().min(2).max(100),
  nationalId: z.string().trim().min(10).max(20),
})

function claimsMatch(input: {
  firstName: string
  lastName: string
  mobileNormalized: string
}, matched: {
  firstName: string
  lastName: string
  mobileNormalized: string
} | undefined): boolean {
  if (!matched) return false
  return normalizePersianText(input.firstName) === normalizePersianText(matched.firstName)
    && normalizePersianText(input.lastName) === normalizePersianText(matched.lastName)
    && input.mobileNormalized === matched.mobileNormalized
}

export async function getIdentityStatus(principal: SessionPrincipal): Promise<PublicIdentityStatus> {
  const latest = await identityRepository.latestAttempt(principal.userId)
  if (!latest) {
    return {
      status: principal.identityStatus === "VERIFIED" ? "VERIFIED" : "UNVERIFIED",
      providerMode: identityProviderMode(),
      submittedAt: null,
      decidedAt: null,
      reasonCode: null,
    }
  }

  return {
    status: latest.status as IdentityDecisionStatus,
    providerMode: identityProviderMode(),
    submittedAt: latest.submittedAt,
    decidedAt: latest.decidedAt,
    reasonCode: latest.decisionReasonCode,
  }
}

export async function submitIdentityVerification(
  principal: SessionPrincipal,
  rawInput: unknown,
  context: RequestContext,
): Promise<PublicIdentityStatus> {
  const input = submissionSchema.parse(rawInput)
  const firstName = normalizePersianText(input.firstName)
  const lastName = normalizePersianText(input.lastName)
  const nationalId = normalizeIranNationalId(input.nationalId)
  const user = await identityRepository.userProfile(principal.userId)

  if (!user || !user.profile?.firstName || !user.profile.lastName) {
    throw new AuthError("PROFILE_INCOMPLETE", "ابتدا نام و نام خانوادگی پروفایل را تکمیل کنید.", 409)
  }

  if (
    normalizePersianText(user.profile.firstName) !== firstName
    || normalizePersianText(user.profile.lastName) !== lastName
  ) {
    throw new AuthError("PROFILE_IDENTITY_MISMATCH", "نام واردشده با پروفایل حساب یکسان نیست.", 400)
  }

  const provider = identityProvider()
  const now = new Date()
  const attemptId = randomUUID()
  const nationalFingerprint = nationalIdHmac(nationalId)
  const encrypted = encryptNationalId(nationalId)

  try {
    await identityRepository.transaction((tx) => identityRepository.createSubmission(tx, {
      id: attemptId,
      userId: principal.userId,
      providerKey: provider.key,
      nationalIdHmac: nationalFingerprint,
      encryptedNationalId: encrypted,
      encryptionKeyVersion: process.env.PII_ENCRYPTION_KEY_VERSION || "v1",
      mobileHmac: mobileIdentityHmac(principal.mobileNormalized),
      nameFingerprint: nameFingerprint(firstName, lastName),
      now,
      correlationId: context.correlationId,
    }))
  } catch (error) {
    if (error instanceof Error && error.message === "IDENTITY_ALREADY_USED") {
      throw new AuthError("IDENTITY_ALREADY_USED", "این اطلاعات هویتی قبلاً برای حساب دیگری ثبت شده است.", 409)
    }
    throw error
  }

  let providerDecision
  try {
    providerDecision = await provider.verify({
      firstName,
      lastName,
      mobileNormalized: principal.mobileNormalized,
      nationalId,
    })
  } catch (error) {
    console.error(JSON.stringify({
      event: "identity.provider.failed",
      providerKey: provider.key,
      correlationId: context.correlationId,
      errorName: error instanceof Error ? error.name : "unknown",
    }))
    providerDecision = {
      status: "REQUIRES_REVIEW" as const,
      providerReference: `provider-failure-${attemptId}`,
      reasonCode: "PROVIDER_UNAVAILABLE",
    }
  }

  let status = providerDecision.status
  let reasonCode = providerDecision.reasonCode
  if (status === "VERIFIED" && !claimsMatch({ firstName, lastName, mobileNormalized: principal.mobileNormalized }, providerDecision.matchedClaims)) {
    status = "REQUIRES_REVIEW"
    reasonCode = "CLAIM_MISMATCH"
  }

  const decisionTime = new Date()
  await identityRepository.transaction((tx) => identityRepository.finalizeDecision(tx, {
    attemptId,
    userId: principal.userId,
    status,
    providerReference: providerDecision.providerReference,
    reasonCode,
    now: decisionTime,
    correlationId: context.correlationId,
  }))

  return {
    status,
    providerMode: identityProviderMode(),
    submittedAt: now,
    decidedAt: decisionTime,
    reasonCode: reasonCode ?? null,
  }
}

export async function readSensitiveIdentity(
  principal: SessionPrincipal,
  targetUserId: string,
  reason: string | null,
  context: RequestContext,
) {
  assertRecentIdentityStepUp(principal)
  const validatedReason = z.string().trim().min(10).max(500).parse(reason)
  const identity = await identityRepository.sensitiveIdentity(z.string().uuid().parse(targetUserId))
  if (!identity) throw new AuthError("IDENTITY_NOT_FOUND", "اطلاعات هویتی یافت نشد.", 404)

  const nationalId = decryptNationalId(identity.encryptedNationalId)
  await identityRepository.auditSensitiveRead({
    actorUserId: principal.userId,
    targetUserId: identity.userId,
    resourceId: identity.id,
    reason: validatedReason,
    correlationId: context.correlationId,
  })

  return {
    userId: identity.userId,
    nationalId,
    nationalIdMasked: maskNationalId(nationalId),
    encryptionKeyVersion: identity.encryptionKeyVersion,
    verifiedAt: identity.verifiedAt,
  }
}
