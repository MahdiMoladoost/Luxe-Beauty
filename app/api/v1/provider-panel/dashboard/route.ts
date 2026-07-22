import type { NextRequest } from "next/server"

import { requirePrincipalFromRequest } from "@/lib/auth/session-cookie"
import { apiError, apiSuccess } from "@/lib/http/api-response"
import { requestContext } from "@/lib/http/request-context"
import { providerDashboard } from "@/lib/provider-panel/service"

export async function GET(request: NextRequest) {
  const context = requestContext(request)
  try {
    const principal = await requirePrincipalFromRequest(request)
    const providerId = request.nextUrl.searchParams.get("providerId") ?? ""
    return apiSuccess(await providerDashboard(principal, providerId))
  } catch (error) {
    return apiError(error, context.correlationId)
  }
}
