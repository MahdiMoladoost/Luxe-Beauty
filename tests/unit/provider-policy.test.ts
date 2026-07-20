import { describe, expect, it } from "vitest"

import { assertProviderPublicAndBookable } from "@/lib/provider/policy"

describe("provider publication and booking policy", () => {
  it("blocks every provider that is not fully verified and enabled", () => {
    expect(() => assertProviderPublicAndBookable({ status: "PENDING_REVIEW", bookingEnabled: false, verificationAt: null })).toThrow()
    expect(() => assertProviderPublicAndBookable({ status: "APPROVED", bookingEnabled: false, verificationAt: new Date() })).toThrow()
    expect(() => assertProviderPublicAndBookable({ status: "APPROVED", bookingEnabled: true, verificationAt: null })).toThrow()
  })

  it("allows only the fully approved provider", () => {
    expect(() => assertProviderPublicAndBookable({ status: "APPROVED", bookingEnabled: true, verificationAt: new Date() })).not.toThrow()
  })
})
