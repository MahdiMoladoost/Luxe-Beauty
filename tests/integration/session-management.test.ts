import { randomInt, randomUUID } from "node:crypto"
import { afterEach, beforeAll, describe, expect, it } from "vitest"

import { generateSessionToken, hashSessionToken } from "@/lib/auth/crypto"
import { requestCustomerOtp, verifyCustomerOtp } from "@/lib/auth/service"
import { listOwnSessions, revokeOwnSession } from "@/lib/auth/session-management"
import type { RequestContext } from "@/lib/auth/types"
import { prisma } from "@/lib/infrastructure/prisma"

const createdUserIds = new Set<string>()
const createdMobiles = new Set<string>()

function mobile(): string {
  const value = `097${randomInt(10_000_000, 99_999_999)}`
  createdMobiles.add(value)
  return value
}

function context(label: string): RequestContext {
  return {
    correlationId: `session-management-${label}-${Date.now()}`,
    ipAddress: `127.0.1.${randomInt(2, 250)}`,
    userAgent: `vitest-session-${label}`,
  }
}

async function insertSession(userId: string, userAgent: string): Promise<string> {
  const id = randomUUID()
  const token = generateSessionToken()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 60 * 60 * 1000)
  await prisma.$executeRaw`
    INSERT INTO "Session" (
      "id", "userId", "tokenHash", "userAgentSummary", "authMethod",
      "expiresAt", "idleExpiresAt", "lastSeenAt", "createdAt"
    ) VALUES (
      ${id}::uuid, ${userId}::uuid, ${hashSessionToken(token)}, ${userAgent}, 'OTP',
      ${expiresAt}, ${expiresAt}, ${now}, ${now}
    )
  `
  return id
}

beforeAll(() => {
  process.env.AUTH_SECRET ||= "integration-auth-secret-123456789"
  process.env.PASSWORD_PEPPER ||= "integration-password-pepper-123456789"
  process.env.SMS_PROVIDER = "mock"
  process.env.APP_ENV = "test"
})

afterEach(async () => {
  for (const userId of createdUserIds) {
    await prisma.session.deleteMany({ where: { userId } })
    await prisma.userRole.deleteMany({ where: { userId } })
    await prisma.auditLog.deleteMany({ where: { actorUserId: userId } })
    await prisma.$executeRaw`DELETE FROM "OtpChallenge" WHERE "userId" = ${userId}::uuid`
    await prisma.user.deleteMany({ where: { id: userId } })
  }
  for (const value of createdMobiles) {
    await prisma.$executeRaw`DELETE FROM "OtpChallenge" WHERE "mobileNormalized" = ${value}`
  }
  createdUserIds.clear()
  createdMobiles.clear()
})

describe("session and device management", () => {
  it("lists active devices and revokes an owned session", async () => {
    const value = mobile()
    const challenge = await requestCustomerOtp(value, context("request"))
    const authenticated = await verifyCustomerOtp({ mobile: value, challengeId: challenge.challengeId, code: challenge.developmentCode }, context("verify"))
    createdUserIds.add(authenticated.principal.userId)

    const secondarySessionId = await insertSession(authenticated.principal.userId, "secondary-test-device")
    const sessions = await listOwnSessions(authenticated.principal)
    expect(sessions).toHaveLength(2)
    expect(sessions.some((session) => session.current)).toBe(true)
    expect(sessions.some((session) => session.id === secondarySessionId)).toBe(true)

    const result = await revokeOwnSession(authenticated.principal, secondarySessionId, context("revoke"))
    expect(result.currentSessionRevoked).toBe(false)
    expect((await listOwnSessions(authenticated.principal)).some((session) => session.id === secondarySessionId)).toBe(false)
  })

  it("prevents cross-user session revocation", async () => {
    const ownerMobile = mobile()
    const ownerChallenge = await requestCustomerOtp(ownerMobile, context("owner-request"))
    const owner = await verifyCustomerOtp({ mobile: ownerMobile, challengeId: ownerChallenge.challengeId, code: ownerChallenge.developmentCode }, context("owner-verify"))
    createdUserIds.add(owner.principal.userId)

    const otherMobile = mobile()
    const otherUser = await prisma.user.create({ data: { mobileNormalized: otherMobile, status: "ACTIVE" } })
    createdUserIds.add(otherUser.id)
    const otherSessionId = await insertSession(otherUser.id, "other-user-device")

    await expect(revokeOwnSession(owner.principal, otherSessionId, context("idor"))).rejects.toMatchObject({ code: "SESSION_NOT_FOUND" })
    const rows = await prisma.$queryRaw<Array<{ revokedAt: Date | null }>>`
      SELECT "revokedAt" FROM "Session" WHERE "id" = ${otherSessionId}::uuid
    `
    expect(rows[0]?.revokedAt).toBeNull()
  })
})
