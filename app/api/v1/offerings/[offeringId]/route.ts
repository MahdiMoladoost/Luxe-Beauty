import type { NextRequest } from "next/server"

import { getPublicOffering } from "@/lib/catalog/service"
import { apiError, apiSuccess } from "@/lib/http/api-response"
import { requestContext } from "@/lib/http/request-context"

type PublicOfferingParams = Promise<{ offeringId: string }>

export async function GET(
  request: NextRequest,
  { params }: { params: PublicOfferingParams },
) {
  const context = requestContext(request)
  try {
    const { offeringId } = await params
    return apiSuccess(await getPublicOffering(offeringId))
  } catch (error) {
    return apiError(error, context.correlationId)
  }
}
