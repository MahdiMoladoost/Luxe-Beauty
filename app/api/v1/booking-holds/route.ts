import type { NextRequest } from "next/server"

import { requirePrincipalFromRequest } from "@/lib/auth/session-cookie"
import { createBookingHold } from "@/lib/booking/hold-service"
import { apiError, apiSuccess } from "@/lib/http/api-response"
import { assertTrustedMutation, requestContext } from "@/lib/http/request-context"

export async function POST(request: NextRequest) {
  const context = requestContext(request)
  try {
    assertTrustedMutation(request)
    const principal = await requirePrincipalFromRequest(request)
    const result = await createBookingHold(
      principal,
      await request.json(),
      request.headers.get("Idempotency-Key"),
      context,
    )
    return apiSuccess(result, result.replayed ? 200 : 201)
  } catch (error) {
    return apiError(error, context.correlationId)
  }
}
