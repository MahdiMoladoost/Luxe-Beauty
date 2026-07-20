import { describe, expect, it } from "vitest"

import { assertIdentityVerified, assertRecentIdentityStepUp } from "@/lib/identity/policy"
import type { SessionPrincipal } from "@/lib/auth/types"

function principal(overrides: Partial<SessionPrincipal> = {}): SessionPrincipal {
  return {
    sessionId: "identity-policy-session",
    userId: "11111111-1111-4111-8111-111111111111",
    mobileNormalized: "09120000000",
    userStatus: "ACTIVE",
    identityStatus: "UNVERIFIED",
    authMethod: "OTP",
    twoFactorVerifiedAt: null,
    mustChangePassword: false,
    roleKeys: ["customer"],
    permissions: [],
    ...overrides,
  }
}

describe("identity policies", () => {
  it("blocks booking until identity is verified", () => {
    expect(() => assertIdentityVerified(principal())).toThrowError(/پیش از اولین رزرو/)
    expect(() => assertIdentityVerified(principal({ identityStatus: "VERIFIED" }))).not.toThrow()
  })

  it("requires both sensitive-read permission and recent 2FA", () => {
    expect(() => assertRecentIdentityStepUp(principal())).toThrowError(/دسترسی لازم/)
    expect(() => assertRecentIdentityStepUp(principal({ permissions: ["identity.sensitive-read"] }))).toThrowError(/احراز دومرحله‌ای تازه/)
    expect(() => assertRecentIdentityStepUp(principal({
      permissions: ["identity.sensitive-read"],
      twoFactorVerifiedAt: new Date(),
      authMethod: "PASSWORD_2FA",
    }))).not.toThrow()
  })
})
