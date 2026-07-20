import { beforeAll, describe, expect, it } from "vitest"

import {
  decryptNationalId,
  encryptNationalId,
  maskNationalId,
  nationalIdHmac,
} from "@/lib/identity/crypto"

beforeAll(() => {
  process.env.NATIONAL_ID_HMAC_KEY = "unit-national-id-hmac-key-123456789"
  process.env.PII_ENCRYPTION_KEY = "unit-pii-encryption-key-123456789"
  process.env.PII_ENCRYPTION_KEY_VERSION = "test-v1"
})

describe("sensitive identity cryptography", () => {
  it("encrypts national IDs with random IV and decrypts them", () => {
    const first = encryptNationalId("1234567893")
    const second = encryptNationalId("1234567893")

    expect(first).not.toBe(second)
    expect(first).not.toContain("1234567893")
    expect(decryptNationalId(first)).toBe("1234567893")
    expect(decryptNationalId(second)).toBe("1234567893")
  })

  it("creates deterministic keyed uniqueness fingerprints", () => {
    const first = nationalIdHmac("1234567893")
    expect(first).toBe(nationalIdHmac("1234567893"))
    expect(first).not.toBe(nationalIdHmac("1234567894"))
    expect(first).not.toContain("1234567893")
  })

  it("masks identity values for non-sensitive presentation", () => {
    expect(maskNationalId("1234567893")).toBe("12******93")
  })
})
