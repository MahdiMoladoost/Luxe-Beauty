import type { NextRequest } from "next/server"

import { getOwnAccount, updateOwnProfile } from "@/lib/auth/service"
import { requirePrincipalFromRequest } from "@/lib/auth/session-cookie"
import { apiError, apiSuccess } from "@/lib/http/api-response"
import { assertTrustedMutation, requestContext } from "@/lib/http/request-context"

export async function GET(request: NextRequest) {
  const context = requestContext(request)
  try {
    const principal = await requirePrincipalFromRequest(request)
    return apiSuccess(await getOwnAccount(principal))
  } catch (error) {
    return apiError(error, context.correlationId)
  }
}

export async function PATCH(request: NextRequest) {
  const context = requestContext(request)
  try {
    assertTrustedMutation(request)
    const principal = await requirePrincipalFromRequest(request)
    const profile = await updateOwnProfile(principal, await request.json(), context)
    return apiSuccess({ profile })
  } catch (error) {
    return apiError(error, context.correlationId)
  }
}
