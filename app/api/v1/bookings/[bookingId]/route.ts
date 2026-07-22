import type { NextRequest } from "next/server"

import { requirePrincipalFromRequest } from "@/lib/auth/session-cookie"
import { getOwnedBooking } from "@/lib/booking/conversion-service"
import { apiError, apiSuccess } from "@/lib/http/api-response"
import { requestContext } from "@/lib/http/request-context"

type BookingParams = Promise<{ bookingId: string }>

export async function GET(
  request: NextRequest,
  { params }: { params: BookingParams },
) {
  const context = requestContext(request)
  try {
    const principal = await requirePrincipalFromRequest(request)
    const { bookingId } = await params
    return apiSuccess(await getOwnedBooking(principal, bookingId))
  } catch (error) {
    return apiError(error, context.correlationId)
  }
}
