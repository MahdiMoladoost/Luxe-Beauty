import type { NextRequest } from "next/server"

import { logoutCurrent } from "@/lib/auth/service"
import { clearSessionCookie, sessionTokenFromRequest } from "@/lib/auth/session-cookie"
import { apiError, apiSuccess } from "@/lib/http/api-response"
import { assertTrustedMutation, requestContext } from "@/lib/http/request-context"

export async function POST(request: NextRequest) {
  const context = requestContext(request)
  try {
    assertTrustedMutation(request)
    await logoutCurrent(sessionTokenFromRequest(request))
    const response = apiSuccess({ loggedOut: true })
    clearSessionCookie(response)
    return response
  } catch (error) {
    return apiError(error, context.correlationId)
  }
}
