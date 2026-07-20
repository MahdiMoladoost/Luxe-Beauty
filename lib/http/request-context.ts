import { randomUUID } from "node:crypto"
import type { NextRequest } from "next/server"

import { appOrigin } from "@/lib/auth/config"
import { AuthError } from "@/lib/auth/errors"
import type { RequestContext } from "@/lib/auth/types"

export function requestContext(request: NextRequest): RequestContext {
  const forwarded = request.headers.get("x-forwarded-for")
  const ipAddress = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || undefined

  return {
    correlationId: request.headers.get("x-correlation-id") || randomUUID(),
    ipAddress,
    userAgent: request.headers.get("user-agent")?.slice(0, 300) || undefined,
  }
}

export function assertTrustedMutation(request: NextRequest): void {
  const origin = request.headers.get("origin")
  if (origin && origin !== appOrigin()) {
    throw new AuthError("CSRF_REJECTED", "درخواست از مبدأ معتبر ارسال نشده است.", 403)
  }

  const fetchSite = request.headers.get("sec-fetch-site")
  if (fetchSite && !["same-origin", "same-site", "none"].includes(fetchSite)) {
    throw new AuthError("CSRF_REJECTED", "درخواست از مبدأ معتبر ارسال نشده است.", 403)
  }
}
