import { describe, expect, it } from "vitest"

import {
  BookingHoldPolicyError,
  holdRequestHash,
  intervalsOverlap,
  parseBookableQuoteSnapshot,
  validateHoldStart,
} from "@/lib/booking/hold-policy"

function snapshot(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: 1,
    offering: {
      id: "11111111-1111-4111-8111-111111111111",
      version: 3,
      providerId: "22222222-2222-4222-8222-222222222222",
      branchId: "33333333-3333-4333-8333-333333333333",
      professionalId: null,
      priceModel: "FIXED",
    },
    calculation: {
      totalToman: "650000",
      durationMinute: 60,
      finalPrice: true,
      directlyBookable: true,
    },
    expiresAt: "2030-01-01T00:15:00.000Z",
    ...overrides,
  }
}

describe("booking hold policy", () => {
  it("accepts only final fixed-price directly bookable quotes", () => {
    expect(parseBookableQuoteSnapshot(snapshot()).offering.version).toBe(3)

    let rejected: unknown
    try {
      parseBookableQuoteSnapshot(
        snapshot({
          calculation: {
            totalToman: "650000",
            durationMinute: 60,
            finalPrice: false,
            directlyBookable: false,
          },
        }),
      )
    } catch (error) {
      rejected = error
    }
    expect(rejected).toBeInstanceOf(BookingHoldPolicyError)
    expect((rejected as BookingHoldPolicyError).code).toBe("QUOTE_NOT_DIRECTLY_BOOKABLE")
  })

  it("rejects past start times and creates stable request hashes", () => {
    const now = new Date("2026-07-21T12:00:00.000Z")
    expect(() => validateHoldStart(new Date("2026-07-21T11:59:00.000Z"), now)).toThrow(
      BookingHoldPolicyError,
    )

    const startsAt = new Date("2026-07-22T12:00:00.000Z")
    const first = holdRequestHash({
      quoteId: "11111111-1111-4111-8111-111111111111",
      startsAt,
    })
    const replay = holdRequestHash({
      quoteId: "11111111-1111-4111-8111-111111111111",
      startsAt,
    })
    const changed = holdRequestHash({
      quoteId: "11111111-1111-4111-8111-111111111111",
      startsAt: new Date(startsAt.getTime() + 60_000),
    })
    expect(replay).toBe(first)
    expect(changed).not.toBe(first)
  })

  it("uses half-open overlap rules", () => {
    const first = {
      startsAt: new Date("2030-01-01T09:00:00.000Z"),
      endsAt: new Date("2030-01-01T10:00:00.000Z"),
    }
    expect(
      intervalsOverlap(first, {
        startsAt: new Date("2030-01-01T10:00:00.000Z"),
        endsAt: new Date("2030-01-01T11:00:00.000Z"),
      }),
    ).toBe(false)
    expect(
      intervalsOverlap(first, {
        startsAt: new Date("2030-01-01T09:30:00.000Z"),
        endsAt: new Date("2030-01-01T10:30:00.000Z"),
      }),
    ).toBe(true)
  })
})
