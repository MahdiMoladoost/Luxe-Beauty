import { createHash } from "node:crypto"
import { z } from "zod"

import { bookingConfig } from "@/lib/booking/config"

export class BookingConversionPolicyError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message)
    this.name = "BookingConversionPolicyError"
  }
}

const jsonObjectSchema = z.record(z.string().min(1).max(120), z.any())
const tomanSchema = z.string().regex(/^\d+$/)

const conversionQuoteSnapshotSchema = z.object({
  schemaVersion: z.literal(1),
  offering: z.object({
    id: z.string().uuid(),
    version: z.number().int().positive(),
    titleFa: z.string().min(1).max(180),
    standardServiceId: z.string().uuid(),
    providerId: z.string().uuid(),
    branchId: z.string().uuid().nullable(),
    professionalId: z.string().uuid().nullable(),
    priceModel: z.literal("FIXED"),
  }),
  durationFormula: z.object({
    baseMinutePerQuantity: z.number().int().min(1).max(720),
    preparationMinute: z.number().int().min(0).max(180),
    cleanupMinute: z.number().int().min(0).max(180),
    bufferBeforeMinute: z.number().int().min(0).max(180),
    bufferAfterMinute: z.number().int().min(0).max(180),
  }),
  audienceRules: jsonObjectSchema.default({}),
  bookingPolicy: jsonObjectSchema.default({}),
  pricingRules: z.any().nullable().optional(),
  calculation: z.object({
    priceKind: z.literal("FINAL"),
    unitPriceToman: tomanSchema,
    totalToman: tomanSchema,
    priceMinToman: tomanSchema.nullable(),
    priceMaxToman: tomanSchema.nullable(),
    durationMinute: z.number().int().min(1).max(1440),
    quantity: z.number().int().min(1).max(20),
    finalPrice: z.literal(true),
    directlyBookable: z.literal(true),
    currency: z.literal("TOMAN"),
  }),
  expiresAt: z.string().datetime({ offset: true }),
})

export const bookingHoldConversionSnapshotSchema = z.object({
  schemaVersion: z.literal(1),
  quoteId: z.string().uuid(),
  quoteExpiresAt: z.string().datetime({ offset: true }),
  quoteSnapshot: conversionQuoteSnapshotSchema,
  offeringVersion: z.number().int().positive(),
  resourceType: z.enum(["PROFESSIONAL", "BRANCH"]),
  resourceId: z.string().uuid(),
  occupiedFrom: z.string().datetime({ offset: true }),
  occupiedUntil: z.string().datetime({ offset: true }),
  holdTtlSeconds: z.number().int().positive(),
})

const legalAcceptanceSchema = z.object({
  termsVersion: z.string().trim().min(2).max(100),
  privacyVersion: z.string().trim().min(2).max(100),
  bookingVersion: z.string().trim().min(2).max(100),
})

const paymentModeSchema = z.enum(["NONE", "ON_SITE", "ONLINE", "DEPOSIT", "PREPAID"])
const bookingPolicySchema = z
  .object({
    approval: z.enum(["INSTANT", "MANUAL"]).default("MANUAL"),
    approvalDeadlineMinute: z.number().int().min(15).max(120).optional(),
    payment: paymentModeSchema.optional(),
    requiresOnlinePayment: z.boolean().optional(),
    depositToman: z
      .union([
        z.string().regex(/^\d+$/),
        z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
      ])
      .optional(),
    depositPercent: z.number().int().min(0).max(100).optional(),
    questionnaire: z
      .object({ requiredKeys: z.array(z.string().min(1).max(100)).max(50).default([]) })
      .optional(),
  })
  .catchall(z.any())

const audienceRulesSchema = z
  .object({
    audience: z.enum(["ALL", "WOMEN", "MEN", "CHILDREN"]).default("ALL"),
    minAge: z.number().int().min(0).max(120).optional(),
    maxAge: z.number().int().min(0).max(120).optional(),
    requiredQuestionnaireKeys: z.array(z.string().min(1).max(100)).max(50).optional(),
    guardianWorkflowRequired: z.boolean().optional(),
  })
  .catchall(z.any())

export type BookingConversionSnapshot = z.infer<typeof bookingHoldConversionSnapshotSchema>
export type BookingDecision = {
  finalStatus: "CONFIRMED" | "AWAITING_PROVIDER_APPROVAL"
  approvalDeadlineAt: Date | null
  bookingPolicy: z.infer<typeof bookingPolicySchema>
}

export function parseBookingConversionSnapshot(value: unknown): BookingConversionSnapshot {
  const result = bookingHoldConversionSnapshotSchema.safeParse(value)
  if (!result.success) {
    throw new BookingConversionPolicyError(
      "HOLD_SNAPSHOT_INVALID",
      "Stored hold snapshot is missing required immutable booking data",
    )
  }
  return result.data
}

export function validateLegalAcceptance(value: unknown) {
  const input = legalAcceptanceSchema.parse(value)
  if (
    input.termsVersion !== bookingConfig.legalVersions.terms ||
    input.privacyVersion !== bookingConfig.legalVersions.privacy ||
    input.bookingVersion !== bookingConfig.legalVersions.booking
  ) {
    throw new BookingConversionPolicyError(
      "LEGAL_VERSION_STALE",
      "The accepted legal versions are not current",
    )
  }
  return input
}

function positiveMoney(value: string | number | undefined): boolean {
  if (value === undefined) return false
  return BigInt(value) > 0n
}

function ageOnDate(birthDate: Date, onDate: Date): number {
  let age = onDate.getUTCFullYear() - birthDate.getUTCFullYear()
  const beforeBirthday =
    onDate.getUTCMonth() < birthDate.getUTCMonth() ||
    (onDate.getUTCMonth() === birthDate.getUTCMonth() &&
      onDate.getUTCDate() < birthDate.getUTCDate())
  if (beforeBirthday) age -= 1
  return age
}

export function validateRecipientAndQuestionnaire(input: {
  recipient: {
    birthDate: Date | null
    genderCode: string | null
    relationLabel: string | null
  }
  audienceRulesValue: unknown
  bookingPolicyValue: unknown
  questionnaireAnswers: Record<string, unknown> | null
  appointmentStartsAt: Date
}) {
  const audienceRules = audienceRulesSchema.parse(input.audienceRulesValue)
  const bookingPolicy = bookingPolicySchema.parse(input.bookingPolicyValue)

  if (audienceRules.guardianWorkflowRequired) {
    throw new BookingConversionPolicyError(
      "GUARDIAN_WORKFLOW_REQUIRED",
      "This service requires the dedicated guardian workflow",
    )
  }

  const age = input.recipient.birthDate
    ? ageOnDate(input.recipient.birthDate, input.appointmentStartsAt)
    : null
  if (audienceRules.minAge !== undefined && (age === null || age < audienceRules.minAge)) {
    throw new BookingConversionPolicyError("RECIPIENT_NOT_ELIGIBLE", "Recipient is below the allowed age")
  }
  if (audienceRules.maxAge !== undefined && (age === null || age > audienceRules.maxAge)) {
    throw new BookingConversionPolicyError("RECIPIENT_NOT_ELIGIBLE", "Recipient is above the allowed age")
  }
  if (audienceRules.audience === "WOMEN" && input.recipient.genderCode !== "FEMALE") {
    throw new BookingConversionPolicyError("RECIPIENT_NOT_ELIGIBLE", "Service is limited to women")
  }
  if (audienceRules.audience === "MEN" && input.recipient.genderCode !== "MALE") {
    throw new BookingConversionPolicyError("RECIPIENT_NOT_ELIGIBLE", "Service is limited to men")
  }
  if (audienceRules.audience === "CHILDREN" && (age === null || age >= 18)) {
    throw new BookingConversionPolicyError("RECIPIENT_NOT_ELIGIBLE", "Service is limited to children")
  }

  const requiredKeys = new Set([
    ...(audienceRules.requiredQuestionnaireKeys ?? []),
    ...(bookingPolicy.questionnaire?.requiredKeys ?? []),
  ])
  for (const key of requiredKeys) {
    const answer = input.questionnaireAnswers?.[key]
    if (answer === undefined || answer === null || answer === "") {
      throw new BookingConversionPolicyError(
        "QUESTIONNAIRE_INCOMPLETE",
        `Required questionnaire answer is missing: ${key}`,
      )
    }
  }

  return { audienceRules, bookingPolicy, recipientAgeAtAppointment: age }
}

export function bookingDecision(input: {
  bookingPolicyValue: unknown
  startsAt: Date
  now: Date
}): BookingDecision {
  const bookingPolicy = bookingPolicySchema.parse(input.bookingPolicyValue)
  const requiresPayment =
    bookingPolicy.requiresOnlinePayment === true ||
    bookingPolicy.payment === "ONLINE" ||
    bookingPolicy.payment === "DEPOSIT" ||
    bookingPolicy.payment === "PREPAID" ||
    positiveMoney(bookingPolicy.depositToman) ||
    (bookingPolicy.depositPercent ?? 0) > 0
  if (requiresPayment) {
    throw new BookingConversionPolicyError(
      "PAYMENT_FLOW_REQUIRED",
      "This booking policy requires the payment flow before confirmation",
    )
  }

  if (bookingPolicy.approval === "INSTANT") {
    return {
      finalStatus: "CONFIRMED",
      approvalDeadlineAt: null,
      bookingPolicy,
    }
  }

  const configuredMinutes =
    bookingPolicy.approvalDeadlineMinute ?? bookingConfig.manualApprovalDeadlineMinutes
  const latestDeadline = new Date(
    input.startsAt.getTime() - bookingConfig.manualApprovalMinimumLeadMinutes * 60_000,
  )
  const configuredDeadline = new Date(input.now.getTime() + configuredMinutes * 60_000)
  const approvalDeadlineAt =
    configuredDeadline < latestDeadline ? configuredDeadline : latestDeadline
  if (approvalDeadlineAt <= input.now) {
    throw new BookingConversionPolicyError(
      "APPOINTMENT_TOO_SOON_FOR_MANUAL_APPROVAL",
      "There is not enough time for provider approval",
    )
  }

  return {
    finalStatus: "AWAITING_PROVIDER_APPROVAL",
    approvalDeadlineAt,
    bookingPolicy,
  }
}

function canonicalJson(value: unknown): string {
  if (value === undefined) return "null"
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null"
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, item]) => item !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))
  return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`).join(",")}}`
}

export function bookingConversionRequestHash(input: {
  customerUserId: string
  holdId: string
  recipientId: string
  legalAcceptance: unknown
  questionnaireAnswers: Record<string, unknown> | null
}): string {
  return createHash("sha256")
    .update(
      canonicalJson({
        schemaVersion: 1,
        customerUserId: input.customerUserId,
        holdId: input.holdId,
        recipientId: input.recipientId,
        legalAcceptance: input.legalAcceptance,
        questionnaireAnswers: input.questionnaireAnswers,
      }),
    )
    .digest("hex")
}
