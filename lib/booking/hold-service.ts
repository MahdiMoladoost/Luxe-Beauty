import { Prisma, type BookingHold } from "@prisma/client"
import { z } from "zod"

import { AuthError } from "@/lib/auth/errors"
import type { RequestContext, SessionPrincipal } from "@/lib/auth/types"
import {
  BookingHoldPolicyError,
  holdRequestHash,
  validateHoldStart,
} from "@/lib/booking/hold-policy"
import { bookingHoldRepository } from "@/lib/booking/hold-repository"

const createHoldSchema = z.object({
  quoteId: z.string().uuid(),
  startsAt: z.string().datetime({ offset: true }),
})

const idempotencyKeySchema = z
  .string()
  .trim()
  .min(8)
  .max(160)
  .regex(/^[A-Za-z0-9._:-]+$/, "Idempotency-Key contains unsupported characters")

function holdDto(hold: BookingHold) {
  return {
    id: hold.id,
    quoteId: hold.quoteId,
    offeringId: hold.offeringId,
    providerId: hold.providerId,
    branchId: hold.branchId,
    professionalId: hold.professionalId,
    resourceType: hold.resourceType,
    resourceId: hold.resourceId,
    startsAt: hold.startsAt,
    endsAt: hold.endsAt,
    occupiedFrom: hold.occupiedFrom,
    occupiedUntil: hold.occupiedUntil,
    status: hold.status,
    expiresAt: hold.expiresAt,
    createdAt: hold.createdAt,
    updatedAt: hold.updatedAt,
  }
}

function repositoryError(kind: string): never {
  switch (kind) {
    case "IDEMPOTENCY_CONFLICT":
      throw new AuthError(
        "IDEMPOTENCY_CONFLICT",
        "این کلید تکرار قبلاً برای درخواست متفاوتی استفاده شده است.",
        409,
      )
    case "IDEMPOTENCY_IN_PROGRESS":
      throw new AuthError(
        "IDEMPOTENCY_IN_PROGRESS",
        "درخواست قبلی با این کلید هنوز در حال پردازش است.",
        409,
      )
    case "QUOTE_NOT_FOUND":
      throw new AuthError("QUOTE_NOT_FOUND", "پیش‌فاکتور معتبر یافت نشد.", 404)
    case "QUOTE_EXPIRED":
      throw new AuthError("QUOTE_EXPIRED", "اعتبار پیش‌فاکتور به پایان رسیده است.", 409)
    case "QUOTE_OWNER_MISMATCH":
      throw new AuthError("QUOTE_NOT_FOUND", "پیش‌فاکتور معتبر یافت نشد.", 404)
    case "QUOTE_STALE":
      throw new AuthError(
        "QUOTE_STALE",
        "اطلاعات خدمت یا قیمت پس از صدور پیش‌فاکتور تغییر کرده است. قیمت را دوباره دریافت کنید.",
        409,
      )
    case "OFFERING_NOT_AVAILABLE":
      throw new AuthError("OFFERING_NOT_AVAILABLE", "این خدمت در حال حاضر قابل رزرو نیست.", 409)
    case "SCHEDULE_NOT_CONFIGURED":
      throw new AuthError("SCHEDULE_NOT_CONFIGURED", "برای این خدمت برنامه زمانی فعالی ثبت نشده است.", 409)
    case "SLOT_NOT_AVAILABLE":
      throw new AuthError(
        "SLOT_NOT_AVAILABLE",
        "این زمان دیگر در دسترس نیست. نزدیک‌ترین زمان آزاد را دوباره بررسی کنید.",
        409,
      )
    default:
      throw new AuthError("BOOKING_HOLD_FAILED", "رزرو موقت ایجاد نشد.", 400)
  }
}

function policyError(error: BookingHoldPolicyError): never {
  const messages: Record<string, string> = {
    QUOTE_SNAPSHOT_INVALID: "اطلاعات ذخیره‌شده پیش‌فاکتور معتبر نیست. قیمت را دوباره دریافت کنید.",
    QUOTE_NOT_DIRECTLY_BOOKABLE: "این پیش‌فاکتور برای رزرو مستقیم نهایی نیست.",
    INVALID_START_TIME: "زمان انتخاب‌شده معتبر نیست.",
    START_TIME_IN_PAST: "زمان انتخاب‌شده گذشته است.",
    START_TIME_TOO_FAR: "زمان انتخاب‌شده خارج از بازه مجاز رزرو است.",
  }
  throw new AuthError(error.code, messages[error.code] ?? "اطلاعات رزرو موقت معتبر نیست.", 409)
}

export async function createBookingHold(
  principal: SessionPrincipal,
  rawInput: unknown,
  rawIdempotencyKey: string | null,
  context: RequestContext,
) {
  if (principal.identityStatus !== "VERIFIED") {
    throw new AuthError(
      "IDENTITY_VERIFICATION_REQUIRED",
      "پیش از رزرو باید احراز هویت حساب تکمیل شود.",
      403,
    )
  }
  if (!rawIdempotencyKey) {
    throw new AuthError(
      "IDEMPOTENCY_KEY_REQUIRED",
      "برای ایجاد رزرو موقت، هدر Idempotency-Key الزامی است.",
      400,
    )
  }
  const input = createHoldSchema.parse(rawInput)
  const idempotencyKey = idempotencyKeySchema.parse(rawIdempotencyKey)
  const startsAt = new Date(input.startsAt)
  const now = new Date()

  try {
    validateHoldStart(startsAt, now)
    const result = await bookingHoldRepository.createOrReplay({
      principal,
      quoteId: input.quoteId,
      startsAt,
      idempotencyKey,
      requestHash: holdRequestHash({ quoteId: input.quoteId, startsAt }),
      now,
      context,
    })
    if (result.kind !== "CREATED" && result.kind !== "REPLAY") repositoryError(result.kind)
    return { hold: holdDto(result.hold), replayed: result.kind === "REPLAY" }
  } catch (error) {
    if (error instanceof BookingHoldPolicyError) policyError(error)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2004") repositoryError("SLOT_NOT_AVAILABLE")
      if (error.code === "P2034") {
        throw new AuthError(
          "BOOKING_CONCURRENCY_RETRY",
          "زمان انتخاب‌شده هم‌زمان در حال بررسی است. دوباره تلاش کنید.",
          409,
        )
      }
    }
    throw error
  }
}

export async function getOwnedBookingHold(principal: SessionPrincipal, holdId: string) {
  const hold = await bookingHoldRepository.ownedHold(
    principal.userId,
    z.string().uuid().parse(holdId),
    new Date(),
  )
  if (!hold) throw new AuthError("BOOKING_HOLD_NOT_FOUND", "رزرو موقت یافت نشد.", 404)
  return holdDto(hold)
}

export async function releaseOwnedBookingHold(
  principal: SessionPrincipal,
  holdId: string,
  context: RequestContext,
) {
  const result = await bookingHoldRepository.releaseOwnedHold({
    principal,
    holdId: z.string().uuid().parse(holdId),
    context,
    now: new Date(),
  })
  if (result.kind === "NOT_FOUND") {
    throw new AuthError("BOOKING_HOLD_NOT_FOUND", "رزرو موقت یافت نشد.", 404)
  }
  return { hold: holdDto(result.hold), changed: result.kind === "UPDATED" }
}
