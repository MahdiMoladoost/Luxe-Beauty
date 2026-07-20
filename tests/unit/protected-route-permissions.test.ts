import { describe, expect, it } from "vitest"

import { assertPermission } from "@/lib/auth/rbac"
import {
  panelPermissionMatrix,
  rbacApiPermissionMatrix,
  verificationApiPermissionMatrix,
} from "@/lib/auth/protected-routes"
import type { SessionPrincipal } from "@/lib/auth/types"

function principal(permissions: string[]): SessionPrincipal {
  return {
    sessionId: "session",
    userId: "11111111-1111-4111-8111-111111111111",
    mobileNormalized: "09120000000",
    userStatus: "ACTIVE",
    identityStatus: "UNVERIFIED",
    authMethod: "PASSWORD_2FA",
    twoFactorVerifiedAt: new Date(),
    mustChangePassword: false,
    roleKeys: ["test-role"],
    permissions,
  }
}

const policies = {
  ...panelPermissionMatrix,
  ...rbacApiPermissionMatrix,
  ...verificationApiPermissionMatrix,
}

describe("protected panel and API permission matrix", () => {
  for (const [route, permission] of Object.entries(policies)) {
    it(`denies ${route} without ${permission}`, () => {
      expect(() => assertPermission(principal([]), permission)).toThrowError(/دسترسی لازم/)
    })

    it(`allows ${route} with ${permission}`, () => {
      expect(() => assertPermission(principal([permission]), permission)).not.toThrow()
    })
  }
})
