import { randomInt, randomUUID } from "node:crypto"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { NextRequest } from "next/server"

import { GET as listPermissionsRoute, POST as createPermissionRoute } from "@/app/api/admin/rbac/permissions/route"
import { GET as listRolesRoute, POST as createRoleRoute } from "@/app/api/admin/rbac/roles/route"
import { authConfig } from "@/lib/auth/config"
import { generateSessionToken, hashSessionToken } from "@/lib/auth/crypto"
import { requestCustomerOtp, verifyCustomerOtp } from "@/lib/auth/service"
import { prisma } from "@/lib/infrastructure/prisma"

const createdUserIds = new Set<string>()
const createdMobiles = new Set<string>()
const customRoleKey = `ci_custom_role_${randomInt(100_000, 999_999)}`
const customPermissionKey = `ci-resource-${randomInt(100_000, 999_999)}.manage`

beforeAll(() => {
  process.env.AUTH_SECRET ||= "integration-auth-secret-123456789"
  process.env.PASSWORD_PEPPER ||= "integration-password-pepper-123456789"
  process.env.SMS_PROVIDER = "mock"
  process.env.APP_ENV = "test"
})

afterAll(async () => {
  await prisma.role.deleteMany({ where: { key: customRoleKey } })
  await prisma.permission.deleteMany({ where: { key: customPermissionKey } })

  for (const userId of createdUserIds) {
    await prisma.session.deleteMany({ where: { userId } })
    await prisma.userRole.deleteMany({ where: { userId } })
    await prisma.auditLog.deleteMany({ where: { actorUserId: userId } })
    await prisma.$executeRaw`DELETE FROM "OtpChallenge" WHERE "userId" = ${userId}::uuid`
    await prisma.user.deleteMany({ where: { id: userId } })
  }

  for (const mobile of createdMobiles) {
    await prisma.$executeRaw`DELETE FROM "OtpChallenge" WHERE "mobileNormalized" = ${mobile}`
  }
})

function mobile(prefix: "096" | "098"): string {
  const value = `${prefix}${randomInt(10_000_000, 99_999_999)}`
  createdMobiles.add(value)
  return value
}

function request(url: string, token?: string, method: "GET" | "POST" = "GET", body?: unknown): NextRequest {
  const headers = new Headers()
  if (token) headers.set("cookie", `${authConfig.sessionCookieName}=${token}`)
  if (method === "POST") {
    headers.set("content-type", "application/json")
    headers.set("origin", "http://localhost:5000")
  }

  return new NextRequest(url, {
    method,
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
}

async function createCustomerToken(): Promise<string> {
  const value = mobile("098")
  const challenge = await requestCustomerOtp(value, {
    correlationId: `rbac-customer-request-${Date.now()}`,
    ipAddress: "127.0.2.31",
    userAgent: "vitest-rbac-customer",
  })
  const session = await verifyCustomerOtp({
    mobile: value,
    challengeId: challenge.challengeId,
    code: challenge.developmentCode,
  }, {
    correlationId: `rbac-customer-verify-${Date.now()}`,
    ipAddress: "127.0.2.31",
    userAgent: "vitest-rbac-customer",
  })
  createdUserIds.add(session.principal.userId)
  return session.token
}

async function createSuperAdminToken(): Promise<string> {
  const value = mobile("096")
  const user = await prisma.user.create({ data: { mobileNormalized: value, status: "ACTIVE" } })
  createdUserIds.add(user.id)
  const role = await prisma.role.findUniqueOrThrow({ where: { key: "super_admin" } })
  await prisma.userRole.create({ data: { userId: user.id, roleId: role.id, scopeType: "PLATFORM" } })

  const token = generateSessionToken()
  const id = randomUUID()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 60 * 60 * 1000)
  await prisma.$executeRaw`
    INSERT INTO "Session" (
      "id", "userId", "tokenHash", "userAgentSummary", "authMethod", "twoFactorVerifiedAt",
      "expiresAt", "idleExpiresAt", "lastSeenAt", "createdAt"
    ) VALUES (
      ${id}::uuid, ${user.id}::uuid, ${hashSessionToken(token)}, 'vitest-rbac-admin', 'PASSWORD_2FA', ${now},
      ${expiresAt}, ${expiresAt}, ${now}, ${now}
    )
  `
  return token
}

async function callAllRoutes(token?: string) {
  return Promise.all([
    listRolesRoute(request("http://localhost:5000/api/admin/rbac/roles", token)),
    createRoleRoute(request("http://localhost:5000/api/admin/rbac/roles", token, "POST", {
      key: customRoleKey,
      nameFa: "نقش آزمایشی CI",
      permissionKeys: [customPermissionKey],
    })),
    listPermissionsRoute(request("http://localhost:5000/api/admin/rbac/permissions", token)),
    createPermissionRoute(request("http://localhost:5000/api/admin/rbac/permissions", token, "POST", {
      key: customPermissionKey,
      description: "مجوز آزمایشی CI",
    })),
  ])
}

describe("protected RBAC API routes", () => {
  it("returns unauthenticated for every RBAC API operation without a session", async () => {
    const responses = await callAllRoutes()
    expect(responses.map((response) => response.status)).toEqual([401, 401, 401, 401])
  })

  it("returns forbidden for every RBAC API operation for a customer", async () => {
    const responses = await callAllRoutes(await createCustomerToken())
    expect(responses.map((response) => response.status)).toEqual([403, 403, 403, 403])
  })

  it("allows a super admin to list and create custom permissions and roles", async () => {
    const token = await createSuperAdminToken()

    const listRolesResponse = await listRolesRoute(request("http://localhost:5000/api/admin/rbac/roles", token))
    const listPermissionsResponse = await listPermissionsRoute(request("http://localhost:5000/api/admin/rbac/permissions", token))
    expect(listRolesResponse.status).toBe(200)
    expect(listPermissionsResponse.status).toBe(200)

    const permissionResponse = await createPermissionRoute(request(
      "http://localhost:5000/api/admin/rbac/permissions",
      token,
      "POST",
      { key: customPermissionKey, description: "مجوز آزمایشی CI" },
    ))
    expect(permissionResponse.status).toBe(201)

    const roleResponse = await createRoleRoute(request(
      "http://localhost:5000/api/admin/rbac/roles",
      token,
      "POST",
      { key: customRoleKey, nameFa: "نقش آزمایشی CI", permissionKeys: [customPermissionKey] },
    ))
    expect(roleResponse.status).toBe(201)
  })
})
