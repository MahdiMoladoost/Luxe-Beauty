import type { NextRequest } from "next/server"

import { requirePrincipalFromRequest } from "@/lib/auth/session-cookie"
import { submitIdentityVerification } from "@/lib/identity/service"
import { apiError, apiSuccess } from "@/lib/http/api-response"
import { assertTrustedMutation, requestContext } from "@/lib/http/request-context"

export async function POST(request: NextRequest) {
  const context = requestContext(request)
  try {
    assertTrustedMutation(request)
    const principal = await requirePrincipalFromRequest(request)
    const status = await submitIdentityVerification(principal, await request.json(), context)
    return apiSuccess(status, 201)
  } catch (error) {
    return apiError(error, context.correlationId)
  }
}
