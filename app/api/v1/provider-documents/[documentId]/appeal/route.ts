import type { NextRequest } from "next/server"

import { requirePrincipalFromRequest } from "@/lib/auth/session-cookie"
import { appealDocument } from "@/lib/provider/service"
import { apiError, apiSuccess } from "@/lib/http/api-response"
import { assertTrustedMutation, requestContext } from "@/lib/http/request-context"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const context = requestContext(request)
  try {
    assertTrustedMutation(request)
    const principal = await requirePrincipalFromRequest(request)
    const { documentId } = await params
    return apiSuccess(await appealDocument(principal, documentId, await request.json(), context))
  } catch (error) {
    return apiError(error, context.correlationId)
  }
}
