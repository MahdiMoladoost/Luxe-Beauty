import type { NextRequest } from "next/server"

import { previewOfferingAvailability } from "@/lib/availability/service"
import { apiError, apiSuccess } from "@/lib/http/api-response"
import { requestContext } from "@/lib/http/request-context"

type AvailabilityParams = Promise<{ offeringId: string }>

export async function GET(
  request: NextRequest,
  { params }: { params: AvailabilityParams },
) {
  const context = requestContext(request)
  try {
    const { offeringId } = await params
    const stepMinute = request.nextUrl.searchParams.get("stepMinute")
    const limit = request.nextUrl.searchParams.get("limit")
    return apiSuccess(
      await previewOfferingAvailability(offeringId, {
        from: request.nextUrl.searchParams.get("from"),
        to: request.nextUrl.searchParams.get("to"),
        stepMinute: stepMinute === null ? undefined : Number(stepMinute),
        limit: limit === null ? undefined : Number(limit),
      }),
    )
  } catch (error) {
    return apiError(error, context.correlationId)
  }
}
