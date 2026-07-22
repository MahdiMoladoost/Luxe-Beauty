import { createHash } from "node:crypto"

import {
  assertBookingTransition,
  type BookingStatus,
} from "@/lib/domain/booking-state"

export const providerBookingDecisionActions = ["APPROVE", "REJECT"] as const
export type ProviderBookingDecisionAction = (typeof providerBookingDecisionActions)[number]

export const providerRejectionReasonCodes = [
  "SERVICE_UNAVAILABLE",
  "PROFESSIONAL_UNAVAILABLE",
  "BRANCH_UNAVAILABLE",
  "CUSTOMER_REQUEST",
  "POLICY_CONFLICT",
  "OTHER",
] as const
export type ProviderRejectionReasonCode = (typeof providerRejectionReasonCodes)[number]

export class ProviderBookingDecisionPolicyError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message)
    this.name = "ProviderBookingDecisionPolicyError"
  }
}

export type ValidatedProviderDecision = {
  targetStatus: "CONFIRMED" | "REJECTED"
  reasonCode: string
  reason: string | null
}

export function validateProviderBookingDecision(input: {
  action: ProviderBookingDecisionAction
  status: BookingStatus
  actualVersion: number
  expectedVersion: number
  approvalDeadlineAt: Date | null
  now: Date
  reasonCode?: ProviderRejectionReasonCode
  reason?: string | null
}): ValidatedProviderDecision {
  if (input.status !== "AWAITING_PROVIDER_APPROVAL") {
    throw new ProviderBookingDecisionPolicyError(
      "BOOKING_NOT_AWAITING_PROVIDER_APPROVAL",
      "Booking is not waiting for a provider decision",
    )
  }
  if (!input.approvalDeadlineAt || input.approvalDeadlineAt <= input.now) {
    throw new ProviderBookingDecisionPolicyError(
      "APPROVAL_DEADLINE_EXPIRED",
      "Provider approval deadline has expired",
    )
  }
  if (input.actualVersion !== input.expectedVersion) {
    throw new ProviderBookingDecisionPolicyError(
      "BOOKING_VERSION_CONFLICT",
      "Booking version is stale",
    )
  }

  const targetStatus = input.action === "APPROVE" ? "CONFIRMED" : "REJECTED"
  assertBookingTransition(input.status, targetStatus)

  if (input.action === "APPROVE") {
    return {
      targetStatus,
      reasonCode: "PROVIDER_APPROVED",
      reason: null,
    }
  }

  const reasonCode = input.reasonCode
  const reason = input.reason?.trim() || null
  if (!reasonCode) {
    throw new ProviderBookingDecisionPolicyError(
      "REJECTION_REASON_REQUIRED",
      "Provider rejection reason code is required",
    )
  }
  if (!reason || reason.length < 5 || reason.length > 500) {
    throw new ProviderBookingDecisionPolicyError(
      "REJECTION_REASON_REQUIRED",
      "Provider rejection reason must contain 5 to 500 characters",
    )
  }

  return {
    targetStatus,
    reasonCode,
    reason,
  }
}

export function providerBookingDecisionRequestHash(input: {
  providerUserId: string
  bookingId: string
  action: ProviderBookingDecisionAction
  expectedVersion: number
  reasonCode?: string | null
  reason?: string | null
}): string {
  const normalizedReason = input.reason?.trim() || ""
  return createHash("sha256")
    .update(
      [
        "provider-booking-decision:v1",
        input.providerUserId,
        input.bookingId,
        input.action,
        String(input.expectedVersion),
        input.reasonCode ?? "",
        normalizedReason,
      ].join(":"),
    )
    .digest("hex")
}
