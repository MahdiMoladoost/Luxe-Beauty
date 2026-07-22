import type { NextRequest } from "next/server"

import { requirePrincipalFromRequest } from "@/lib/auth/session-cookie"
import { customerPanelBootstrap } from "@/lib/customer-panel/service"
import { apiError, apiSuccess } from "@/lib/http/api-response"
import { requestContext } from "@/lib/http/request-context"

export async function GET(request: NextRequest) {
  const context = requestContext(request)
  try {
    const principal = await requirePrincipalFromRequest(request)
    return apiSuccess(await customerPanelBootstrap(principal))
  } catch (error) {
    return apiError(error, context.correlationId)
  }
}
