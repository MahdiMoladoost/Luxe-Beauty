import { describe, expect, it } from "vitest"

import {
  providerBookingDecisionRequestHash,
  ProviderBookingDecisionPolicyError,
  validateProviderBookingDecision,
} from "@/lib/booking/provider-decision-policy"

function policyCode(operation: () => unknown): string | null {
  try {
    operation()
    return null
  } catch (error) {
    return error instanceof ProviderBookingDecisionPolicyError ? error.code : null
  }
}

describe("provider booking decision policy", () => {
  const now = new Date("2030-01-01T08:00:00.000Z")
  const deadline = new Date("2030-01-01T09:00:00.000Z")

  it("approves a current pending booking", () => {
    expect(
      validateProviderBookingDecision({
        action: "APPROVE",
        status: "AWAITING_PROVIDER_APPROVAL",
        actualVersion: 3,
        expectedVersion: 3,
        approvalDeadlineAt: deadline,
        now,
      }),
    ).toEqual({
      targetStatus: "CONFIRMED",
      reasonCode: "PROVIDER_APPROVED",
      reason: null,
    })
  })

  it("requires a controlled rejection reason", () => {
    expect(
      validateProviderBookingDecision({
        action: "REJECT",
        status: "AWAITING_PROVIDER_APPROVAL",
        actualVersion: 1,
        expectedVersion: 1,
        approvalDeadlineAt: deadline,
        now,
        reasonCode: "PROFESSIONAL_UNAVAILABLE",
        reason: "متخصص در این ساعت امکان ارائه خدمت ندارد.",
      }),
    ).toMatchObject({
      targetStatus: "REJECTED",
      reasonCode: "PROFESSIONAL_UNAVAILABLE",
    })

    expect(
      policyCode(() =>
        validateProviderBookingDecision({
          action: "REJECT",
          status: "AWAITING_PROVIDER_APPROVAL",
          actualVersion: 1,
          expectedVersion: 1,
          approvalDeadlineAt: deadline,
          now,
          reasonCode: "OTHER",
          reason: "کم",
        }),
      ),
    ).toBe("REJECTION_REASON_REQUIRED")
  })

  it("never accepts a decision after the deadline, even with a stale version", () => {
    expect(
      policyCode(() =>
        validateProviderBookingDecision({
          action: "APPROVE",
          status: "AWAITING_PROVIDER_APPROVAL",
          actualVersion: 4,
          expectedVersion: 3,
          approvalDeadlineAt: new Date("2030-01-01T07:59:59.000Z"),
          now,
        }),
      ),
    ).toBe("APPROVAL_DEADLINE_EXPIRED")
  })

  it("rejects stale and non-pending decisions", () => {
    expect(
      policyCode(() =>
        validateProviderBookingDecision({
          action: "APPROVE",
          status: "AWAITING_PROVIDER_APPROVAL",
          actualVersion: 2,
          expectedVersion: 1,
          approvalDeadlineAt: deadline,
          now,
        }),
      ),
    ).toBe("BOOKING_VERSION_CONFLICT")

    expect(
      policyCode(() =>
        validateProviderBookingDecision({
          action: "APPROVE",
          status: "CONFIRMED",
          actualVersion: 2,
          expectedVersion: 2,
          approvalDeadlineAt: deadline,
          now,
        }),
      ),
    ).toBe("BOOKING_NOT_AWAITING_PROVIDER_APPROVAL")
  })

  it("creates a stable material request hash", () => {
    const base = {
      providerUserId: "11111111-1111-4111-8111-111111111111",
      bookingId: "22222222-2222-4222-8222-222222222222",
      action: "REJECT" as const,
      expectedVersion: 1,
      reasonCode: "OTHER",
      reason: "  دلیل معتبر برای رد نوبت  ",
    }
    const first = providerBookingDecisionRequestHash(base)
    expect(
      providerBookingDecisionRequestHash({ ...base, reason: "دلیل معتبر برای رد نوبت" }),
    ).toBe(first)
    expect(providerBookingDecisionRequestHash({ ...base, expectedVersion: 2 })).not.toBe(first)
  })
})
