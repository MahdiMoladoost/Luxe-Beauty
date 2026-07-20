export type OtpPurpose = "CUSTOMER_LOGIN" | "STAFF_2FA" | "PASSWORD_RESET"
export type AuthMethod = "OTP" | "PASSWORD" | "PASSWORD_2FA"

export type RequestContext = {
  correlationId: string
  ipAddress?: string
  userAgent?: string
}

export type SessionPrincipal = {
  sessionId: string
  userId: string
  mobileNormalized: string
  userStatus: string
  identityStatus: string
  authMethod: AuthMethod
  twoFactorVerifiedAt: Date | null
  mustChangePassword: boolean
  roleKeys: string[]
  permissions: string[]
}

export type PermissionScope = {
  type: string
  id?: string | null
}
