import { AuthError } from "@/lib/auth/errors"
import { assertPermission } from "@/lib/auth/rbac"
import type { SessionPrincipal } from "@/lib/auth/types"

export function assertIdentityVerified(principal: SessionPrincipal): void {
  if (principal.identityStatus !== "VERIFIED") {
    throw new AuthError(
      "IDENTITY_VERIFICATION_REQUIRED",
      "پیش از اولین رزرو باید احراز هویت شما تأیید شود.",
      403,
      { identityStatus: principal.identityStatus },
    )
  }
}

export function assertRecentIdentityStepUp(principal: SessionPrincipal, now = new Date()): void {
  assertPermission(principal, "identity.sensitive-read")
  const verifiedAt = principal.twoFactorVerifiedAt
  const maximumAgeMs = 15 * 60 * 1000
  if (!verifiedAt || now.getTime() - verifiedAt.getTime() > maximumAgeMs) {
    throw new AuthError(
      "STEP_UP_REQUIRED",
      "برای مشاهده داده هویتی، احراز دومرحله‌ای تازه لازم است.",
      403,
    )
  }
}
