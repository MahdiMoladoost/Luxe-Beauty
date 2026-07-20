export class AuthError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message)
    this.name = "AuthError"
  }
}

export function invalidCredentials(): AuthError {
  return new AuthError("INVALID_CREDENTIALS", "اطلاعات ورود معتبر نیست.", 401)
}

export function invalidOtp(): AuthError {
  return new AuthError("INVALID_OTP", "کد تأیید معتبر نیست یا منقضی شده است.", 400)
}
