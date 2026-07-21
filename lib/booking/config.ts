function integerEnvironment(name: string, fallback: number, minimum: number, maximum: number): number {
  const raw = process.env[name]
  if (!raw) return fallback
  const parsed = Number(raw)
  if (!Number.isSafeInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new Error(`${name} must be an integer between ${minimum} and ${maximum}`)
  }
  return parsed
}

export const bookingConfig = {
  holdTtlSeconds: integerEnvironment("BOOKING_HOLD_TTL_SECONDS", 420, 60, 1800),
  maxAdvanceDays: integerEnvironment("BOOKING_MAX_ADVANCE_DAYS", 31, 1, 365),
} as const
