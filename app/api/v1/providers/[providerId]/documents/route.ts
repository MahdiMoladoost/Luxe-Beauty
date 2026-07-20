import type { NextRequest } from "next/server"

import { AuthError } from "@/lib/auth/errors"
import { requirePrincipalFromRequest } from "@/lib/auth/session-cookie"
import { uploadProviderDocument } from "@/lib/provider/service"
import { apiError, apiSuccess } from "@/lib/http/api-response"
import { assertTrustedMutation, requestContext } from "@/lib/http/request-context"

export const runtime = "nodejs"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ providerId: string }> },
) {
  const context = requestContext(request)
  try {
    assertTrustedMutation(request)
    const principal = await requirePrincipalFromRequest(request)
    const { providerId } = await params
    const form = await request.formData()
    const file = form.get("file")
    if (!(file instanceof File)) throw new AuthError("FILE_REQUIRED", "فایل مدرک الزامی است.", 400)

    const document = await uploadProviderDocument(
      principal,
      providerId,
      {
        documentType: form.get("documentType"),
        expiresAt: form.get("expiresAt") || undefined,
      },
      {
        bytes: new Uint8Array(await file.arrayBuffer()),
        mimeType: file.type,
        originalFileName: file.name,
      },
      context,
    )
    return apiSuccess(document, 201)
  } catch (error) {
    return apiError(error, context.correlationId)
  }
}
