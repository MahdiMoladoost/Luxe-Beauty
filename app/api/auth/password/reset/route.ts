import type { NextRequest } from "next/server"

import { resetPassword } from "@/lib/auth/service"
import { apiError, apiSuccess } from "@/lib/http/api-response"
import { assertTrustedMutation, requestContext } from "@/lib/http/request-context"

export async function POST(request: NextRequest) {
  const context = requestContext(request)
  try {
    assertTrustedMutation(request)
    await resetPassword(await request.json(), context)
    return apiSuccess({ passwordReset: true })
  } catch (error) {
    return apiError(error, context.correlationId)
  }
}
