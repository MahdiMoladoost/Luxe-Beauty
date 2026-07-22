import type { NextRequest } from "next/server"

import { requirePrincipalFromRequest } from "@/lib/auth/session-cookie"
import { customerBookingDetail } from "@/lib/customer-panel/service"
import { apiError, apiSuccess } from "@/lib/http/api-response"
import { requestContext } from "@/lib/http/request-context"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> },
) {
  const context = requestContext(request)
  try {
    const principal = await requirePrincipalFromRequest(request)
    const { bookingId } = await params
    return apiSuccess(await customerBookingDetail(principal, bookingId))
  } catch (error) {
    return apiError(error, context.correlationId)
  }
}
