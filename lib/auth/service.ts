import { randomUUID } from "node:crypto"
import { z } from "zod"

import { authConfig } from "@/lib/auth/config"
import {
  fingerprint,
  generateOtp,
  generateSessionToken,
  hashOtp,
  hashPassword,
  hashSessionToken,
  maskMobile,
  verifyOtpHash,
  verifyPassword,
} from "@/lib/auth/crypto"
import { AuthError, invalidCredentials, invalidOtp } from "@/lib/auth/errors"
import { authRepository, type OtpChallengeRow } from "@/lib/auth/repository"
import { mayExposeDevelopmentOtp, smsProvider } from "@/lib/auth/sms"
import type { AuthMethod, OtpPurpose, RequestContext, SessionPrincipal } from "@/lib/auth/types"
import { normalizeIranMobile, normalizePersianText, toLatinDigits } from "@/lib/localization/normalize-fa"

const mobileSchema = z.string().trim().min(10).max(20).transform(normalizeIranMobile)
const otpSchema = z.string().transform(toLatinDigits).pipe(z.string().regex(/^\d{6}$/))
const challengeIdSchema = z.string().uuid()
const passwordSchema = z.string().min(1).max(128)

export type AuthenticatedSession = {
  token: string
  principal: SessionPrincipal
  expiresAt: Date
}

export type OtpRequestResult = {
  challengeId: string
  mobileMasked: string
  expiresAt: Date
  resendAfter: Date
  developmentCode?: string
}

function addSeconds(date: Date, seconds: number): Date {
  return new Date(date.getTime() + seconds * 1000)
}

function contextHashes(context: RequestContext): { ipHash: string | null; userAgentSummary: string | null } {
  return {
    ipHash: context.ipAddress ? fingerprint(`ip:${context.ipAddress}`) : null,
    userAgentSummary: context.userAgent?.slice(0, 300) ?? null,
  }
}

async function createOtpChallenge(input: {
  mobileNormalized: string
  purpose: OtpPurpose
  context: RequestContext
  userId?: string | null
}): Promise<OtpRequestResult> {
  const now = new Date()
  const challengeId = randomUUID()
  const code = generateOtp()
  const expiresAt = addSeconds(now, authConfig.otpTtlSeconds)
  const resendAfter = addSeconds(now, authConfig.otpResendCooldownSeconds)
  const mobileFingerprint = fingerprint(`mobile:${input.mobileNormalized}`)
  const { ipHash, userAgentSummary } = contextHashes(input.context)

  await authRepository.transaction(async (tx) => {
    const mobileRate = await authRepository.consumeRateLimit(tx, {
      keyHash: mobileFingerprint,
      action: `otp:${input.purpose}:mobile`,
      limit: authConfig.otpMobileWindowLimit,
      windowSeconds: authConfig.otpMobileWindowSeconds,
      blockSeconds: authConfig.otpMobileWindowSeconds,
      now,
    })
    if (!mobileRate.allowed) {
      throw new AuthError("RATE_LIMITED", "تعداد درخواست‌ها بیش از حد مجاز است.", 429, {
        retryAfterSeconds: mobileRate.retryAfterSeconds,
      })
    }

    if (ipHash) {
      const ipRate = await authRepository.consumeRateLimit(tx, {
        keyHash: ipHash,
        action: `otp:${input.purpose}:ip`,
        limit: authConfig.otpIpWindowLimit,
        windowSeconds: authConfig.otpIpWindowSeconds,
        blockSeconds: authConfig.otpIpWindowSeconds,
        now,
      })
      if (!ipRate.allowed) {
        throw new AuthError("RATE_LIMITED", "تعداد درخواست‌ها بیش از حد مجاز است.", 429, {
          retryAfterSeconds: ipRate.retryAfterSeconds,
        })
      }
    }

    const active = await authRepository.latestActiveOtp(tx, input.mobileNormalized, input.purpose)
    if (active && active.resendAfter > now) {
      throw new AuthError("OTP_COOLDOWN", "برای ارسال مجدد کمی صبر کنید.", 429, {
        retryAfterSeconds: Math.max(1, Math.ceil((active.resendAfter.getTime() - now.getTime()) / 1000)),
      })
    }

    await authRepository.invalidateActiveOtp(tx, input.mobileNormalized, input.purpose, now)
    await authRepository.createOtp(tx, {
      id: challengeId,
      userId: input.userId,
      mobileNormalized: input.mobileNormalized,
      purpose: input.purpose,
      codeHash: hashOtp(challengeId, code),
      maxAttempts: authConfig.otpMaxAttempts,
      expiresAt,
      resendAfter,
      requestedIpHash: ipHash,
      userAgentSummary,
      now,
    })
    await authRepository.audit(tx, {
      actorUserId: input.userId ?? null,
      action: "auth.otp.requested",
      resourceType: "OtpChallenge",
      resourceId: challengeId,
      correlationId: input.context.correlationId,
      metadata: {
        purpose: input.purpose,
        mobileFingerprint: mobileFingerprint.slice(0, 32),
      },
    })
  })

  try {
    await smsProvider().sendOtp({
      mobileNormalized: input.mobileNormalized,
      code,
      purpose: input.purpose,
      expiresInSeconds: authConfig.otpTtlSeconds,
      correlationId: input.context.correlationId,
    })
  } catch (error) {
    await authRepository.transaction(async (tx) => {
      await authRepository.invalidateOtpById(tx, challengeId, new Date())
      await authRepository.audit(tx, {
        actorUserId: input.userId ?? null,
        action: "auth.otp.delivery-failed",
        resourceType: "OtpChallenge",
        resourceId: challengeId,
        correlationId: input.context.correlationId,
      })
    })
    console.error(JSON.stringify({ event: "auth.otp.delivery-failed", correlationId: input.context.correlationId, error }))
    throw new AuthError("SMS_DELIVERY_FAILED", "ارسال پیامک انجام نشد. دوباره تلاش کنید.", 503)
  }

  return {
    challengeId,
    mobileMasked: maskMobile(input.mobileNormalized),
    expiresAt,
    resendAfter,
    ...(mayExposeDevelopmentOtp() ? { developmentCode: code } : {}),
  }
}

async function verifyChallenge(input: {
  challengeId: string
  code: string
  purpose: OtpPurpose
  expectedMobile?: string
  expectedUserId?: string
  context: RequestContext
}): Promise<OtpChallengeRow> {
  const challengeId = challengeIdSchema.parse(input.challengeId)
  const code = otpSchema.parse(input.code)
  const now = new Date()

  const outcome = await authRepository.transaction(async (tx) => {
    const challenge = await authRepository.otpByIdForUpdate(tx, challengeId, input.purpose)
    const unavailable = !challenge
      || challenge.consumedAt !== null
      || challenge.invalidatedAt !== null
      || challenge.expiresAt <= now
      || challenge.attemptCount >= challenge.maxAttempts
      || (input.expectedMobile !== undefined && challenge.mobileNormalized !== input.expectedMobile)
      || (input.expectedUserId !== undefined && challenge.userId !== input.expectedUserId)

    if (unavailable || !challenge) return { ok: false as const }

    if (!verifyOtpHash(challenge.id, code, challenge.codeHash)) {
      const attemptCount = await authRepository.incrementOtpAttempt(tx, challenge.id)
      await authRepository.audit(tx, {
        actorUserId: challenge.userId,
        action: "auth.otp.failed",
        resourceType: "OtpChallenge",
        resourceId: challenge.id,
        correlationId: input.context.correlationId,
        metadata: { purpose: challenge.purpose, attemptCount },
      })
      return { ok: false as const }
    }

    await authRepository.consumeOtp(tx, challenge.id, now)
    await authRepository.audit(tx, {
      actorUserId: challenge.userId,
      action: "auth.otp.verified",
      resourceType: "OtpChallenge",
      resourceId: challenge.id,
      correlationId: input.context.correlationId,
      metadata: { purpose: challenge.purpose },
    })
    return { ok: true as const, challenge }
  })

  if (!outcome.ok) throw invalidOtp()
  return outcome.challenge
}

async function issueSession(input: {
  userId: string
  authMethod: AuthMethod
  context: RequestContext
  twoFactorVerifiedAt?: Date | null
}): Promise<AuthenticatedSession> {
  const now = new Date()
  const token = generateSessionToken()
  const tokenHash = hashSessionToken(token)
  const expiresAt = addSeconds(now, authConfig.sessionAbsoluteTtlSeconds)
  const idleExpiresAt = addSeconds(now, authConfig.sessionIdleTtlSeconds)
  const sessionId = randomUUID()
  const { ipHash, userAgentSummary } = contextHashes(input.context)

  await authRepository.transaction(async (tx) => {
    await authRepository.createSession(tx, {
      id: sessionId,
      userId: input.userId,
      tokenHash,
      ipHash,
      userAgentSummary,
      authMethod: input.authMethod,
      twoFactorVerifiedAt: input.twoFactorVerifiedAt ?? null,
      expiresAt,
      idleExpiresAt,
      now,
    })
    await authRepository.audit(tx, {
      actorUserId: input.userId,
      action: "auth.session.created",
      resourceType: "Session",
      resourceId: sessionId,
      correlationId: input.context.correlationId,
      metadata: { authMethod: input.authMethod },
    })
  })

  const principal = await principalFromToken(token)
  if (!principal) throw new Error("Session was created but could not be loaded")
  return { token, principal, expiresAt }
}

export async function requestCustomerOtp(rawMobile: unknown, context: RequestContext): Promise<OtpRequestResult> {
  const mobileNormalized = mobileSchema.parse(rawMobile)
  return createOtpChallenge({ mobileNormalized, purpose: "CUSTOMER_LOGIN", context })
}

export async function verifyCustomerOtp(rawInput: unknown, context: RequestContext): Promise<AuthenticatedSession> {
  const input = z.object({
    mobile: mobileSchema,
    challengeId: challengeIdSchema,
    code: otpSchema,
  }).parse(rawInput)

  const challenge = await verifyChallenge({
    challengeId: input.challengeId,
    code: input.code,
    purpose: "CUSTOMER_LOGIN",
    expectedMobile: input.mobile,
    context,
  })

  const user = await authRepository.transaction(async (tx) => {
    const activeUser = await authRepository.upsertActiveUser(tx, challenge.mobileNormalized)
    await authRepository.ensureUserRole(tx, activeUser.id, "customer")
    await authRepository.audit(tx, {
      actorUserId: activeUser.id,
      action: "auth.customer.signed-in",
      resourceType: "User",
      resourceId: activeUser.id,
      correlationId: context.correlationId,
    })
    return activeUser
  })

  return issueSession({ userId: user.id, authMethod: "OTP", context })
}

export async function staffPasswordLogin(rawInput: unknown, context: RequestContext): Promise<
  | { requiresTwoFactor: true; challenge: OtpRequestResult }
  | { requiresTwoFactor: false; session: AuthenticatedSession }
> {
  const input = z.object({ mobile: mobileSchema, password: passwordSchema }).parse(rawInput)
  const now = new Date()
  const mobileFingerprint = fingerprint(`mobile:${input.mobile}`)
  const credential = await authRepository.credentialByMobile(input.mobile)

  await authRepository.transaction(async (tx) => {
    const rate = await authRepository.consumeRateLimit(tx, {
      keyHash: mobileFingerprint,
      action: "staff-password-login",
      limit: authConfig.loginFailureLimit * 3,
      windowSeconds: authConfig.loginLockSeconds,
      blockSeconds: authConfig.loginLockSeconds,
      now,
    })
    if (!rate.allowed) {
      throw new AuthError("RATE_LIMITED", "تعداد تلاش‌های ورود بیش از حد مجاز است.", 429, {
        retryAfterSeconds: rate.retryAfterSeconds,
      })
    }
  })

  if (!credential) {
    verifyPassword(input.password, hashPassword("dummy-account-000"))
    throw invalidCredentials()
  }

  if (credential.status !== "ACTIVE") throw invalidCredentials()
  if (credential.lockedUntil && credential.lockedUntil > now) {
    throw new AuthError("ACCOUNT_TEMPORARILY_LOCKED", "ورود این حساب موقتاً قفل شده است.", 423, {
      retryAfterSeconds: Math.ceil((credential.lockedUntil.getTime() - now.getTime()) / 1000),
    })
  }

  if (!verifyPassword(input.password, credential.passwordHash)) {
    const lockedUntil = addSeconds(now, authConfig.loginLockSeconds)
    await authRepository.registerFailedLogin(credential.userId, authConfig.loginFailureLimit, lockedUntil, now)
    await authRepository.transaction((tx) => authRepository.audit(tx, {
      actorUserId: credential.userId,
      action: "auth.password.failed",
      resourceType: "User",
      resourceId: credential.userId,
      correlationId: context.correlationId,
    }))
    throw invalidCredentials()
  }

  const authorization = await authRepository.principalAuthorization(credential.userId)
  if (authorization.roleKeys.length === 0 || authorization.roleKeys.every((key) => key === "customer")) {
    throw invalidCredentials()
  }

  await authRepository.transaction(async (tx) => {
    await authRepository.resetFailedLogin(tx, credential.userId, now)
    await authRepository.audit(tx, {
      actorUserId: credential.userId,
      action: "auth.password.verified",
      resourceType: "User",
      resourceId: credential.userId,
      correlationId: context.correlationId,
    })
  })

  if (credential.twoFactorRequired) {
    const challenge = await createOtpChallenge({
      mobileNormalized: credential.mobileNormalized,
      purpose: "STAFF_2FA",
      userId: credential.userId,
      context,
    })
    return { requiresTwoFactor: true, challenge }
  }

  const session = await issueSession({ userId: credential.userId, authMethod: "PASSWORD", context })
  return { requiresTwoFactor: false, session }
}

export async function verifyStaffTwoFactor(rawInput: unknown, context: RequestContext): Promise<AuthenticatedSession> {
  const input = z.object({ challengeId: challengeIdSchema, code: otpSchema }).parse(rawInput)
  const challenge = await verifyChallenge({
    challengeId: input.challengeId,
    code: input.code,
    purpose: "STAFF_2FA",
    context,
  })
  if (!challenge.userId) throw invalidOtp()

  return issueSession({
    userId: challenge.userId,
    authMethod: "PASSWORD_2FA",
    twoFactorVerifiedAt: new Date(),
    context,
  })
}

export async function requestPasswordReset(rawMobile: unknown, context: RequestContext): Promise<{
  accepted: true
  challenge?: OtpRequestResult
}> {
  const mobileNormalized = mobileSchema.parse(rawMobile)
  const existing = await authRepository.credentialExistsForMobile(mobileNormalized)
  if (!existing) return { accepted: true }

  const challenge = await createOtpChallenge({
    mobileNormalized,
    purpose: "PASSWORD_RESET",
    userId: existing.userId,
    context,
  })
  return { accepted: true, challenge }
}

export async function resetPassword(rawInput: unknown, context: RequestContext): Promise<void> {
  const input = z.object({
    challengeId: challengeIdSchema,
    code: otpSchema,
    newPassword: z.string().min(12).max(128),
  }).parse(rawInput)

  const challenge = await verifyChallenge({
    challengeId: input.challengeId,
    code: input.code,
    purpose: "PASSWORD_RESET",
    context,
  })
  if (!challenge.userId) throw invalidOtp()

  const passwordHash = hashPassword(input.newPassword)
  const now = new Date()
  await authRepository.transaction(async (tx) => {
    await authRepository.updatePassword(tx, challenge.userId!, passwordHash, false, now)
    await authRepository.revokeAllSessions(tx, challenge.userId!, "PASSWORD_RESET", now)
    await authRepository.audit(tx, {
      actorUserId: challenge.userId,
      action: "auth.password.reset",
      resourceType: "User",
      resourceId: challenge.userId,
      correlationId: context.correlationId,
    })
  })
}

export async function changePassword(
  principal: SessionPrincipal,
  rawInput: unknown,
  context: RequestContext,
): Promise<void> {
  const input = z.object({
    currentPassword: passwordSchema,
    newPassword: z.string().min(12).max(128),
  }).parse(rawInput)
  const newPasswordHash = hashPassword(input.newPassword)
  const now = new Date()

  const outcome = await authRepository.transaction(async (tx) => {
    const credential = await authRepository.credentialByUserId(tx, principal.userId)
    if (!credential || !verifyPassword(input.currentPassword, credential.passwordHash)) return false

    await authRepository.updatePassword(tx, principal.userId, newPasswordHash, false, now)
    await authRepository.revokeAllSessions(tx, principal.userId, "PASSWORD_CHANGED", now)
    await authRepository.audit(tx, {
      actorUserId: principal.userId,
      action: "auth.password.changed",
      resourceType: "User",
      resourceId: principal.userId,
      correlationId: context.correlationId,
    })
    return true
  })

  if (!outcome) throw invalidCredentials()
}

export async function principalFromToken(token: string | undefined): Promise<SessionPrincipal | null> {
  if (!token) return null
  const tokenHash = hashSessionToken(token)
  const session = await authRepository.sessionByTokenHash(tokenHash)
  if (!session) return null

  const now = new Date()
  if (session.revokedAt || session.expiresAt <= now || session.idleExpiresAt <= now || session.status !== "ACTIVE") {
    if (!session.revokedAt) await authRepository.revokeSessionByHash(tokenHash, "SESSION_EXPIRED", now)
    return null
  }

  const authorization = await authRepository.principalAuthorization(session.userId)
  await authRepository.touchSession(session.id, addSeconds(now, authConfig.sessionIdleTtlSeconds), now)

  return {
    sessionId: session.id,
    userId: session.userId,
    mobileNormalized: session.mobileNormalized,
    userStatus: session.status,
    identityStatus: session.identityStatus,
    authMethod: session.authMethod,
    twoFactorVerifiedAt: session.twoFactorVerifiedAt,
    mustChangePassword: authorization.mustChangePassword,
    roleKeys: authorization.roleKeys,
    permissions: authorization.permissions,
  }
}

export async function logoutCurrent(token: string | undefined): Promise<void> {
  if (!token) return
  await authRepository.revokeSessionByHash(hashSessionToken(token), "USER_LOGOUT", new Date())
}

export async function logoutAll(principal: SessionPrincipal, context: RequestContext): Promise<number> {
  const now = new Date()
  return authRepository.transaction(async (tx) => {
    const count = await authRepository.revokeAllSessions(tx, principal.userId, "USER_LOGOUT_ALL", now)
    await authRepository.audit(tx, {
      actorUserId: principal.userId,
      action: "auth.session.revoked-all",
      resourceType: "User",
      resourceId: principal.userId,
      correlationId: context.correlationId,
      metadata: { revokedSessions: count },
    })
    return count
  })
}

export async function updateOwnProfile(principal: SessionPrincipal, rawInput: unknown, context: RequestContext) {
  const input = z.object({
    firstName: z.string().trim().min(2).max(100),
    lastName: z.string().trim().min(2).max(100),
  }).parse(rawInput)

  const firstName = normalizePersianText(input.firstName)
  const lastName = normalizePersianText(input.lastName)
  return authRepository.transaction(async (tx) => {
    const profile = await authRepository.updateProfile(tx, principal.userId, {
      firstName,
      lastName,
      normalizedName: normalizePersianText(`${firstName} ${lastName}`),
    })
    await authRepository.audit(tx, {
      actorUserId: principal.userId,
      action: "profile.updated",
      resourceType: "UserProfile",
      resourceId: profile.id,
      correlationId: context.correlationId,
    })
    return profile
  })
}

export async function getOwnAccount(principal: SessionPrincipal) {
  const profile = await authRepository.profileByUserId(principal.userId)
  return {
    userId: principal.userId,
    mobileNormalized: principal.mobileNormalized,
    identityStatus: principal.identityStatus,
    roles: principal.roleKeys,
    permissions: principal.permissions,
    mustChangePassword: principal.mustChangePassword,
    profile,
  }
}
