import { describe, expect, it } from "vitest"
import {
  assertBookingTransition,
  canTransitionBooking,
  isTerminalBookingStatus,
} from "../../lib/domain/booking-state"

describe("booking state machine", () => {
  it("allows the primary successful lifecycle", () => {
    expect(canTransitionBooking("DRAFT", "HOLDING_SLOT")).toBe(true)
    expect(canTransitionBooking("HOLDING_SLOT", "AWAITING_PAYMENT")).toBe(true)
    expect(canTransitionBooking("PAYMENT_PENDING", "CONFIRMED")).toBe(true)
    expect(canTransitionBooking("CONFIRMED", "CHECKED_IN")).toBe(true)
    expect(canTransitionBooking("CHECKED_IN", "IN_SERVICE")).toBe(true)
    expect(canTransitionBooking("IN_SERVICE", "COMPLETED_BY_PROVIDER")).toBe(true)
    expect(canTransitionBooking("AWAITING_CUSTOMER_DISPUTE_WINDOW", "FINALIZED")).toBe(true)
  })

  it("rejects impossible or history-rewriting transitions", () => {
    expect(canTransitionBooking("DRAFT", "FINALIZED")).toBe(false)
    expect(canTransitionBooking("FINALIZED", "CONFIRMED")).toBe(false)
    expect(() => assertBookingTransition("REFUNDED", "CONFIRMED")).toThrow(
      "Invalid booking transition: REFUNDED -> CONFIRMED",
    )
  })

  it("recognizes terminal states from the transition table", () => {
    expect(isTerminalBookingStatus("FINALIZED")).toBe(true)
    expect(isTerminalBookingStatus("REFUNDED")).toBe(true)
    expect(isTerminalBookingStatus("CONFIRMED")).toBe(false)
  })
})
