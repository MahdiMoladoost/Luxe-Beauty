import { randomUUID } from "node:crypto"

import { normalizePersianText } from "@/lib/localization/normalize-fa"
import type {
  IdentityClaims,
  IdentityProviderDecision,
  IdentityVerificationProvider,
} from "@/lib/identity/types"

class MockIdentityProvider implements IdentityVerificationProvider {
  readonly key = "mock"

  async verify(claims: IdentityClaims): Promise<IdentityProviderDecision> {
    if (process.env.NODE_ENV === "production" || process.env.APP_ENV === "production") {
      throw new Error("Mock identity provider is disabled in production")
    }

    const suffix = Number(claims.nationalId.at(-1))
    const providerReference = `mock-identity-${randomUUID()}`

    if (suffix === 0) {
      return { status: "REJECTED", providerReference, reasonCode: "MOCK_IDENTITY_NOT_FOUND" }
    }

    if (suffix === 1) {
      return { status: "REQUIRES_REVIEW", providerReference, reasonCode: "MOCK_MANUAL_REVIEW" }
    }

    if (suffix === 2) {
      return {
        status: "VERIFIED",
        providerReference,
        matchedClaims: {
          firstName: `${normalizePersianText(claims.firstName)}-ناهماهنگ`,
          lastName: normalizePersianText(claims.lastName),
          mobileNormalized: claims.mobileNormalized,
        },
      }
    }

    return {
      status: "VERIFIED",
      providerReference,
      matchedClaims: {
        firstName: normalizePersianText(claims.firstName),
        lastName: normalizePersianText(claims.lastName),
        mobileNormalized: claims.mobileNormalized,
      },
    }
  }
}

export function identityProvider(): IdentityVerificationProvider {
  const provider = process.env.IDENTITY_PROVIDER || "mock"
  if (provider === "mock") return new MockIdentityProvider()
  throw new Error(`Unsupported identity provider: ${provider}`)
}

export function identityProviderMode(): "mock" | "sandbox" | "production" {
  const provider = process.env.IDENTITY_PROVIDER || "mock"
  if (provider === "mock") return "mock"
  return process.env.APP_ENV === "production" ? "production" : "sandbox"
}
