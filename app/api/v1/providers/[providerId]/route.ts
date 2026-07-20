import type { NextRequest } from "next/server"

import { requirePrincipalFromRequest } from "@/lib/auth/session-cookie"
import { getMyProviderApplication } from "@/lib/provider/service"
import { apiError, apiSuccess } from "@/lib/http/api-response"
import { requestContext } from "@/lib/http/request-context"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ providerId: string }> },
) {
  const context = requestContext(request)
  try {
    const principal = await requirePrincipalFromRequest(request)
    const { providerId } = await params
    return apiSuccess(await getMyProviderApplication(principal, providerId))
  } catch (error) {
    return apiError(error, context.correlationId)
  }
}
