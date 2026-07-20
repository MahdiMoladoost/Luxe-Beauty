import type { NextRequest } from "next/server"

import { requestCustomerOtp } from "@/lib/auth/service"
import { apiError, apiSuccess } from "@/lib/http/api-response"
import { assertTrustedMutation, requestContext } from "@/lib/http/request-context"

export async function POST(request: NextRequest) {
  const context = requestContext(request)
  try {
    assertTrustedMutation(request)
    const body = await request.json()
    const result = await requestCustomerOtp(body.mobile, context)
    return apiSuccess(result, 201)
  } catch (error) {
    return apiError(error, context.correlationId)
  }
}
