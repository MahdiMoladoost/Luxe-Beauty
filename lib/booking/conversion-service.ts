import { Prisma, type BookingItem, type BookingTransition, type ServiceRecipient } from "@prisma/client"
import { z } from "zod"

import { AuthError } from "@/lib/auth/errors"
import type { RequestContext, SessionPrincipal } from "@/lib/auth/types"
import {
  bookingConversionRequestHash,
  BookingConversionPolicyError,
  validateLegalAcceptance,
} from "@/lib/booking/conversion-policy"
import { bookingConversionRepository } from "@/lib/booking/conversion-repository"

const createBookingSchema = z.object({
  holdId: z.string().uuid(),
  recipientId: z.string().uuid(),
  legalAcceptance: z.object({
    termsVersion: z.string().trim().min(2).max(100),
    privacyVersion: z.string().trim().min(2).max(100),
    bookingVersion: z.string().trim().min(2).max(100),
  }),
  questionnaireAnswers: z.record(z.string().min(1).max(100), z.unknown()).nullable().optional(),
})

const idempotencyKeySchema = z
  .string()
  .trim()
  .min(8)
  .max(160)
  .regex(/^[A-Za-z0-9._:-]+$/, "Idempotency-Key contains unsupported characters")

type BookingDetails = NonNullable<Awaited<ReturnType<typeof bookingConversionRepository.ownedBooking>>>

function bookingDto(booking: BookingDetails) {
  return {
    id: booking.id,
    recipientId: booking.recipientId,
    providerId: booking.providerId,
    branchId: booking.branchId,
    status: booking.status,
    currency: booking.currency,
    subtotalToman: booking.subtotalToman.toString(),
    discountToman: booking.discountToman.toString(),
    travelFeeToman: booking.travelFeeToman.toString(),
    platformFeeToman: booking.platformFeeToman.toString(),
    totalToman: booking.totalToman.toString(),
    approvalDeadlineAt: booking.approvalDeadlineAt,
    version: booking.version,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
    recipient: recipientDto(booking.recipient),
    items: booking.items.map(bookingItemDto),
    transitions: booking.transitions.map(bookingTransitionDto),
  }
}

function recipientDto(recipient: ServiceRecipient) {
  return {
    id: recipient.id,
    firstName: recipient.firstName,
    lastName: recipient.lastName,
    birthDate: recipient.birthDate?.toISOString().slice(0, 10) ?? null,
    genderCode: recipient.genderCode,
    relationLabel: recipient.relationLabel,
  }
}

function bookingItemDto(item: BookingItem) {
  return {
    id: item.id,
    offeringId: item.offeringId,
    professionalId: item.professionalId,
    startsAt: item.startsAt,
    endsAt: item.endsAt,
    occupiedFrom: item.occupiedFrom,
    occupiedUntil: item.occupiedUntil,
    unitPriceToman: item.unitPriceToman.toString(),
    quantity: item.quantity,
  }
}

function bookingTransitionDto(transition: BookingTransition) {
  return {
    id: transition.id,
    fromStatus: transition.fromStatus,
    toStatus: transition.toStatus,
    reasonCode: transition.reasonCode,
    createdAt: transition.createdAt,
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
    case "HOLD_NOT_FOUND":
      throw new AuthError("BOOKING_HOLD_NOT_FOUND", "رزرو موقت یافت نشد.", 404)
    case "HOLD_EXPIRED":
      throw new AuthError("BOOKING_HOLD_EXPIRED", "اعتبار رزرو موقت به پایان رسیده است.", 409)
    case "HOLD_ALREADY_CONSUMED":
      throw new AuthError(
        "BOOKING_HOLD_ALREADY_CONSUMED",
        "این رزرو موقت قبلاً به نوبت تبدیل شده است.",
        409,
      )
    case "HOLD_NOT_ACTIVE":
      throw new AuthError("BOOKING_HOLD_NOT_ACTIVE", "رزرو موقت دیگر فعال نیست.", 409)
    case "RECIPIENT_NOT_FOUND":
      throw new AuthError("BOOKING_RECIPIENT_NOT_FOUND", "دریافت‌کننده خدمت یافت نشد.", 404)
    case "QUOTE_NOT_FOUND":
      throw new AuthError("QUOTE_NOT_FOUND", "پیش‌فاکتور معتبر یافت نشد.", 404)
    case "QUOTE_STALE":
      throw new AuthError(
        "QUOTE_STALE",
        "اطلاعات قیمت یا خدمت تغییر کرده است. پیش‌فاکتور و زمان را دوباره دریافت کنید.",
        409,
      )
    case "OFFERING_NOT_AVAILABLE":
      throw new AuthError("OFFERING_NOT_AVAILABLE", "این خدمت دیگر قابل رزرو نیست.", 409)
    default:
      throw new AuthError("BOOKING_CREATE_FAILED", "ایجاد نوبت انجام نشد.", 400)
  }
}

function policyError(error: BookingConversionPolicyError): never {
  const messages: Record<string, string> = {
    HOLD_SNAPSHOT_INVALID: "اطلاعات رزرو موقت معتبر نیست. لطفاً دوباره زمان انتخاب کنید.",
    LEGAL_VERSION_STALE: "نسخه قوانین تغییر کرده است. قوانین جدید را مطالعه و تأیید کنید.",
    GUARDIAN_WORKFLOW_REQUIRED: "این خدمت به فرایند اختصاصی ولی یا سرپرست نیاز دارد.",
    RECIPIENT_NOT_ELIGIBLE: "دریافت‌کننده با شرایط این خدمت سازگار نیست.",
    QUESTIONNAIRE_INCOMPLETE: "پرسش‌های الزامی خدمت کامل نشده‌اند.",
    PAYMENT_FLOW_REQUIRED: "این خدمت پیش از تأیید به پرداخت نیاز دارد و مسیر پرداخت هنوز آغاز نشده است.",
    APPOINTMENT_TOO_SOON_FOR_MANUAL_APPROVAL:
      "زمان کافی برای تأیید دستی ارائه‌دهنده وجود ندارد. زمان دیگری انتخاب کنید.",
  }
  throw new AuthError(error.code, messages[error.code] ?? "قواعد رزرو معتبر نیست.", 409)
}

export async function createBookingFromHold(
  principal: SessionPrincipal,
  rawInput: unknown,
  rawIdempotencyKey: string | null,
  context: RequestContext,
) {
  if (principal.identityStatus !== "VERIFIED") {
    throw new AuthError(
      "IDENTITY_VERIFICATION_REQUIRED",
      "پیش از ثبت نوبت باید احراز هویت حساب تکمیل شود.",
      403,
    )
  }
  if (!rawIdempotencyKey) {
    throw new AuthError(
      "IDEMPOTENCY_KEY_REQUIRED",
      "برای ایجاد نوبت، هدر Idempotency-Key الزامی است.",
      400,
    )
  }

  const input = createBookingSchema.parse(rawInput)
  const idempotencyKey = idempotencyKeySchema.parse(rawIdempotencyKey)

  try {
    const legalAcceptance = validateLegalAcceptance(input.legalAcceptance)
    const questionnaireAnswers = input.questionnaireAnswers ?? null
    const result = await bookingConversionRepository.createOrReplay({
      principal,
      holdId: input.holdId,
      recipientId: input.recipientId,
      idempotencyKey,
      requestHash: bookingConversionRequestHash({
        customerUserId: principal.userId,
        holdId: input.holdId,
        recipientId: input.recipientId,
        legalAcceptance,
        questionnaireAnswers,
      }),
      legalAcceptance,
      questionnaireAnswers,
      now: new Date(),
      context,
    })
    if (result.kind !== "CREATED" && result.kind !== "REPLAY") repositoryError(result.kind)
    return { booking: bookingDto(result.booking), replayed: result.kind === "REPLAY" }
  } catch (error) {
    if (error instanceof BookingConversionPolicyError) policyError(error)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2004" || error.code === "P2002") {
        throw new AuthError(
          "BOOKING_SLOT_CONFLICT",
          "این زمان هم‌زمان رزرو شده است. زمان آزاد دیگری انتخاب کنید.",
          409,
        )
      }
      if (error.code === "P2034") {
        throw new AuthError(
          "BOOKING_CONCURRENCY_RETRY",
          "رزرو هم‌زمان در حال پردازش است. دوباره تلاش کنید.",
          409,
        )
      }
    }
    throw error
  }
}

export async function getOwnedBooking(principal: SessionPrincipal, bookingId: string) {
  const booking = await bookingConversionRepository.ownedBooking(
    principal.userId,
    z.string().uuid().parse(bookingId),
  )
  if (!booking) throw new AuthError("BOOKING_NOT_FOUND", "نوبت یافت نشد.", 404)
  return bookingDto(booking)
}
