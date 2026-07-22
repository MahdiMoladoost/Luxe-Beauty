import type { NextRequest } from "next/server"

import { requirePrincipalFromRequest } from "@/lib/auth/session-cookie"
import {
  deleteOwnedBookingRecipient,
  getOwnedBookingRecipient,
  updateOwnedBookingRecipient,
} from "@/lib/booking/recipient-service"
import { apiError, apiSuccess } from "@/lib/http/api-response"
import { assertTrustedMutation, requestContext } from "@/lib/http/request-context"

type RecipientParams = Promise<{ recipientId: string }>

export async function GET(
  request: NextRequest,
  { params }: { params: RecipientParams },
) {
  const context = requestContext(request)
  try {
    const principal = await requirePrincipalFromRequest(request)
    const { recipientId } = await params
    return apiSuccess(await getOwnedBookingRecipient(principal, recipientId))
  } catch (error) {
    return apiError(error, context.correlationId)
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: RecipientParams },
) {
  const context = requestContext(request)
  try {
    assertTrustedMutation(request)
    const principal = await requirePrincipalFromRequest(request)
    const { recipientId } = await params
    return apiSuccess(
      await updateOwnedBookingRecipient(principal, recipientId, await request.json(), context),
    )
  } catch (error) {
    return apiError(error, context.correlationId)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: RecipientParams },
) {
  const context = requestContext(request)
  try {
    assertTrustedMutation(request)
    const principal = await requirePrincipalFromRequest(request)
    const { recipientId } = await params
    const expectedUpdatedAt = request.nextUrl.searchParams.get("expectedUpdatedAt") ?? ""
    return apiSuccess(
      await deleteOwnedBookingRecipient(principal, recipientId, expectedUpdatedAt, context),
    )
  } catch (error) {
    return apiError(error, context.correlationId)
  }
}
