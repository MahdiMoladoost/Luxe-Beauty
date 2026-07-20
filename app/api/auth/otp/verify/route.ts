import type { NextRequest } from "next/server"

import { verifyCustomerOtp } from "@/lib/auth/service"
import { setSessionCookie } from "@/lib/auth/session-cookie"
import { apiError, apiSuccess } from "@/lib/http/api-response"
import { assertTrustedMutation, requestContext } from "@/lib/http/request-context"

export async function POST(request: NextRequest) {
  const context = requestContext(request)
  try {
    assertTrustedMutation(request)
    const session = await verifyCustomerOtp(await request.json(), context)
    const response = apiSuccess({ principal: session.principal })
    setSessionCookie(response, session.token, session.expiresAt)
    return response
  } catch (error) {
    return apiError(error, context.correlationId)
  }
}
