import { isProduction } from "@/lib/auth/config"
import type { OtpPurpose } from "@/lib/auth/types"

export type SmsOtpMessage = {
  mobileNormalized: string
  code: string
  purpose: OtpPurpose
  expiresInSeconds: number
  correlationId: string
}

export interface SmsProvider {
  readonly key: string
  sendOtp(message: SmsOtpMessage): Promise<{ providerMessageId: string }>
}

class MockSmsProvider implements SmsProvider {
  readonly key = "mock"

  async sendOtp(message: SmsOtpMessage): Promise<{ providerMessageId: string }> {
    if (isProduction()) {
      throw new Error("Mock SMS provider is disabled in production")
    }

    console.info(JSON.stringify({
      event: "mock.sms.otp.sent",
      purpose: message.purpose,
      mobileMasked: `${message.mobileNormalized.slice(0, 4)}***${message.mobileNormalized.slice(-4)}`,
      correlationId: message.correlationId,
    }))

    return { providerMessageId: `mock-${message.correlationId}` }
  }
}

export function smsProvider(): SmsProvider {
  const provider = process.env.SMS_PROVIDER || "mock"
  if (provider === "mock") return new MockSmsProvider()

  throw new Error(`Unsupported SMS provider: ${provider}`)
}

export function mayExposeDevelopmentOtp(): boolean {
  return !isProduction() && (process.env.SMS_PROVIDER || "mock") === "mock"
}
