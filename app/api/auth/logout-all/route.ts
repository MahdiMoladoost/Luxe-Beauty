import type { NextRequest } from "next/server"

import { logoutAll } from "@/lib/auth/service"
import { clearSessionCookie, requirePrincipalFromRequest } from "@/lib/auth/session-cookie"
import { apiError, apiSuccess } from "@/lib/http/api-response"
import { assertTrustedMutation, requestContext } from "@/lib/http/request-context"

export async function POST(request: NextRequest) {
  const context = requestContext(request)
  try {
    assertTrustedMutation(request)
    const principal = await requirePrincipalFromRequest(request)
    const revokedSessions = await logoutAll(principal, context)
    const response = apiSuccess({ revokedSessions })
    clearSessionCookie(response)
    return response
  } catch (error) {
    return apiError(error, context.correlationId)
  }
}
