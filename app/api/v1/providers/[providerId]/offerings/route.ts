import type { NextRequest } from "next/server"

import { requirePrincipalFromRequest } from "@/lib/auth/session-cookie"
import { createOwnedOffering, listOwnedOfferings } from "@/lib/catalog/service"
import { apiError, apiSuccess } from "@/lib/http/api-response"
import { assertTrustedMutation, requestContext } from "@/lib/http/request-context"

type OfferingCollectionParams = Promise<{ providerId: string }>

export async function GET(
  request: NextRequest,
  { params }: { params: OfferingCollectionParams },
) {
  const context = requestContext(request)
  try {
    const principal = await requirePrincipalFromRequest(request)
    const { providerId } = await params
    return apiSuccess(await listOwnedOfferings(principal, providerId))
  } catch (error) {
    return apiError(error, context.correlationId)
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: OfferingCollectionParams },
) {
  const context = requestContext(request)
  try {
    assertTrustedMutation(request)
    const principal = await requirePrincipalFromRequest(request)
    const { providerId } = await params
    return apiSuccess(await createOwnedOffering(principal, providerId, await request.json(), context), 201)
  } catch (error) {
    return apiError(error, context.correlationId)
  }
}
