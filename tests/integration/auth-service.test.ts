import { randomInt } from "node:crypto"
import { afterEach, beforeAll, describe, expect, it } from "vitest"

import { hashPassword } from "@/lib/auth/crypto"
import { AuthError } from "@/lib/auth/errors"
import {
  getOwnAccount,
  logoutAll,
  principalFromToken,
  requestCustomerOtp,
  staffPasswordLogin,
  updateOwnProfile,
  verifyCustomerOtp,
  verifyStaffTwoFactor,
} from "@/lib/auth/service"
import type { RequestContext } from "@/lib/auth/types"
import { prisma } from "@/lib/infrastructure/prisma"

const createdMobiles = new Set<string>()

function mobile(): string {
  const value = `099${randomInt(10_000_000, 99_999_999)}`
  createdMobiles.add(value)
  return value
}

function context(label: string): RequestContext {
  return {
    correlationId: `integration-${label}-${Date.now()}`,
    ipAddress: `127.0.0.${randomInt(2, 250)}`,
    userAgent: "vitest-auth-integration",
  }
}

async function cleanup() {
  await prisma.$executeRaw`DELETE FROM "AuthRateLimit"`
  for (const value of createdMobiles) {
    const user = await prisma.user.findUnique({ where: { mobileNormalized: value }, select: { id: true } })
    if (user) {
      await prisma.session.deleteMany({ where: { userId: user.id } })
      await prisma.userRole.deleteMany({ where: { userId: user.id } })
      await prisma.auditLog.deleteMany({ where: { actorUserId: user.id } })
      await prisma.$executeRaw`DELETE FROM "OtpChallenge" WHERE "mobileNormalized" = ${value}`
      await prisma.$executeRaw`DELETE FROM "LoginCredential" WHERE "userId" = ${user.id}::uuid`
      await prisma.user.delete({ where: { id: user.id } })
    } else {
      await prisma.$executeRaw`DELETE FROM "OtpChallenge" WHERE "mobileNormalized" = ${value}`
    }
  }
  createdMobiles.clear()
}

beforeAll(() => {
  process.env.AUTH_SECRET ||= "integration-auth-secret-123456789"
  process.env.PASSWORD_PEPPER ||= "integration-password-pepper-123456789"
  process.env.SMS_PROVIDER = "mock"
  process.env.APP_ENV = "test"
})

afterEach(cleanup)

describe("customer OTP and sessions", () => {
  it("registers, authenticates, persists profile and revokes all sessions", async () => {
    const value = mobile()
    const request = await requestCustomerOtp(value, context("customer-request"))
    expect(request.developmentCode).toMatch(/^\d{6}$/)

    const session = await verifyCustomerOtp({
      mobile: value,
      challengeId: request.challengeId,
      code: request.developmentCode,
    }, context("customer-verify"))

    expect(session.principal.roleKeys).toContain("customer")
    expect(await principalFromToken(session.token)).not.toBeNull()

    await updateOwnProfile(session.principal, { firstName: "مهدی", lastName: "آزمایشی" }, context("profile"))
    const account = await getOwnAccount(session.principal)
    expect(account.profile?.firstName).toBe("مهدی")

    const revoked = await logoutAll(session.principal, context("logout-all"))
    expect(revoked).toBeGreaterThanOrEqual(1)
    expect(await principalFromToken(session.token)).toBeNull()
  })

  it("enforces resend cooldown and OTP attempt limits", async () => {
    const cooldownMobile = mobile()
    await requestCustomerOtp(cooldownMobile, context("cooldown-one"))
    await expect(requestCustomerOtp(cooldownMobile, context("cooldown-two"))).rejects.toMatchObject({ code: "OTP_COOLDOWN" })

    const attemptMobile = mobile()
    const challenge = await requestCustomerOtp(attemptMobile, context("attempt-request"))
    for (let index = 0; index < 5; index += 1) {
      await expect(verifyCustomerOtp({
        mobile: attemptMobile,
        challengeId: challenge.challengeId,
        code: "000000",
      }, context(`attempt-${index}`))).rejects.toBeInstanceOf(AuthError)
    }
    await expect(verifyCustomerOtp({
      mobile: attemptMobile,
      challengeId: challenge.challengeId,
      code: challenge.developmentCode,
    }, context("attempt-exhausted"))).rejects.toMatchObject({ code: "INVALID_OTP" })
  })
})

describe("staff password and two-factor authentication", () => {
  it("requires password plus SMS second factor for a staff role", async () => {
    const value = mobile()
    const user = await prisma.user.create({ data: { mobileNormalized: value, status: "ACTIVE" } })
    const role = await prisma.role.findUniqueOrThrow({ where: { key: "support" } })
    await prisma.userRole.create({ data: { userId: user.id, roleId: role.id, scopeType: "PLATFORM" } })
    const encoded = hashPassword("StaffPassword123")
    await prisma.$executeRaw`
      INSERT INTO "LoginCredential" (
        "userId", "passwordHash", "passwordAlgorithm", "mustChangePassword", "twoFactorRequired", "createdAt", "updatedAt"
      ) VALUES (${user.id}::uuid, ${encoded}, 'scrypt-v1', false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `

    const login = await staffPasswordLogin({ mobile: value, password: "StaffPassword123" }, context("staff-password"))
    expect(login.requiresTwoFactor).toBe(true)
    if (!login.requiresTwoFactor) throw new Error("Expected second factor")

    const session = await verifyStaffTwoFactor({
      challengeId: login.challenge.challengeId,
      code: login.challenge.developmentCode,
    }, context("staff-2fa"))
    expect(session.principal.roleKeys).toContain("support")
    expect(session.principal.permissions).toContain("platform.access")
  })
})
