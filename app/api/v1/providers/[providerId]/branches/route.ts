import type { NextRequest } from "next/server"

import { requirePrincipalFromRequest } from "@/lib/auth/session-cookie"
import { apiError, apiSuccess } from "@/lib/http/api-response"
import { assertTrustedMutation, requestContext } from "@/lib/http/request-context"
import { createOwnedBranch, listOwnedBranches } from "@/lib/provider/branch-service"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ providerId: string }> },
) {
  const context = requestContext(request)
  try {
    const principal = await requirePrincipalFromRequest(request)
    const { providerId } = await params
    return apiSuccess(await listOwnedBranches(principal, providerId))
  } catch (error) {
    return apiError(error, context.correlationId)
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ providerId: string }> },
) {
  const context = requestContext(request)
  try {
    assertTrustedMutation(request)
    const principal = await requirePrincipalFromRequest(request)
    const { providerId } = await params
    return apiSuccess(
      await createOwnedBranch(principal, providerId, await request.json(), context),
      201,
    )
  } catch (error) {
    return apiError(error, context.correlationId)
  }
}
