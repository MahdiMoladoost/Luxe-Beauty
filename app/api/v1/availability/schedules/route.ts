import type { NextRequest } from "next/server"

import { requirePrincipalFromRequest } from "@/lib/auth/session-cookie"
import { getOwnedSchedule, replaceOwnedSchedule } from "@/lib/availability/service"
import { apiError, apiSuccess } from "@/lib/http/api-response"
import { assertTrustedMutation, requestContext } from "@/lib/http/request-context"

export async function GET(request: NextRequest) {
  const context = requestContext(request)
  try {
    const principal = await requirePrincipalFromRequest(request)
    return apiSuccess(
      await getOwnedSchedule(principal, {
        ownerType: request.nextUrl.searchParams.get("ownerType"),
        ownerId: request.nextUrl.searchParams.get("ownerId"),
      }),
    )
  } catch (error) {
    return apiError(error, context.correlationId)
  }
}

export async function PUT(request: NextRequest) {
  const context = requestContext(request)
  try {
    assertTrustedMutation(request)
    const principal = await requirePrincipalFromRequest(request)
    return apiSuccess(await replaceOwnedSchedule(principal, await request.json(), context))
  } catch (error) {
    return apiError(error, context.correlationId)
  }
}
