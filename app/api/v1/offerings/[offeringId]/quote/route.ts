import type { NextRequest } from "next/server"

import { principalFromToken } from "@/lib/auth/service"
import { sessionTokenFromRequest } from "@/lib/auth/session-cookie"
import { quotePublicOffering } from "@/lib/catalog/service"
import { apiError, apiSuccess } from "@/lib/http/api-response"
import { assertTrustedMutation, requestContext } from "@/lib/http/request-context"

type QuoteParams = Promise<{ offeringId: string }>

export async function POST(
  request: NextRequest,
  { params }: { params: QuoteParams },
) {
  const context = requestContext(request)
  try {
    assertTrustedMutation(request)
    const principal = await principalFromToken(sessionTokenFromRequest(request))
    const { offeringId } = await params
    return apiSuccess(await quotePublicOffering(principal, offeringId, await request.json()), 201)
  } catch (error) {
    return apiError(error, context.correlationId)
  }
}
