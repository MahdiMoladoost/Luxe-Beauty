import type { NextRequest } from "next/server"

import { requirePrincipalFromRequest } from "@/lib/auth/session-cookie"
import { apiError, apiSuccess } from "@/lib/http/api-response"
import { assertTrustedMutation, requestContext } from "@/lib/http/request-context"
import { transitionProfessionalAffiliation } from "@/lib/provider/affiliation-service"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ affiliationId: string }> },
) {
  const context = requestContext(request)
  try {
    assertTrustedMutation(request)
    const principal = await requirePrincipalFromRequest(request)
    const { affiliationId } = await params
    return apiSuccess(
      await transitionProfessionalAffiliation(
        principal,
        affiliationId,
        await request.json(),
        context,
      ),
    )
  } catch (error) {
    return apiError(error, context.correlationId)
  }
}
