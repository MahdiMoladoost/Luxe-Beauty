import { randomInt, randomUUID } from "node:crypto"
import { isIranianMobile } from "@/lib/booking-engine"

type OtpRecord = {
  id: string
  mobile: string
  code: string
  expiresAt: number
  attempts: number
  lastSentAt: number
}

type OtpState = Map<string, OtpRecord>

declare global {
  // eslint-disable-next-line no-var
  var __luxeOtpState: OtpState | undefined
}

const records: OtpState = globalThis.__luxeOtpState ?? new Map<string, OtpRecord>()
if (process.env.NODE_ENV !== "production") globalThis.__luxeOtpState = records

export function requestOtp(mobile: string) {
  if (!isIranianMobile(mobile)) throw new Error("شماره موبایل معتبر نیست.")
  const now = Date.now()
  const existing = records.get(mobile)
  if (existing && now - existing.lastSentAt < 60_000) {
    throw new Error("برای ارسال مجدد کد کمی صبر کنید.")
  }

  const code = String(randomInt(10_000, 100_000))
  const record: OtpRecord = {
    id: randomUUID(),
    mobile,
    code,
    expiresAt: now + 2 * 60_000,
    attempts: 0,
    lastSentAt: now,
  }
  records.set(mobile, record)
  return {
    requestId: record.id,
    expiresInSeconds: 120,
    resendAfterSeconds: 60,
    demoCode: process.env.NODE_ENV === "production" ? undefined : code,
  }
}

export function verifyOtp(mobile: string, code: string) {
  const record = records.get(mobile)
  if (!record) throw new Error("ابتدا کد تایید دریافت کنید.")
  if (Date.now() > record.expiresAt) {
    records.delete(mobile)
    throw new Error("کد تایید منقضی شده است.")
  }
  if (record.attempts >= 5) {
    records.delete(mobile)
    throw new Error("تعداد تلاش بیش از حد مجاز است. کد جدید بگیرید.")
  }

  record.attempts += 1
  records.set(mobile, record)
  if (record.code !== code) throw new Error("کد تایید صحیح نیست.")

  records.delete(mobile)
  return {
    verified: true,
    sessionToken: randomUUID(),
    user: { mobile, role: "customer" as const },
  }
}
