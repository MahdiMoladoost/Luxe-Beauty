function integerEnvironment(name: string, fallback: number, minimum: number, maximum: number): number {
  const raw = process.env[name]
  if (!raw) return fallback
  const parsed = Number(raw)
  if (!Number.isSafeInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new Error(`${name} must be an integer between ${minimum} and ${maximum}`)
  }
  return parsed
}

function versionEnvironment(name: string, fallback: string): string {
  const value = process.env[name]?.trim() || fallback
  if (!/^[A-Za-z0-9._:-]{2,100}$/.test(value)) {
    throw new Error(`${name} must be a 2-100 character version identifier`)
  }
  return value
}

export const bookingConfig = {
  holdTtlSeconds: integerEnvironment("BOOKING_HOLD_TTL_SECONDS", 420, 60, 1800),
  maxAdvanceDays: integerEnvironment("BOOKING_MAX_ADVANCE_DAYS", 31, 1, 365),
  manualApprovalDeadlineMinutes: integerEnvironment(
    "BOOKING_MANUAL_APPROVAL_DEADLINE_MINUTES",
    60,
    15,
    120,
  ),
  manualApprovalMinimumLeadMinutes: integerEnvironment(
    "BOOKING_MANUAL_APPROVAL_MINIMUM_LEAD_MINUTES",
    10,
    5,
    120,
  ),
  legalVersions: {
    terms: versionEnvironment("LEGAL_TERMS_VERSION", "dev-terms-v1"),
    privacy: versionEnvironment("LEGAL_PRIVACY_VERSION", "dev-privacy-v1"),
    booking: versionEnvironment("LEGAL_BOOKING_VERSION", "dev-booking-v1"),
  },
} as const
