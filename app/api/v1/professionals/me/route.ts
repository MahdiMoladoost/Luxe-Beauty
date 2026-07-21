import type { NextRequest } from "next/server"

import { requirePrincipalFromRequest } from "@/lib/auth/session-cookie"
import { apiError, apiSuccess } from "@/lib/http/api-response"
import { assertTrustedMutation, requestContext } from "@/lib/http/request-context"
import {
  ensureOwnProfessionalProfile,
  getOwnProfessionalProfile,
} from "@/lib/provider/affiliation-service"

export async function GET(request: NextRequest) {
  const context = requestContext(request)
  try {
    const principal = await requirePrincipalFromRequest(request)
    return apiSuccess(await getOwnProfessionalProfile(principal))
  } catch (error) {
    return apiError(error, context.correlationId)
  }
}

export async function PUT(request: NextRequest) {
  const context = requestContext(request)
  try {
    assertTrustedMutation(request)
    const principal = await requirePrincipalFromRequest(request)
    return apiSuccess(
      await ensureOwnProfessionalProfile(principal, await request.json(), context),
    )
  } catch (error) {
    return apiError(error, context.correlationId)
  }
}
