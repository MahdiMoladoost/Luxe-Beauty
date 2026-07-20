import type { NextRequest } from "next/server"

import { requirePrincipalFromRequest } from "@/lib/auth/session-cookie"
import { readPrivateProviderDocument } from "@/lib/provider/service"
import { apiError } from "@/lib/http/api-response"
import { requestContext } from "@/lib/http/request-context"

export const runtime = "nodejs"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const context = requestContext(request)
  try {
    const principal = await requirePrincipalFromRequest(request)
    const { documentId } = await params
    const document = await readPrivateProviderDocument(
      principal,
      documentId,
      request.headers.get("x-access-reason"),
      context,
    )
    return new Response(Buffer.from(document.bytes), {
      headers: {
        "content-type": document.mimeType,
        "content-disposition": `attachment; filename*=UTF-8''${encodeURIComponent(document.fileName)}`,
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
      },
    })
  } catch (error) {
    return apiError(error, context.correlationId)
  }
}
