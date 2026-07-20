import type { NextRequest } from "next/server"

import { requirePrincipalFromRequest } from "@/lib/auth/session-cookie"
import { readSensitiveIdentity } from "@/lib/identity/service"
import { apiError, apiSuccess } from "@/lib/http/api-response"
import { requestContext } from "@/lib/http/request-context"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const context = requestContext(request)
  try {
    const principal = await requirePrincipalFromRequest(request)
    const { userId } = await params
    const reason = request.headers.get("x-access-reason")
    return apiSuccess(await readSensitiveIdentity(principal, userId, reason, context))
  } catch (error) {
    return apiError(error, context.correlationId)
  }
}
