import { beforeAll, describe, expect, it } from "vitest"

import {
  assertPasswordPolicy,
  hashOtp,
  hashPassword,
  verifyOtpHash,
  verifyPassword,
} from "@/lib/auth/crypto"

beforeAll(() => {
  process.env.AUTH_SECRET = "unit-test-auth-secret-123456789"
  process.env.PASSWORD_PEPPER = "unit-test-password-pepper-123456789"
})

describe("authentication cryptography", () => {
  it("hashes OTP values with challenge binding", () => {
    const hash = hashOtp("11111111-1111-4111-8111-111111111111", "123456")
    expect(verifyOtpHash("11111111-1111-4111-8111-111111111111", "123456", hash)).toBe(true)
    expect(verifyOtpHash("11111111-1111-4111-8111-111111111111", "654321", hash)).toBe(false)
    expect(verifyOtpHash("22222222-2222-4222-8222-222222222222", "123456", hash)).toBe(false)
  })

  it("stores password hashes with scrypt and a random salt", () => {
    const first = hashPassword("SecurePassword123")
    const second = hashPassword("SecurePassword123")

    expect(first).not.toBe(second)
    expect(first).not.toContain("SecurePassword123")
    expect(verifyPassword("SecurePassword123", first)).toBe(true)
    expect(verifyPassword("WrongPassword123", first)).toBe(false)
  })

  it("rejects weak passwords", () => {
    expect(() => assertPasswordPolicy("short1")).toThrow()
    expect(() => assertPasswordPolicy("onlyletterswithoutdigits")).toThrow()
    expect(() => assertPasswordPolicy("123456789012345")).toThrow()
  })
})
