import { describe, expect, it } from "vitest"

import { AuthError } from "@/lib/auth/errors"
import { assertPermission, hasPermission } from "@/lib/auth/rbac"
import type { SessionPrincipal } from "@/lib/auth/types"

function principal(overrides: Partial<SessionPrincipal> = {}): SessionPrincipal {
  return {
    sessionId: "session",
    userId: "11111111-1111-4111-8111-111111111111",
    mobileNormalized: "09120000000",
    userStatus: "ACTIVE",
    identityStatus: "UNVERIFIED",
    authMethod: "OTP",
    twoFactorVerifiedAt: null,
    mustChangePassword: false,
    roleKeys: ["customer"],
    permissions: ["profile.manage"],
    ...overrides,
  }
}

describe("RBAC", () => {
  it("denies permissions that are not granted", () => {
    const actor = principal()
    expect(hasPermission(actor, "role.manage")).toBe(false)
    expect(() => assertPermission(actor, "role.manage")).toThrowError(AuthError)
  })

  it("allows an explicitly granted permission", () => {
    expect(() => assertPermission(principal({ permissions: ["role.manage"] }), "role.manage")).not.toThrow()
  })

  it("blocks privileged operations until the initial password is changed", () => {
    const actor = principal({ mustChangePassword: true, permissions: ["platform.access"] })
    expect(() => assertPermission(actor, "platform.access")).toThrowError(/رمز عبور اولیه/)
    expect(() => assertPermission(actor, "security.change-own-password")).not.toThrow()
  })
})
