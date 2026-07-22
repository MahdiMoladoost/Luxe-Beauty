import { z } from "zod"

import type { RequestContext, SessionPrincipal } from "@/lib/auth/types"
import { bookingRecipientRepository } from "@/lib/booking/recipient-repository"
import { normalizeIranMobile, normalizePersianText } from "@/lib/localization/normalize-fa"

const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .transform((value) => new Date(`${value}T00:00:00.000Z`))
  .refine((value) => Number.isFinite(value.getTime()), { message: "Birth date is invalid." })

const createRecipientSchema = z.object({
  firstName: z.string().trim().min(2).max(100),
  lastName: z.string().trim().min(2).max(100),
  birthDate: dateOnlySchema.nullable().optional(),
  genderCode: z.enum(["FEMALE", "MALE", "OTHER", "UNKNOWN"]).nullable().optional(),
  relationLabel: z.string().trim().min(2).max(60).nullable().optional(),
  contactMobile: z
    .string()
    .trim()
    .min(10)
    .max(20)
    .transform(normalizeIranMobile)
    .nullable()
    .optional(),
  accessibilityNeeds: z.string().trim().max(1000).nullable().optional(),
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

export async function listOwnedBookingRecipients(principal: SessionPrincipal) {
  const recipients = await bookingRecipientRepository.listOwned(principal.userId)
  return recipients.map((recipient) => recipientDto(recipient))
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
