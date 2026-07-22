import type { NextRequest } from "next/server"

import { requirePrincipalFromRequest } from "@/lib/auth/session-cookie"
import { customerBookings } from "@/lib/customer-panel/service"
import { apiError, apiSuccess } from "@/lib/http/api-response"
import { requestContext } from "@/lib/http/request-context"

export async function GET(request: NextRequest) {
  const context = requestContext(request)
  try {
    const principal = await requirePrincipalFromRequest(request)
    return apiSuccess(
      await customerBookings(principal, {
        scope: request.nextUrl.searchParams.get("scope") ?? undefined,
        status: request.nextUrl.searchParams.get("status") ?? undefined,
        query: request.nextUrl.searchParams.get("query") ?? undefined,
        page: request.nextUrl.searchParams.get("page") ?? undefined,
        pageSize: request.nextUrl.searchParams.get("pageSize") ?? undefined,
      }),
    )
  } catch (error) {
    return apiError(error, context.correlationId)
  }
}
