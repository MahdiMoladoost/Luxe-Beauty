import { describe, expect, it } from "vitest"

import { bookingConfig } from "@/lib/booking/config"
import {
  bookingConversionRequestHash,
  bookingDecision,
  BookingConversionPolicyError,
  validateLegalAcceptance,
  validateRecipientAndQuestionnaire,
} from "@/lib/booking/conversion-policy"

describe("hold to booking conversion policy", () => {
  it("accepts only the current immutable legal versions", () => {
    expect(
      validateLegalAcceptance({
        termsVersion: bookingConfig.legalVersions.terms,
        privacyVersion: bookingConfig.legalVersions.privacy,
        bookingVersion: bookingConfig.legalVersions.booking,
      }),
    ).toMatchObject({ termsVersion: bookingConfig.legalVersions.terms })

    expect(() =>
      validateLegalAcceptance({
        termsVersion: "stale-terms",
        privacyVersion: bookingConfig.legalVersions.privacy,
        bookingVersion: bookingConfig.legalVersions.booking,
      }),
    ).toThrowError(expect.objectContaining({ code: "LEGAL_VERSION_STALE" }))
  })

  it("validates audience, age and required questionnaire answers", () => {
    const result = validateRecipientAndQuestionnaire({
      recipient: {
        birthDate: new Date("1995-02-10T00:00:00.000Z"),
        genderCode: "FEMALE",
        relationLabel: "خودم",
      },
      audienceRulesValue: {
        audience: "WOMEN",
        minAge: 18,
        requiredQuestionnaireKeys: ["hairLength"],
      },
      bookingPolicyValue: { approval: "INSTANT" },
      questionnaireAnswers: { hairLength: "LONG" },
      appointmentStartsAt: new Date("2030-02-11T10:00:00.000Z"),
    })
    expect(result.recipientAgeAtAppointment).toBe(35)

    expect(() =>
      validateRecipientAndQuestionnaire({
        recipient: { birthDate: null, genderCode: "MALE", relationLabel: null },
        audienceRulesValue: { audience: "WOMEN", requiredQuestionnaireKeys: ["hairLength"] },
        bookingPolicyValue: { approval: "INSTANT" },
        questionnaireAnswers: null,
        appointmentStartsAt: new Date("2030-02-11T10:00:00.000Z"),
      }),
    ).toThrowError(expect.objectContaining({ code: "RECIPIENT_NOT_ELIGIBLE" }))
  })

  it("selects instant or manual approval and refuses payment-required policies", () => {
    const now = new Date("2030-01-01T08:00:00.000Z")
    const startsAt = new Date("2030-01-01T12:00:00.000Z")
    expect(bookingDecision({ bookingPolicyValue: { approval: "INSTANT" }, startsAt, now })).toMatchObject({
      finalStatus: "CONFIRMED",
      approvalDeadlineAt: null,
    })

    const manual = bookingDecision({
      bookingPolicyValue: { approval: "MANUAL", approvalDeadlineMinute: 30 },
      startsAt,
      now,
    })
    expect(manual.finalStatus).toBe("AWAITING_PROVIDER_APPROVAL")
    expect(manual.approvalDeadlineAt?.toISOString()).toBe("2030-01-01T08:30:00.000Z")

    expect(() =>
      bookingDecision({
        bookingPolicyValue: { approval: "INSTANT", payment: "DEPOSIT", depositToman: "100000" },
        startsAt,
        now,
      }),
    ).toThrowError(expect.objectContaining({ code: "PAYMENT_FLOW_REQUIRED" }))
  })

  it("creates a stable request hash and changes it for material input changes", () => {
    const base = {
      customerUserId: "11111111-1111-4111-8111-111111111111",
      holdId: "22222222-2222-4222-8222-222222222222",
      recipientId: "33333333-3333-4333-8333-333333333333",
      legalAcceptance: {
        termsVersion: "terms-v1",
        privacyVersion: "privacy-v1",
        bookingVersion: "booking-v1",
      },
      questionnaireAnswers: { second: 2, first: 1 },
    }
    const first = bookingConversionRequestHash(base)
    const reordered = bookingConversionRequestHash({
      ...base,
      questionnaireAnswers: { first: 1, second: 2 },
    })
    const changed = bookingConversionRequestHash({
      ...base,
      recipientId: "44444444-4444-4444-8444-444444444444",
    })
    expect(reordered).toBe(first)
    expect(changed).not.toBe(first)
  })
})

void BookingConversionPolicyError
