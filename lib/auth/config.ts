function readPositiveInt(name: string, fallback: number): number {
  const raw = process.env[name]
  if (!raw) return fallback

  const value = Number.parseInt(raw, 10)
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`)
  }

  return value
}

function readSecret(name: string): string {
  const value = process.env[name]
  if (!value || value.length < 16) {
    throw new Error(`${name} must be configured with at least 16 characters`)
  }
  return value
}

export function authSecret(): string {
  return readSecret("AUTH_SECRET")
}

export function passwordPepper(): string {
  return readSecret("PASSWORD_PEPPER")
}

export const authConfig = {
  sessionCookieName: process.env.SESSION_COOKIE_NAME || "luxe_session",
  sessionAbsoluteTtlSeconds: readPositiveInt("SESSION_ABSOLUTE_TTL_SECONDS", 60 * 60 * 24 * 30),
  sessionIdleTtlSeconds: readPositiveInt("SESSION_IDLE_TTL_SECONDS", 60 * 60 * 24 * 7),
  otpTtlSeconds: readPositiveInt("OTP_TTL_SECONDS", 120),
  otpMaxAttempts: readPositiveInt("OTP_MAX_ATTEMPTS", 5),
  otpResendCooldownSeconds: readPositiveInt("OTP_RESEND_COOLDOWN_SECONDS", 60),
  otpMobileWindowSeconds: readPositiveInt("OTP_MOBILE_WINDOW_SECONDS", 15 * 60),
  otpMobileWindowLimit: readPositiveInt("OTP_MOBILE_WINDOW_LIMIT", 5),
  otpIpWindowSeconds: readPositiveInt("OTP_IP_WINDOW_SECONDS", 15 * 60),
  otpIpWindowLimit: readPositiveInt("OTP_IP_WINDOW_LIMIT", 20),
  loginFailureLimit: readPositiveInt("LOGIN_FAILURE_LIMIT", 5),
  loginLockSeconds: readPositiveInt("LOGIN_LOCK_SECONDS", 15 * 60),
} as const

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production" || process.env.APP_ENV === "production"
}

export function appOrigin(): string {
  return new URL(process.env.APP_URL || "http://localhost:5000").origin
}
