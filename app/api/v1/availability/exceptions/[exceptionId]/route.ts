import type { NextRequest } from "next/server"

import { requirePrincipalFromRequest } from "@/lib/auth/session-cookie"
import { deleteOwnedScheduleException } from "@/lib/availability/service"
import { apiError, apiSuccess } from "@/lib/http/api-response"
import { assertTrustedMutation, requestContext } from "@/lib/http/request-context"

type ExceptionParams = Promise<{ exceptionId: string }>

export async function DELETE(
  request: NextRequest,
  { params }: { params: ExceptionParams },
) {
  const context = requestContext(request)
  try {
    assertTrustedMutation(request)
    const principal = await requirePrincipalFromRequest(request)
    const { exceptionId } = await params
    return apiSuccess(await deleteOwnedScheduleException(principal, exceptionId, context))
  } catch (error) {
    return apiError(error, context.correlationId)
  }
}
