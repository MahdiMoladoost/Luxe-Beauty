import { Prisma, type BookingItem, type BookingTransition, type ServiceRecipient } from "@prisma/client"
import { z } from "zod"

import { AuthError } from "@/lib/auth/errors"
import type { RequestContext, SessionPrincipal } from "@/lib/auth/types"
import {
  providerBookingDecisionActions,
  providerBookingDecisionRequestHash,
  ProviderBookingDecisionPolicyError,
  providerRejectionReasonCodes,
  type ProviderBookingDecisionAction,
} from "@/lib/booking/provider-decision-policy"
import { providerBookingDecisionRepository } from "@/lib/booking/provider-decision-repository"
import { normalizePersianText } from "@/lib/localization/normalize-fa"

const idempotencyKeySchema = z
  .string()
  .trim()
  .min(8)
  .max(160)
  .regex(/^[A-Za-z0-9._:-]+$/, "Idempotency-Key contains unsupported characters")

const approveSchema = z.object({
  expectedVersion: z.number().int().positive(),
})

const rejectSchema = z.object({
  expectedVersion: z.number().int().positive(),
  reasonCode: z.enum(providerRejectionReasonCodes),
  reason: z.string().trim().min(5).max(500),
})

type ProviderBookingDetails = NonNullable<
  Awaited<ReturnType<typeof providerBookingDecisionRepository.decideOrReplay>> extends infer Result
    ? Result extends { booking: infer Booking }
      ? Booking
      : never
    : never
>

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

function itemDto(item: BookingItem) {
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

function transitionDto(transition: BookingTransition) {
  return {
    id: transition.id,
    fromStatus: transition.fromStatus,
    toStatus: transition.toStatus,
    reasonCode: transition.reasonCode,
    reason: transition.reason,
    createdAt: transition.createdAt,
  }
}

function bookingDto(booking: ProviderBookingDetails) {
  return {
    id: booking.id,
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
    items: booking.items.map(itemDto),
    transitions: booking.transitions.map(transitionDto),
  }
}

function repositoryError(kind: string): never {
  switch (kind) {
    case "IDEMPOTENCY_CONFLICT":
      throw new AuthError(
        "IDEMPOTENCY_CONFLICT",
        "این کلید تکرار قبلاً برای تصمیم متفاوتی استفاده شده است.",
        409,
      )
    case "IDEMPOTENCY_IN_PROGRESS":
      throw new AuthError(
        "IDEMPOTENCY_IN_PROGRESS",
        "تصمیم قبلی با این کلید هنوز در حال پردازش است.",
        409,
      )
    case "BOOKING_NOT_FOUND":
      throw new AuthError("BOOKING_NOT_FOUND", "نوبت قابل مدیریت یافت نشد.", 404)
    case "BOOKING_NOT_PENDING":
      throw new AuthError(
        "BOOKING_NOT_AWAITING_PROVIDER_APPROVAL",
        "این نوبت دیگر در انتظار تصمیم ارائه‌دهنده نیست.",
        409,
      )
    case "VERSION_CONFLICT":
      throw new AuthError(
        "BOOKING_VERSION_CONFLICT",
        "نوبت هم‌زمان تغییر کرده است. نسخه جدید را دریافت و دوباره تلاش کنید.",
        409,
      )
    case "APPROVAL_DEADLINE_EXPIRED":
      throw new AuthError(
        "APPROVAL_DEADLINE_EXPIRED",
        "مهلت پاسخ‌گویی پایان یافته و نوبت منقضی شده است.",
        409,
      )
    case "PAYMENT_WORKFLOW_REQUIRED":
      throw new AuthError(
        "PAYMENT_WORKFLOW_REQUIRED",
        "این نوبت سابقه پرداخت دارد و تصمیم آن باید از مسیر مالی امن انجام شود.",
        409,
      )
    case "BOOKING_ALLOCATION_NOT_FOUND":
      throw new AuthError(
        "BOOKING_ALLOCATION_INVALID",
        "تخصیص زمانی معتبر این نوبت یافت نشد. موضوع برای بررسی ثبت شود.",
        409,
      )
    case "CONCURRENCY_CONFLICT":
      throw new AuthError(
        "BOOKING_CONCURRENCY_RETRY",
        "نوبت هم‌زمان در حال تغییر است. دوباره تلاش کنید.",
        409,
      )
    default:
      throw new AuthError("BOOKING_PROVIDER_DECISION_FAILED", "تصمیم نوبت ثبت نشد.", 400)
  }
}

function policyError(error: ProviderBookingDecisionPolicyError): never {
  const messages: Record<string, string> = {
    BOOKING_NOT_AWAITING_PROVIDER_APPROVAL: "این نوبت در انتظار تصمیم ارائه‌دهنده نیست.",
    BOOKING_VERSION_CONFLICT: "نسخه نوبت قدیمی است.",
    APPROVAL_DEADLINE_EXPIRED: "مهلت پاسخ‌گویی ارائه‌دهنده پایان یافته است.",
    REJECTION_REASON_REQUIRED: "برای رد نوبت، دلیل معتبر الزامی است.",
  }
  throw new AuthError(error.code, messages[error.code] ?? "قواعد تصمیم نوبت معتبر نیست.", 409)
}

async function decideProviderBooking(
  principal: SessionPrincipal,
  bookingId: string,
  action: ProviderBookingDecisionAction,
  rawInput: unknown,
  rawIdempotencyKey: string | null,
  context: RequestContext,
) {
  if (!rawIdempotencyKey) {
    throw new AuthError(
      "IDEMPOTENCY_KEY_REQUIRED",
      "برای تصمیم نوبت، هدر Idempotency-Key الزامی است.",
      400,
    )
  }

  const parsedBookingId = z.string().uuid().parse(bookingId)
  const idempotencyKey = idempotencyKeySchema.parse(rawIdempotencyKey)
  const input = action === "APPROVE" ? approveSchema.parse(rawInput) : rejectSchema.parse(rawInput)
  const reasonCode = action === "REJECT" && "reasonCode" in input ? input.reasonCode : undefined
  const reason =
    action === "REJECT" && "reason" in input ? normalizePersianText(input.reason) : undefined

  try {
    const result = await providerBookingDecisionRepository.decideOrReplay({
      principal,
      bookingId: parsedBookingId,
      action,
      expectedVersion: input.expectedVersion,
      reasonCode,
      reason,
      idempotencyKey,
      requestHash: providerBookingDecisionRequestHash({
        providerUserId: principal.userId,
        bookingId: parsedBookingId,
        action,
        expectedVersion: input.expectedVersion,
        reasonCode,
        reason,
      }),
      now: new Date(),
      context,
    })
    if (result.kind !== "UPDATED" && result.kind !== "REPLAY") repositoryError(result.kind)
    return { booking: bookingDto(result.booking), replayed: result.kind === "REPLAY" }
  } catch (error) {
    if (error instanceof ProviderBookingDecisionPolicyError) policyError(error)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2034" || error.code === "P2002") {
        throw new AuthError(
          "BOOKING_CONCURRENCY_RETRY",
          "نوبت هم‌زمان در حال تغییر است. دوباره تلاش کنید.",
          409,
        )
      }
    }
    throw error
  }
}

export function approveProviderBooking(
  principal: SessionPrincipal,
  bookingId: string,
  rawInput: unknown,
  rawIdempotencyKey: string | null,
  context: RequestContext,
) {
  return decideProviderBooking(
    principal,
    bookingId,
    providerBookingDecisionActions[0],
    rawInput,
    rawIdempotencyKey,
    context,
  )
}

export function rejectProviderBooking(
  principal: SessionPrincipal,
  bookingId: string,
  rawInput: unknown,
  rawIdempotencyKey: string | null,
  context: RequestContext,
) {
  return decideProviderBooking(
    principal,
    bookingId,
    providerBookingDecisionActions[1],
    rawInput,
    rawIdempotencyKey,
    context,
  )
}
