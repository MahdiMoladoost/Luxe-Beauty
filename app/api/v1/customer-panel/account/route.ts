import type { NextRequest } from "next/server"

import { requirePrincipalFromRequest } from "@/lib/auth/session-cookie"
import { updateCustomerAccount } from "@/lib/customer-panel/account"
import { customerPanelBootstrap } from "@/lib/customer-panel/service"
import { apiError, apiSuccess } from "@/lib/http/api-response"
import { assertTrustedMutation, requestContext } from "@/lib/http/request-context"

export async function GET(request: NextRequest) {
  const context = requestContext(request)
  try {
    const principal = await requirePrincipalFromRequest(request)
    return apiSuccess(await customerPanelBootstrap(principal))
  } catch (error) {
    return apiError(error, context.correlationId)
  }
}

export async function PATCH(request: NextRequest) {
  const context = requestContext(request)
  try {
    assertTrustedMutation(request)
    const principal = await requirePrincipalFromRequest(request)
    return apiSuccess(await updateCustomerAccount(principal, await request.json(), context))
  } catch (error) {
    return apiError(error, context.correlationId)
  }
}
