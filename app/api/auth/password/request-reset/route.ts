import type { NextRequest } from "next/server"

import { requestPasswordReset } from "@/lib/auth/service"
import { apiError, apiSuccess } from "@/lib/http/api-response"
import { assertTrustedMutation, requestContext } from "@/lib/http/request-context"

export async function POST(request: NextRequest) {
  const context = requestContext(request)
  try {
    assertTrustedMutation(request)
    const body = await request.json()
    return apiSuccess(await requestPasswordReset(body.mobile, context))
  } catch (error) {
    return apiError(error, context.correlationId)
  }
}
