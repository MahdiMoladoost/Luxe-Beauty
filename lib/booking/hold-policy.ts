import { createHash } from "node:crypto"
import { z } from "zod"

import { bookingConfig } from "@/lib/booking/config"

export class BookingHoldPolicyError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message)
    this.name = "BookingHoldPolicyError"
  }
}

export const quoteSnapshotSchema = z.object({
  schemaVersion: z.literal(1),
  offering: z.object({
    id: z.string().uuid(),
    version: z.number().int().positive(),
    providerId: z.string().uuid(),
    branchId: z.string().uuid().nullable(),
    professionalId: z.string().uuid().nullable(),
    priceModel: z.string(),
  }),
  calculation: z.object({
    totalToman: z.string().regex(/^\d+$/),
    durationMinute: z.number().int().min(1).max(1440),
    finalPrice: z.boolean(),
    directlyBookable: z.boolean(),
  }),
  expiresAt: z.string().datetime({ offset: true }),
}).passthrough()

export type ParsedQuoteSnapshot = z.infer<typeof quoteSnapshotSchema>

export function parseBookableQuoteSnapshot(value: unknown): ParsedQuoteSnapshot {
  const parsed = quoteSnapshotSchema.safeParse(value)
  if (!parsed.success) {
    throw new BookingHoldPolicyError("QUOTE_SNAPSHOT_INVALID", "Stored quote snapshot is invalid")
  }
  const snapshot = parsed.data
  if (!snapshot.calculation.finalPrice || !snapshot.calculation.directlyBookable) {
    throw new BookingHoldPolicyError(
      "QUOTE_NOT_DIRECTLY_BOOKABLE",
      "Only a final directly-bookable quote can create a booking hold",
    )
  }
  if (snapshot.offering.priceModel !== "FIXED") {
    throw new BookingHoldPolicyError(
      "QUOTE_NOT_DIRECTLY_BOOKABLE",
      "The initial hold flow supports fixed-price offerings only",
    )
  }
  return snapshot
}

export function validateHoldStart(startsAt: Date, now: Date): void {
  if (!Number.isFinite(startsAt.getTime())) {
    throw new BookingHoldPolicyError("INVALID_START_TIME", "Hold start time is invalid")
  }
  if (startsAt <= now) {
    throw new BookingHoldPolicyError("START_TIME_IN_PAST", "Hold start time must be in the future")
  }
  const latest = now.getTime() + bookingConfig.maxAdvanceDays * 24 * 60 * 60 * 1000
  if (startsAt.getTime() > latest) {
    throw new BookingHoldPolicyError(
      "START_TIME_TOO_FAR",
      "Hold start time exceeds the configured advance-booking window",
    )
  }
}

export function holdRequestHash(input: { quoteId: string; startsAt: Date }): string {
  return createHash("sha256")
    .update(`booking-hold:v1:${input.quoteId}:${input.startsAt.toISOString()}`)
    .digest("hex")
}

export function intervalsOverlap(
  left: { startsAt: Date; endsAt: Date },
  right: { startsAt: Date; endsAt: Date },
): boolean {
  return left.startsAt < right.endsAt && right.startsAt < left.endsAt
}
