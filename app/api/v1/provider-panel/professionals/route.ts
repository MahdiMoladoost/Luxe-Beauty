import type { NextRequest } from "next/server"

import { requirePrincipalFromRequest } from "@/lib/auth/session-cookie"
import { apiError, apiSuccess } from "@/lib/http/api-response"
import { requestContext } from "@/lib/http/request-context"
import { providerProfessionalWorkspace } from "@/lib/provider-panel/professionals"

export async function GET(request: NextRequest) {
  const context = requestContext(request)
  try {
    const principal = await requirePrincipalFromRequest(request)
    return apiSuccess(
      await providerProfessionalWorkspace(
        principal,
        request.nextUrl.searchParams.get("providerId") ?? "",
        request.nextUrl.searchParams.get("query"),
      ),
    )
  } catch (error) {
    return apiError(error, context.correlationId)
  }
}
