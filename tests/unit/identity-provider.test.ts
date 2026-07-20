import { beforeAll, describe, expect, it } from "vitest"

import { identityProvider } from "@/lib/identity/provider"

beforeAll(() => {
  process.env.APP_ENV = "test"
  process.env.IDENTITY_PROVIDER = "mock"
})

const baseClaims = {
  firstName: "مهدی",
  lastName: "آزمایشی",
  mobileNormalized: "09120000000",
}

describe("development identity provider", () => {
  it("returns a verified exact claim match for the normal scenario", async () => {
    const result = await identityProvider().verify({ ...baseClaims, nationalId: "1234567893" })
    expect(result.status).toBe("VERIFIED")
    expect(result.matchedClaims).toEqual(baseClaims)
  })

  it("supports rejected and manual-review development scenarios", async () => {
    await expect(identityProvider().verify({ ...baseClaims, nationalId: "1234567890" }))
      .resolves.toMatchObject({ status: "REJECTED", reasonCode: "MOCK_IDENTITY_NOT_FOUND" })
    await expect(identityProvider().verify({ ...baseClaims, nationalId: "1234567891" }))
      .resolves.toMatchObject({ status: "REQUIRES_REVIEW", reasonCode: "MOCK_MANUAL_REVIEW" })
  })

  it("returns a mismatched claim scenario for service-level matching tests", async () => {
    const result = await identityProvider().verify({ ...baseClaims, nationalId: "1234567892" })
    expect(result.status).toBe("VERIFIED")
    expect(result.matchedClaims?.firstName).not.toBe(baseClaims.firstName)
  })
})
