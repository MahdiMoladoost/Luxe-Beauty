import { z } from "zod"

import { AuthError } from "@/lib/auth/errors"
import type { RequestContext, SessionPrincipal } from "@/lib/auth/types"
import { bookingRecipientRepository } from "@/lib/booking/recipient-repository"
import { normalizeIranMobile, normalizePersianText } from "@/lib/localization/normalize-fa"

const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (value) => {
      const parsed = new Date(`${value}T00:00:00.000Z`)
      return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
    },
    { message: "Birth date is invalid." },
  )
  .transform((value) => new Date(`${value}T00:00:00.000Z`))

const mobileSchema = z.string().trim().min(10).max(20).transform(normalizeIranMobile)

const createRecipientSchema = z.object({
  firstName: z.string().trim().min(2).max(100),
  lastName: z.string().trim().min(2).max(100),
  birthDate: dateOnlySchema.nullable().optional(),
  genderCode: z.enum(["FEMALE", "MALE", "OTHER", "UNKNOWN"]).nullable().optional(),
  relationLabel: z.string().trim().min(2).max(60).nullable().optional(),
  contactMobile: mobileSchema.nullable().optional(),
  accessibilityNeeds: z.string().trim().max(1000).nullable().optional(),
})

const updateRecipientSchema = z
  .object({
    expectedUpdatedAt: z.string().datetime({ offset: true }),
    firstName: z.string().trim().min(2).max(100).optional(),
    lastName: z.string().trim().min(2).max(100).optional(),
    birthDate: dateOnlySchema.nullable().optional(),
    genderCode: z.enum(["FEMALE", "MALE", "OTHER", "UNKNOWN"]).nullable().optional(),
    relationLabel: z.string().trim().min(2).max(60).nullable().optional(),
    contactMobile: mobileSchema.nullable().optional(),
    accessibilityNeeds: z.string().trim().max(1000).nullable().optional(),
  })
  .refine((value) => Object.keys(value).some((key) => key !== "expectedUpdatedAt"), {
    message: "At least one recipient field must be changed.",
  })

function recipientDto(recipient: Awaited<ReturnType<typeof bookingRecipientRepository.owned>>) {
  if (!recipient) return null
  return {
    id: recipient.id,
    firstName: recipient.firstName,
    lastName: recipient.lastName,
    birthDate: recipient.birthDate?.toISOString().slice(0, 10) ?? null,
    genderCode: recipient.genderCode,
    relationLabel: recipient.relationLabel,
    contactMobile: recipient.contactMobile,
    accessibilityNeeds: recipient.accessibilityNeeds,
    createdAt: recipient.createdAt,
    updatedAt: recipient.updatedAt,
  }
}

function recipientError(kind: string): never {
  if (kind === "NOT_FOUND") {
    throw new AuthError("BOOKING_RECIPIENT_NOT_FOUND", "دریافت‌کننده خدمت یافت نشد.", 404)
  }
  if (kind === "VERSION_CONFLICT") {
    throw new AuthError(
      "VERSION_CONFLICT",
      "اطلاعات دریافت‌کننده هم‌زمان تغییر کرده است. اطلاعات جدید را دریافت و دوباره تلاش کنید.",
      409,
    )
  }
  if (kind === "IN_USE") {
    throw new AuthError(
      "BOOKING_RECIPIENT_IN_USE",
      "این دریافت‌کننده در سابقه نوبت استفاده شده و قابل حذف نیست.",
      409,
    )
  }
  throw new AuthError("BOOKING_RECIPIENT_OPERATION_FAILED", "عملیات دریافت‌کننده انجام نشد.", 400)
}

export async function listOwnedBookingRecipients(principal: SessionPrincipal) {
  const recipients = await bookingRecipientRepository.listOwned(principal.userId)
  return recipients.map((recipient) => recipientDto(recipient))
}

export async function getOwnedBookingRecipient(
  principal: SessionPrincipal,
  recipientId: string,
) {
  const recipient = await bookingRecipientRepository.owned(
    principal.userId,
    z.string().uuid().parse(recipientId),
  )
  if (!recipient) recipientError("NOT_FOUND")
  return recipientDto(recipient)
}

export async function createOwnedBookingRecipient(
  principal: SessionPrincipal,
  rawInput: unknown,
  context: RequestContext,
) {
  const input = createRecipientSchema.parse(rawInput)
  const recipient = await bookingRecipientRepository.create({
    principal,
    firstName: normalizePersianText(input.firstName),
    lastName: normalizePersianText(input.lastName),
    birthDate: input.birthDate ?? null,
    genderCode: input.genderCode ?? null,
    relationLabel: input.relationLabel ? normalizePersianText(input.relationLabel) : null,
    contactMobile: input.contactMobile ?? null,
    accessibilityNeeds: input.accessibilityNeeds
      ? normalizePersianText(input.accessibilityNeeds)
      : null,
    context,
  })
  return recipientDto(recipient)
}

export async function updateOwnedBookingRecipient(
  principal: SessionPrincipal,
  recipientId: string,
  rawInput: unknown,
  context: RequestContext,
) {
  const input = updateRecipientSchema.parse(rawInput)
  const result = await bookingRecipientRepository.update({
    principal,
    recipientId: z.string().uuid().parse(recipientId),
    expectedUpdatedAt: new Date(input.expectedUpdatedAt),
    changes: {
      firstName: input.firstName ? normalizePersianText(input.firstName) : undefined,
      lastName: input.lastName ? normalizePersianText(input.lastName) : undefined,
      birthDate: input.birthDate,
      genderCode: input.genderCode,
      relationLabel:
        input.relationLabel === undefined
          ? undefined
          : input.relationLabel
            ? normalizePersianText(input.relationLabel)
            : null,
      contactMobile: input.contactMobile,
      accessibilityNeeds:
        input.accessibilityNeeds === undefined
          ? undefined
          : input.accessibilityNeeds
            ? normalizePersianText(input.accessibilityNeeds)
            : null,
    },
    context,
  })
  if (result.kind !== "UPDATED") recipientError(result.kind)
  return recipientDto(result.recipient)
}

export async function deleteOwnedBookingRecipient(
  principal: SessionPrincipal,
  recipientId: string,
  expectedUpdatedAt: string,
  context: RequestContext,
) {
  const parsedUpdatedAt = z.string().datetime({ offset: true }).parse(expectedUpdatedAt)
  const result = await bookingRecipientRepository.softDelete({
    principal,
    recipientId: z.string().uuid().parse(recipientId),
    expectedUpdatedAt: new Date(parsedUpdatedAt),
    context,
  })
  if (result.kind !== "DELETED") recipientError(result.kind)
  return result
}
