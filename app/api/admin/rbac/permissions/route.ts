import type { NextRequest } from "next/server"

import { createCustomPermission, listPermissions } from "@/lib/auth/rbac"
import { requirePrincipalFromRequest } from "@/lib/auth/session-cookie"
import { apiError, apiSuccess } from "@/lib/http/api-response"
import { assertTrustedMutation, requestContext } from "@/lib/http/request-context"

export async function GET(request: NextRequest) {
  const context = requestContext(request)
  try {
    const principal = await requirePrincipalFromRequest(request)
    return apiSuccess(await listPermissions(principal))
  } catch (error) {
    return apiError(error, context.correlationId)
  }
}

export async function POST(request: NextRequest) {
  const context = requestContext(request)
  try {
    assertTrustedMutation(request)
    const principal = await requirePrincipalFromRequest(request)
    const permission = await createCustomPermission(principal, await request.json(), context)
    return apiSuccess(permission, 201)
  } catch (error) {
    return apiError(error, context.correlationId)
  }
}
