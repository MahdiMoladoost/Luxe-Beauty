import type { NextRequest } from "next/server"

import { requirePrincipalFromRequest } from "@/lib/auth/session-cookie"
import { createBookingFromHold } from "@/lib/booking/conversion-service"
import { apiError, apiSuccess } from "@/lib/http/api-response"
import { assertTrustedMutation, requestContext } from "@/lib/http/request-context"

export async function POST(request: NextRequest) {
  const context = requestContext(request)
  try {
    assertTrustedMutation(request)
    const principal = await requirePrincipalFromRequest(request)
    return apiSuccess(
      await createBookingFromHold(
        principal,
        await request.json(),
        request.headers.get("Idempotency-Key"),
        context,
      ),
      201,
    )
  } catch (error) {
    return apiError(error, context.correlationId)
  }
}
