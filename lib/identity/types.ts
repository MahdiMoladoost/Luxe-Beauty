export type IdentityDecisionStatus = "PENDING" | "VERIFIED" | "REJECTED" | "REQUIRES_REVIEW"

export type IdentityClaims = {
  firstName: string
  lastName: string
  mobileNormalized: string
  nationalId: string
}

export type IdentityProviderDecision = {
  status: IdentityDecisionStatus
  providerReference: string
  reasonCode?: string
  matchedClaims?: Omit<IdentityClaims, "nationalId">
}

export interface IdentityVerificationProvider {
  readonly key: string
  verify(claims: IdentityClaims): Promise<IdentityProviderDecision>
}

export type PublicIdentityStatus = {
  status: IdentityDecisionStatus | "UNVERIFIED"
  providerMode: "mock" | "sandbox" | "production"
  submittedAt: Date | null
  decidedAt: Date | null
  reasonCode: string | null
}
