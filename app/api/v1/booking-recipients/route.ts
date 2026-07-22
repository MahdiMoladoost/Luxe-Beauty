import type { NextRequest } from "next/server"

import { requirePrincipalFromRequest } from "@/lib/auth/session-cookie"
import {
  createOwnedBookingRecipient,
  listOwnedBookingRecipients,
} from "@/lib/booking/recipient-service"
import { apiError, apiSuccess } from "@/lib/http/api-response"
import { assertTrustedMutation, requestContext } from "@/lib/http/request-context"

export async function GET(request: NextRequest) {
  const context = requestContext(request)
  try {
    const principal = await requirePrincipalFromRequest(request)
    return apiSuccess(await listOwnedBookingRecipients(principal))
  } catch (error) {
    return apiError(error, context.correlationId)
  }
}

export async function POST(request: NextRequest) {
  const context = requestContext(request)
  try {
    assertTrustedMutation(request)
    const principal = await requirePrincipalFromRequest(request)
    return apiSuccess(
      await createOwnedBookingRecipient(principal, await request.json(), context),
      201,
    )
  } catch (error) {
    return apiError(error, context.correlationId)
  }
}
