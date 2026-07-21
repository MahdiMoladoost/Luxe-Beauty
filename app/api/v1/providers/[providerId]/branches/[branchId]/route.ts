import type { NextRequest } from "next/server"

import { requirePrincipalFromRequest } from "@/lib/auth/session-cookie"
import { apiError, apiSuccess } from "@/lib/http/api-response"
import { assertTrustedMutation, requestContext } from "@/lib/http/request-context"
import {
  deleteOwnedBranch,
  getOwnedBranch,
  updateOwnedBranch,
} from "@/lib/provider/branch-service"

type BranchParams = Promise<{ providerId: string; branchId: string }>

export async function GET(
  request: NextRequest,
  { params }: { params: BranchParams },
) {
  const context = requestContext(request)
  try {
    const principal = await requirePrincipalFromRequest(request)
    const { providerId, branchId } = await params
    return apiSuccess(await getOwnedBranch(principal, providerId, branchId))
  } catch (error) {
    return apiError(error, context.correlationId)
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: BranchParams },
) {
  const context = requestContext(request)
  try {
    assertTrustedMutation(request)
    const principal = await requirePrincipalFromRequest(request)
    const { providerId, branchId } = await params
    return apiSuccess(
      await updateOwnedBranch(
        principal,
        providerId,
        branchId,
        await request.json(),
        context,
      ),
    )
  } catch (error) {
    return apiError(error, context.correlationId)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: BranchParams },
) {
  const context = requestContext(request)
  try {
    assertTrustedMutation(request)
    const principal = await requirePrincipalFromRequest(request)
    const { providerId, branchId } = await params
    const expectedUpdatedAt = request.nextUrl.searchParams.get("expectedUpdatedAt")
    return apiSuccess(
      await deleteOwnedBranch(
        principal,
        providerId,
        branchId,
        expectedUpdatedAt || "",
        context,
      ),
    )
  } catch (error) {
    return apiError(error, context.correlationId)
  }
}
