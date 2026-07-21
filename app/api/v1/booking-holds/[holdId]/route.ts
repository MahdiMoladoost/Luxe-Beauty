import type { NextRequest } from "next/server"

import { requirePrincipalFromRequest } from "@/lib/auth/session-cookie"
import { getOwnedBookingHold, releaseOwnedBookingHold } from "@/lib/booking/hold-service"
import { apiError, apiSuccess } from "@/lib/http/api-response"
import { assertTrustedMutation, requestContext } from "@/lib/http/request-context"

type HoldParams = Promise<{ holdId: string }>

export async function GET(
  request: NextRequest,
  { params }: { params: HoldParams },
) {
  const context = requestContext(request)
  try {
    const principal = await requirePrincipalFromRequest(request)
    const { holdId } = await params
    return apiSuccess(await getOwnedBookingHold(principal, holdId))
  } catch (error) {
    return apiError(error, context.correlationId)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: HoldParams },
) {
  const context = requestContext(request)
  try {
    assertTrustedMutation(request)
    const principal = await requirePrincipalFromRequest(request)
    const { holdId } = await params
    return apiSuccess(await releaseOwnedBookingHold(principal, holdId, context))
  } catch (error) {
    return apiError(error, context.correlationId)
  }
}
