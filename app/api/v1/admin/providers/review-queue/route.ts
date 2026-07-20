import type { NextRequest } from "next/server"

import { requirePrincipalFromRequest } from "@/lib/auth/session-cookie"
import { listProviderReviewQueue } from "@/lib/provider/admin-query"
import { apiError, apiSuccess } from "@/lib/http/api-response"
import { requestContext } from "@/lib/http/request-context"

export async function GET(request: NextRequest) {
  const context = requestContext(request)
  try {
    const principal = await requirePrincipalFromRequest(request)
    return apiSuccess(await listProviderReviewQueue(principal))
  } catch (error) {
    return apiError(error, context.correlationId)
  }
}
