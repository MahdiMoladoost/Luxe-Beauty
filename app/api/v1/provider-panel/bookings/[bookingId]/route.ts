import type { NextRequest } from "next/server"

import { requirePrincipalFromRequest } from "@/lib/auth/session-cookie"
import { apiError, apiSuccess } from "@/lib/http/api-response"
import { requestContext } from "@/lib/http/request-context"
import { providerBookingDetails } from "@/lib/provider-panel/service"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> },
) {
  const context = requestContext(request)
  try {
    const principal = await requirePrincipalFromRequest(request)
    const { bookingId } = await params
    const providerId = request.nextUrl.searchParams.get("providerId") ?? ""
    return apiSuccess(await providerBookingDetails(principal, providerId, bookingId))
  } catch (error) {
    return apiError(error, context.correlationId)
  }
}
