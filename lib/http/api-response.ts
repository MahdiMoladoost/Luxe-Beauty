import { Prisma } from "@prisma/client"
import { ZodError } from "zod"
import { NextResponse } from "next/server"

import { AuthError } from "@/lib/auth/errors"

export function apiSuccess<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ ok: true, data }, { status })
}

export function apiError(error: unknown, correlationId?: string): NextResponse {
  if (error instanceof AuthError) {
    return NextResponse.json({
      ok: false,
      error: { code: error.code, message: error.message, details: error.details },
      correlationId,
    }, { status: error.status })
  }

  if (error instanceof ZodError) {
    return NextResponse.json({
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "اطلاعات ورودی معتبر نیست.",
        details: error.flatten(),
      },
      correlationId,
    }, { status: 400 })
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return NextResponse.json({
      ok: false,
      error: { code: "CONFLICT", message: "رکوردی با این مشخصات قبلاً ثبت شده است." },
      correlationId,
    }, { status: 409 })
  }

  console.error(JSON.stringify({ event: "api.unhandled-error", correlationId, error }))
  return NextResponse.json({
    ok: false,
    error: { code: "INTERNAL_ERROR", message: "خطای داخلی رخ داد." },
    correlationId,
  }, { status: 500 })
}
