import type { NextRequest } from "next/server"

import { requirePrincipalFromRequest } from "@/lib/auth/session-cookie"
import { apiError, apiSuccess } from "@/lib/http/api-response"
import { requestContext } from "@/lib/http/request-context"
import { providerPanelGeography } from "@/lib/provider-panel/geography"

export async function GET(request: NextRequest) {
  const context = requestContext(request)
  try {
    await requirePrincipalFromRequest(request)
    return apiSuccess(await providerPanelGeography())
  } catch (error) {
    return apiError(error, context.correlationId)
  }
}
