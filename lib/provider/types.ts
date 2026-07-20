import type { ProviderType } from "@prisma/client"

export const providerModes = [
  "SINGLE_SALON",
  "MULTI_BRANCH_GROUP",
  "AFFILIATED_PROFESSIONAL",
  "INDEPENDENT_PROFESSIONAL",
  "HOME_SERVICE_PROFESSIONAL",
  "HOME_STUDIO_PROFESSIONAL",
  "HYBRID_PROFESSIONAL",
] as const

export type ProviderMode = typeof providerModes[number]
export type ProviderReviewStatus = "DRAFT" | "PENDING_REVIEW" | "NEEDS_CORRECTION" | "APPROVED" | "REJECTED" | "APPEALED"
export type ProviderDocumentStatus = "PENDING_REVIEW" | "NEEDS_CORRECTION" | "APPROVED" | "REJECTED" | "EXPIRED" | "APPEALED"
export type ReviewAction = "APPROVE" | "REJECT" | "REQUEST_CORRECTION"

export function providerTypeForMode(mode: ProviderMode): ProviderType {
  switch (mode) {
    case "SINGLE_SALON": return "SINGLE_SALON"
    case "MULTI_BRANCH_GROUP": return "MULTI_BRANCH_GROUP"
    case "AFFILIATED_PROFESSIONAL": return "OTHER"
    case "INDEPENDENT_PROFESSIONAL": return "INDEPENDENT_PROFESSIONAL"
    case "HOME_SERVICE_PROFESSIONAL": return "HOME_SERVICE_PROFESSIONAL"
    case "HOME_STUDIO_PROFESSIONAL": return "HOME_STUDIO_PROFESSIONAL"
    case "HYBRID_PROFESSIONAL": return "HYBRID_PROFESSIONAL"
  }
}

export function roleForProviderMode(mode: ProviderMode): "salon_manager" | "specialist" {
  return mode === "SINGLE_SALON" || mode === "MULTI_BRANCH_GROUP" ? "salon_manager" : "specialist"
}
