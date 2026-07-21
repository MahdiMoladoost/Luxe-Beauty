import type { NextRequest } from "next/server"

import { requirePrincipalFromRequest } from "@/lib/auth/session-cookie"
import { deleteOwnedOffering, updateOwnedOffering } from "@/lib/catalog/service"
import { apiError, apiSuccess } from "@/lib/http/api-response"
import { assertTrustedMutation, requestContext } from "@/lib/http/request-context"

type OfferingParams = Promise<{ providerId: string; offeringId: string }>

export async function PATCH(
  request: NextRequest,
  { params }: { params: OfferingParams },
) {
  const context = requestContext(request)
  try {
    assertTrustedMutation(request)
    const principal = await requirePrincipalFromRequest(request)
    const { providerId, offeringId } = await params
    return apiSuccess(
      await updateOwnedOffering(principal, providerId, offeringId, await request.json(), context),
    )
  } catch (error) {
    return apiError(error, context.correlationId)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: OfferingParams },
) {
  const context = requestContext(request)
  try {
    assertTrustedMutation(request)
    const principal = await requirePrincipalFromRequest(request)
    const { providerId, offeringId } = await params
    const expectedVersion = Number(request.nextUrl.searchParams.get("expectedVersion"))
    return apiSuccess(
      await deleteOwnedOffering(principal, providerId, offeringId, expectedVersion, context),
    )
  } catch (error) {
    return apiError(error, context.correlationId)
  }
}
