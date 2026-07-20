import { randomInt } from "node:crypto"
import { afterEach, beforeAll, describe, expect, it } from "vitest"

import { requestCustomerOtp, updateOwnProfile, verifyCustomerOtp } from "@/lib/auth/service"
import type { RequestContext, SessionPrincipal } from "@/lib/auth/types"
import { readSensitiveIdentity, submitIdentityVerification } from "@/lib/identity/service"
import { prisma } from "@/lib/infrastructure/prisma"

const createdUserIds = new Set<string>()
const createdMobiles = new Set<string>()

function mobile(): string {
  const value = `094${randomInt(10_000_000, 99_999_999)}`
  createdMobiles.add(value)
  return value
}

function context(label: string): RequestContext {
  return {
    correlationId: `identity-${label}-${Date.now()}-${randomInt(1000, 9999)}`,
    ipAddress: `127.0.3.${randomInt(2, 240)}`,
    userAgent: "vitest-identity-integration",
  }
}

async function customer(firstName = "مهدی", lastName = "آزمایشی") {
  const value = mobile()
  const challenge = await requestCustomerOtp(value, context("otp-request"))
  const authenticated = await verifyCustomerOtp({
    mobile: value,
    challengeId: challenge.challengeId,
    code: challenge.developmentCode,
  }, context("otp-verify"))
  createdUserIds.add(authenticated.principal.userId)
  await updateOwnProfile(authenticated.principal, { firstName, lastName }, context("profile"))
  return { ...authenticated, firstName, lastName }
}

beforeAll(() => {
  process.env.AUTH_SECRET ||= "identity-auth-secret-123456789"
  process.env.PASSWORD_PEPPER ||= "identity-password-pepper-123456789"
  process.env.NATIONAL_ID_HMAC_KEY = "identity-national-hmac-key-123456789"
  process.env.PII_ENCRYPTION_KEY = "identity-encryption-key-123456789"
  process.env.PII_ENCRYPTION_KEY_VERSION = "integration-v1"
  process.env.IDENTITY_PROVIDER = "mock"
  process.env.SMS_PROVIDER = "mock"
  process.env.APP_ENV = "test"
})

afterEach(async () => {
  for (const userId of createdUserIds) {
    await prisma.session.deleteMany({ where: { userId } })
    await prisma.userRole.deleteMany({ where: { userId } })
    await prisma.auditLog.deleteMany({ where: { OR: [{ actorUserId: userId }, { scopeId: userId }] } })
    await prisma.identityVerificationAttempt.deleteMany({ where: { userId } })
    await prisma.sensitiveIdentity.deleteMany({ where: { userId } })
    await prisma.$executeRaw`DELETE FROM "OtpChallenge" WHERE "userId" = ${userId}::uuid`
    await prisma.user.deleteMany({ where: { id: userId } })
  }
  for (const value of createdMobiles) {
    await prisma.$executeRaw`DELETE FROM "OtpChallenge" WHERE "mobileNormalized" = ${value}`
  }
  createdUserIds.clear()
  createdMobiles.clear()
})

describe("customer identity verification", () => {
  it("persists HMAC/encrypted identity and verifies exact claims", async () => {
    const account = await customer()
    const decision = await submitIdentityVerification(account.principal, {
      firstName: account.firstName,
      lastName: account.lastName,
      nationalId: "1234567893",
    }, context("verified"))

    expect(decision.status).toBe("VERIFIED")
    const user = await prisma.user.findUniqueOrThrow({ where: { id: account.principal.userId } })
    const sensitive = await prisma.sensitiveIdentity.findUniqueOrThrow({ where: { userId: account.principal.userId } })
    expect(user.identityStatus).toBe("VERIFIED")
    expect(sensitive.encryptedNationalId).not.toContain("1234567893")
    expect(sensitive.nationalIdHmac).not.toContain("1234567893")
    expect(sensitive.verifiedAt).not.toBeNull()
  })

  it("routes provider claim mismatches to manual review", async () => {
    const account = await customer()
    const decision = await submitIdentityVerification(account.principal, {
      firstName: account.firstName,
      lastName: account.lastName,
      nationalId: "1234567892",
    }, context("mismatch"))

    expect(decision).toMatchObject({ status: "REQUIRES_REVIEW", reasonCode: "CLAIM_MISMATCH" })
    const attempt = await prisma.identityVerificationAttempt.findFirstOrThrow({
      where: { userId: account.principal.userId },
      orderBy: { createdAt: "desc" },
    })
    expect(attempt.status).toBe("REQUIRES_REVIEW")
  })

  it("prevents one national identity from being attached to two accounts", async () => {
    const first = await customer("مهدی", "اول")
    const second = await customer("مهدی", "دوم")
    await submitIdentityVerification(first.principal, {
      firstName: first.firstName,
      lastName: first.lastName,
      nationalId: "3333333333",
    }, context("duplicate-first"))

    await expect(submitIdentityVerification(second.principal, {
      firstName: second.firstName,
      lastName: second.lastName,
      nationalId: "3333333333",
    }, context("duplicate-second"))).rejects.toMatchObject({ code: "IDENTITY_ALREADY_USED" })
  })

  it("audits authorized sensitive reads without placing national ID in audit metadata", async () => {
    const account = await customer()
    await submitIdentityVerification(account.principal, {
      firstName: account.firstName,
      lastName: account.lastName,
      nationalId: "9876543213",
    }, context("sensitive-target"))

    const admin = await prisma.user.create({ data: { mobileNormalized: mobile(), status: "ACTIVE" } })
    createdUserIds.add(admin.id)
    const principal: SessionPrincipal = {
      sessionId: "identity-admin-session",
      userId: admin.id,
      mobileNormalized: admin.mobileNormalized,
      userStatus: "ACTIVE",
      identityStatus: "UNVERIFIED",
      authMethod: "PASSWORD_2FA",
      twoFactorVerifiedAt: new Date(),
      mustChangePassword: false,
      roleKeys: ["identity_specialist"],
      permissions: ["identity.sensitive-read"],
    }
    const accessContext = context("sensitive-read")
    const result = await readSensitiveIdentity(
      principal,
      account.principal.userId,
      "بررسی پرونده احراز هویت مشتری",
      accessContext,
    )

    expect(result.nationalId).toBe("9876543213")
    const audit = await prisma.auditLog.findFirstOrThrow({
      where: { actorUserId: admin.id, correlationId: accessContext.correlationId },
    })
    expect(audit.action).toBe("identity.sensitive-data.read")
    expect(JSON.stringify(audit.metadata ?? {})).not.toContain("9876543213")
  })
})
