import { NextRequest, NextResponse } from "next/server"
import { listAvailableSlots } from "@/lib/server/booking-store"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const salonId = searchParams.get("salonId")?.trim()
  const date = searchParams.get("date")?.trim()
  const staffId = searchParams.get("staffId")?.trim() || undefined
  const serviceIds = searchParams.getAll("serviceId").filter(Boolean)

  if (!salonId || !date) {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_QUERY", message: "شناسه سالن و تاریخ الزامی است." } },
      { status: 400 },
    )
  }

  try {
    const slots = listAvailableSlots({ salonId, date, staffId, serviceIds })
    return NextResponse.json({ ok: true, data: { slots } })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "AVAILABILITY_ERROR",
          message: error instanceof Error ? error.message : "خطا در دریافت زمان‌های آزاد.",
        },
      },
      { status: 400 },
    )
  }
}
