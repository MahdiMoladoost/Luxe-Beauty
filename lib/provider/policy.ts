import { AuthError } from "@/lib/auth/errors"
import { assertPermission } from "@/lib/auth/rbac"
import type { SessionPrincipal } from "@/lib/auth/types"

export function assertRecentProviderReviewStepUp(principal: SessionPrincipal, now = new Date()): void {
  assertPermission(principal, "identity.review")
  const verifiedAt = principal.twoFactorVerifiedAt
  if (!verifiedAt || now.getTime() - verifiedAt.getTime() > 15 * 60 * 1000) {
    throw new AuthError("STEP_UP_REQUIRED", "برای بررسی مدارک، احراز دومرحله‌ای تازه لازم است.", 403)
  }
}

export function assertProviderPublicAndBookable(provider: {
  status: string
  bookingEnabled: boolean
  verificationAt: Date | null
}): void {
  if (provider.status !== "APPROVED" || !provider.bookingEnabled || !provider.verificationAt) {
    throw new AuthError(
      "PROVIDER_NOT_VERIFIED",
      "این ارائه‌دهنده تا تأیید نهایی قابل نمایش عمومی یا دریافت رزرو نیست.",
      403,
    )
  }
}
