import type { NextRequest } from "next/server"

import { requirePrincipalFromRequest } from "@/lib/auth/session-cookie"
import { rejectProviderBooking } from "@/lib/booking/provider-decision-service"
import { apiError, apiSuccess } from "@/lib/http/api-response"
import { assertTrustedMutation, requestContext } from "@/lib/http/request-context"

type BookingParams = Promise<{ bookingId: string }>

export async function POST(
  request: NextRequest,
  { params }: { params: BookingParams },
) {
  const context = requestContext(request)
  try {
    assertTrustedMutation(request)
    const principal = await requirePrincipalFromRequest(request)
    const { bookingId } = await params
    return apiSuccess(
      await rejectProviderBooking(
        principal,
        bookingId,
        await request.json(),
        request.headers.get("Idempotency-Key"),
        context,
      ),
    )
  } catch (error) {
    return apiError(error, context.correlationId)
  }
}
