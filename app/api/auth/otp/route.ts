import { NextRequest, NextResponse } from "next/server"
import { requestOtp, verifyOtp } from "@/lib/server/otp-store"

export const dynamic = "force-dynamic"

type OtpRequest = {
  action?: "request" | "verify"
  mobile?: string
  code?: string
}

export async function POST(request: NextRequest) {
  let body: OtpRequest
  try {
    body = (await request.json()) as OtpRequest
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_JSON", message: "بدنه درخواست معتبر نیست." } },
      { status: 400 },
    )
  }

  try {
    if (body.action === "request" && body.mobile) {
      const result = requestOtp(body.mobile)
      return NextResponse.json({ ok: true, data: result }, { status: 201 })
    }

    if (body.action === "verify" && body.mobile && body.code) {
      const result = verifyOtp(body.mobile, body.code)
      const response = NextResponse.json({ ok: true, data: result })
      response.cookies.set("luxe_session", result.sessionToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      })
      response.cookies.set("luxe_mobile", body.mobile, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      })
      return response
    }

    return NextResponse.json(
      { ok: false, error: { code: "INVALID_OTP_ACTION", message: "عملیات OTP معتبر نیست." } },
      { status: 422 },
    )
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "OTP_FAILED",
          message: error instanceof Error ? error.message : "عملیات تایید شماره ناموفق بود.",
        },
      },
      { status: 429 },
    )
  }
}
