import type { NextRequest } from "next/server"

import { staffPasswordLogin } from "@/lib/auth/service"
import { setSessionCookie } from "@/lib/auth/session-cookie"
import { apiError, apiSuccess } from "@/lib/http/api-response"
import { assertTrustedMutation, requestContext } from "@/lib/http/request-context"

export async function POST(request: NextRequest) {
  const context = requestContext(request)
  try {
    assertTrustedMutation(request)
    const result = await staffPasswordLogin(await request.json(), context)
    if (result.requiresTwoFactor) return apiSuccess(result)

    const response = apiSuccess({
      requiresTwoFactor: false,
      principal: result.session.principal,
    })
    setSessionCookie(response, result.session.token, result.session.expiresAt)
    return response
  } catch (error) {
    return apiError(error, context.correlationId)
  }
}
