import type { NextRequest } from "next/server"

import { changePassword } from "@/lib/auth/service"
import { clearSessionCookie, requirePrincipalFromRequest } from "@/lib/auth/session-cookie"
import { apiError, apiSuccess } from "@/lib/http/api-response"
import { assertTrustedMutation, requestContext } from "@/lib/http/request-context"

export async function POST(request: NextRequest) {
  const context = requestContext(request)
  try {
    assertTrustedMutation(request)
    const principal = await requirePrincipalFromRequest(request)
    await changePassword(principal, await request.json(), context)
    const response = apiSuccess({ passwordChanged: true, loginRequired: true })
    clearSessionCookie(response)
    return response
  } catch (error) {
    return apiError(error, context.correlationId)
  }
}
