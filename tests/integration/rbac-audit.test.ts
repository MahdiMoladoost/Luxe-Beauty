import { randomInt } from "node:crypto"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { createCustomPermission, createCustomRole } from "@/lib/auth/rbac"
import type { SessionPrincipal } from "@/lib/auth/types"
import { prisma } from "@/lib/infrastructure/prisma"

const permissionKey = `audit-resource-${randomInt(100_000, 999_999)}.manage`
const roleKey = `audit_role_${randomInt(100_000, 999_999)}`
let actorUserId = ""

beforeAll(async () => {
  const user = await prisma.user.create({
    data: {
      mobileNormalized: `095${randomInt(10_000_000, 99_999_999)}`,
      status: "ACTIVE",
    },
  })
  actorUserId = user.id
})

afterAll(async () => {
  await prisma.role.deleteMany({ where: { key: roleKey } })
  await prisma.permission.deleteMany({ where: { key: permissionKey } })
  await prisma.auditLog.deleteMany({ where: { actorUserId } })
  await prisma.user.deleteMany({ where: { id: actorUserId } })
})

function principal(): SessionPrincipal {
  return {
    sessionId: "rbac-audit-session",
    userId: actorUserId,
    mobileNormalized: "09500000000",
    userStatus: "ACTIVE",
    identityStatus: "UNVERIFIED",
    authMethod: "PASSWORD_2FA",
    twoFactorVerifiedAt: new Date(),
    mustChangePassword: false,
    roleKeys: ["super_admin"],
    permissions: ["permission.manage", "role.manage"],
  }
}

describe("RBAC mutation audit", () => {
  it("records permission and role creation in the same business workflow", async () => {
    const actor = principal()
    const context = { correlationId: `rbac-audit-${Date.now()}` }

    const permission = await createCustomPermission(actor, {
      key: permissionKey,
      description: "مجوز آزمایشی ممیزی",
    }, context)
    const role = await createCustomRole(actor, {
      key: roleKey,
      nameFa: "نقش آزمایشی ممیزی",
      permissionKeys: [permissionKey],
    }, context)

    const auditRows = await prisma.auditLog.findMany({
      where: {
        actorUserId,
        correlationId: context.correlationId,
        action: { in: ["rbac.permission.created", "rbac.role.created"] },
      },
      orderBy: { createdAt: "asc" },
    })

    expect(permission.key).toBe(permissionKey)
    expect(role.key).toBe(roleKey)
    expect(auditRows.map((row) => row.action)).toEqual([
      "rbac.permission.created",
      "rbac.role.created",
    ])
  })
})
