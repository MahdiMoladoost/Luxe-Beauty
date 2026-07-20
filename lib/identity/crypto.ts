import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto"

import { AuthError } from "@/lib/auth/errors"

function secret(name: "NATIONAL_ID_HMAC_KEY" | "PII_ENCRYPTION_KEY"): string {
  const value = process.env[name]
  if (!value || value.length < 24) {
    throw new Error(`${name} must be configured with at least 24 characters`)
  }
  return value
}

function piiKey(): Buffer {
  return createHash("sha256").update(secret("PII_ENCRYPTION_KEY")).digest()
}

export function nationalIdHmac(nationalId: string): string {
  return createHmac("sha256", secret("NATIONAL_ID_HMAC_KEY"))
    .update(`national-id:v1:${nationalId}`)
    .digest("hex")
}

export function mobileIdentityHmac(mobile: string): string {
  return createHmac("sha256", secret("NATIONAL_ID_HMAC_KEY"))
    .update(`identity-mobile:v1:${mobile}`)
    .digest("hex")
}

export function nameFingerprint(firstName: string, lastName: string): string {
  return createHmac("sha256", secret("NATIONAL_ID_HMAC_KEY"))
    .update(`identity-name:v1:${firstName}\u0000${lastName}`)
    .digest("hex")
}

export function encryptNationalId(nationalId: string): string {
  const version = process.env.PII_ENCRYPTION_KEY_VERSION || "v1"
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", piiKey(), iv)
  cipher.setAAD(Buffer.from(`luxe-national-id:${version}`))
  const ciphertext = Buffer.concat([cipher.update(nationalId, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return ["aes-256-gcm", version, iv.toString("base64url"), tag.toString("base64url"), ciphertext.toString("base64url")].join("$")
}

export function decryptNationalId(encoded: string): string {
  try {
    const [algorithm, version, ivEncoded, tagEncoded, ciphertextEncoded] = encoded.split("$")
    if (algorithm !== "aes-256-gcm" || !version || !ivEncoded || !tagEncoded || !ciphertextEncoded) {
      throw new Error("Unsupported ciphertext")
    }
    const decipher = createDecipheriv("aes-256-gcm", piiKey(), Buffer.from(ivEncoded, "base64url"))
    decipher.setAAD(Buffer.from(`luxe-national-id:${version}`))
    decipher.setAuthTag(Buffer.from(tagEncoded, "base64url"))
    return Buffer.concat([
      decipher.update(Buffer.from(ciphertextEncoded, "base64url")),
      decipher.final(),
    ]).toString("utf8")
  } catch {
    throw new AuthError("IDENTITY_DECRYPTION_FAILED", "بازیابی داده هویتی انجام نشد.", 500)
  }
}

export function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer)
}

export function maskNationalId(nationalId: string): string {
  return `${nationalId.slice(0, 2)}******${nationalId.slice(-2)}`
}
