import { NextRequest, NextResponse } from "next/server"
import type { BookingDraft } from "@/lib/domain"
import { cancelBooking, confirmBooking, getBookingsForMobile } from "@/lib/server/booking-store"

export const dynamic = "force-dynamic"

type CreateBookingRequest = {
  holdId?: string
  draft?: BookingDraft
  markDepositPaid?: boolean
}

export async function GET(request: NextRequest) {
  const mobile = new URL(request.url).searchParams.get("mobile")?.trim()
  if (!mobile) {
    return NextResponse.json(
      { ok: false, error: { code: "MOBILE_REQUIRED", message: "شماره موبایل الزامی است." } },
      { status: 400 },
    )
  }
  return NextResponse.json({ ok: true, data: { bookings: getBookingsForMobile(mobile) } })
}

export async function POST(request: NextRequest) {
  let body: CreateBookingRequest
  try {
    body = (await request.json()) as CreateBookingRequest
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_JSON", message: "بدنه درخواست معتبر نیست." } },
      { status: 400 },
    )
  }

  if (!body.holdId || !body.draft) {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_BOOKING", message: "Hold و اطلاعات رزرو الزامی است." } },
      { status: 422 },
    )
  }

  try {
    const result = confirmBooking({
      holdId: body.holdId,
      draft: body.draft,
      markDepositPaid: body.markDepositPaid,
    })
    return NextResponse.json({ ok: true, data: result }, { status: 201 })
  } catch (error) {
    const fields = error instanceof Error && "fields" in error
      ? (error as Error & { fields?: Record<string, string> }).fields
      : undefined
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "BOOKING_FAILED",
          message: error instanceof Error ? error.message : "ثبت رزرو ناموفق بود.",
          fields,
        },
      },
      { status: 409 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  let body: { bookingId?: string; customerMobile?: string }
  try {
    body = (await request.json()) as { bookingId?: string; customerMobile?: string }
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_JSON", message: "بدنه درخواست معتبر نیست." } },
      { status: 400 },
    )
  }

  if (!body.bookingId || !body.customerMobile) {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_CANCEL", message: "شناسه رزرو و شماره موبایل الزامی است." } },
      { status: 422 },
    )
  }

  try {
    const booking = cancelBooking(body.bookingId, body.customerMobile)
    return NextResponse.json({ ok: true, data: { booking } })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "CANCEL_FAILED",
          message: error instanceof Error ? error.message : "لغو رزرو ناموفق بود.",
        },
      },
      { status: 409 },
    )
  }
}
