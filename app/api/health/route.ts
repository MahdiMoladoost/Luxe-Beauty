import { NextResponse } from "next/server"
import { getBookingStateSnapshot } from "@/lib/server/booking-store"

export const dynamic = "force-dynamic"

export async function GET() {
  return NextResponse.json({
    ok: true,
    data: {
      service: "luxe-beauty",
      status: "healthy",
      time: new Date().toISOString(),
      bookingStore: getBookingStateSnapshot(),
      persistence: process.env.DATABASE_URL ? "external" : "in-memory-demo",
    },
  })
}
