import type { NextRequest } from "next/server"

import { requirePrincipalFromRequest } from "@/lib/auth/session-cookie"
import { apiError, apiSuccess } from "@/lib/http/api-response"
import { requestContext } from "@/lib/http/request-context"
import { providerBookings } from "@/lib/provider-panel/service"

export async function GET(request: NextRequest) {
  const context = requestContext(request)
  try {
    const principal = await requirePrincipalFromRequest(request)
    return apiSuccess(
      await providerBookings(
        principal,
        Object.fromEntries(request.nextUrl.searchParams.entries()),
      ),
    )
  } catch (error) {
    return apiError(error, context.correlationId)
  }
}
