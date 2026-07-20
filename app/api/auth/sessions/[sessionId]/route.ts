import type { NextRequest } from "next/server"

import { clearSessionCookie, requirePrincipalFromRequest } from "@/lib/auth/session-cookie"
import { revokeOwnSession } from "@/lib/auth/session-management"
import { apiError, apiSuccess } from "@/lib/http/api-response"
import { assertTrustedMutation, requestContext } from "@/lib/http/request-context"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const context = requestContext(request)
  try {
    assertTrustedMutation(request)
    const principal = await requirePrincipalFromRequest(request)
    const { sessionId } = await params
    const result = await revokeOwnSession(principal, sessionId, context)
    const response = apiSuccess(result)
    if (result.currentSessionRevoked) clearSessionCookie(response)
    return response
  } catch (error) {
    return apiError(error, context.correlationId)
  }
}
