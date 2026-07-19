import { NextRequest, NextResponse } from "next/server"
import { isIranianMobile } from "@/lib/booking-engine"
import { createSlotHold } from "@/lib/server/booking-store"

export const dynamic = "force-dynamic"

type HoldRequest = {
  salonId?: string
  serviceIds?: string[]
  staffId?: string
  date?: string
  startTime?: string
  customerMobile?: string
}

export async function POST(request: NextRequest) {
  let body: HoldRequest
  try {
    body = (await request.json()) as HoldRequest
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_JSON", message: "بدنه درخواست معتبر نیست." } },
      { status: 400 },
    )
  }

  if (
    !body.salonId ||
    !Array.isArray(body.serviceIds) ||
    body.serviceIds.length === 0 ||
    !body.date ||
    !body.startTime ||
    !body.customerMobile ||
    !isIranianMobile(body.customerMobile)
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INVALID_HOLD_REQUEST",
          message: "سالن، خدمت، تاریخ، ساعت و شماره موبایل معتبر الزامی است.",
        },
      },
      { status: 422 },
    )
  }

  try {
    const result = createSlotHold({
      salonId: body.salonId,
      serviceIds: body.serviceIds,
      requestedStaffId: body.staffId,
      date: body.date,
      startTime: body.startTime,
      customerKey: body.customerMobile,
    })
    return NextResponse.json({ ok: true, data: result }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "SLOT_UNAVAILABLE",
          message: error instanceof Error ? error.message : "امکان نگه‌داری این زمان وجود ندارد.",
        },
      },
      { status: 409 },
    )
  }
}
