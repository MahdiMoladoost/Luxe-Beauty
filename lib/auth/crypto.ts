import {
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  scryptSync,
  timingSafeEqual,
} from "node:crypto"

import { authSecret, passwordPepper } from "@/lib/auth/config"
import { AuthError } from "@/lib/auth/errors"

const SCRYPT_KEY_LENGTH = 64
const SCRYPT_N = 16_384
const SCRYPT_R = 8
const SCRYPT_P = 1
const SCRYPT_MAX_MEMORY = 64 * 1024 * 1024

export function generateOtp(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0")
}

export function hashOtp(challengeId: string, code: string): string {
  return createHmac("sha256", authSecret())
    .update(`otp:v1:${challengeId}:${code}`)
    .digest("hex")
}

export function verifyOtpHash(challengeId: string, code: string, expectedHex: string): boolean {
  const actual = Buffer.from(hashOtp(challengeId, code), "hex")
  const expected = Buffer.from(expectedHex, "hex")
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url")
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

export function fingerprint(value: string): string {
  return createHmac("sha256", authSecret()).update(`fingerprint:v1:${value}`).digest("hex")
}

export function assertPasswordPolicy(password: string): void {
  if (password.length < 12 || password.length > 128) {
    throw new AuthError("WEAK_PASSWORD", "رمز عبور باید بین ۱۲ تا ۱۲۸ کاراکتر باشد.", 400)
  }

  if (!/[A-Za-z\p{L}]/u.test(password) || !/\d/.test(password)) {
    throw new AuthError("WEAK_PASSWORD", "رمز عبور باید شامل حرف و عدد باشد.", 400)
  }
}

export function hashPassword(password: string): string {
  assertPasswordPolicy(password)
  const salt = randomBytes(16)
  const derived = scryptSync(`${password}\u0000${passwordPepper()}`, salt, SCRYPT_KEY_LENGTH, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    maxmem: SCRYPT_MAX_MEMORY,
  })

  return [
    "scrypt",
    "v1",
    `N=${SCRYPT_N},r=${SCRYPT_R},p=${SCRYPT_P}`,
    salt.toString("base64url"),
    derived.toString("base64url"),
  ].join("$")
}

export function verifyPassword(password: string, encoded: string): boolean {
  try {
    const [algorithm, version, params, saltEncoded, hashEncoded] = encoded.split("$")
    if (algorithm !== "scrypt" || version !== "v1" || !params || !saltEncoded || !hashEncoded) {
      return false
    }

    const parsed = Object.fromEntries(params.split(",").map((item) => item.split("=")))
    const N = Number(parsed.N)
    const r = Number(parsed.r)
    const p = Number(parsed.p)
    if (N !== SCRYPT_N || r !== SCRYPT_R || p !== SCRYPT_P) return false

    const salt = Buffer.from(saltEncoded, "base64url")
    const expected = Buffer.from(hashEncoded, "base64url")
    const actual = scryptSync(`${password}\u0000${passwordPepper()}`, salt, expected.length, {
      N,
      r,
      p,
      maxmem: SCRYPT_MAX_MEMORY,
    })

    return actual.length === expected.length && timingSafeEqual(actual, expected)
  } catch {
    return false
  }
}

export function maskMobile(mobile: string): string {
  return `${mobile.slice(0, 4)}***${mobile.slice(-4)}`
}
