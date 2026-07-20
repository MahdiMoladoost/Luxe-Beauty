import { createHash } from "node:crypto"

import { AuthError } from "@/lib/auth/errors"

const MAX_PRIVATE_DOCUMENT_BYTES = 10 * 1024 * 1024
const ALLOWED_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"])

function hasPrefix(bytes: Uint8Array, prefix: number[]): boolean {
  return prefix.every((value, index) => bytes[index] === value)
}

function signatureMatches(mimeType: string, bytes: Uint8Array): boolean {
  if (mimeType === "application/pdf") return hasPrefix(bytes, [0x25, 0x50, 0x44, 0x46])
  if (mimeType === "image/jpeg") return hasPrefix(bytes, [0xff, 0xd8, 0xff])
  if (mimeType === "image/png") return hasPrefix(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  return false
}

export type ValidatedPrivateFile = {
  bytes: Uint8Array
  mimeType: string
  sizeBytes: number
  contentHash: string
  safeFileName: string
}

export function validatePrivateDocument(input: {
  bytes: Uint8Array
  mimeType: string
  originalFileName: string
}): ValidatedPrivateFile {
  if (!ALLOWED_TYPES.has(input.mimeType)) {
    throw new AuthError("UPLOAD_TYPE_NOT_ALLOWED", "نوع فایل مجاز نیست.", 400)
  }
  if (input.bytes.byteLength === 0 || input.bytes.byteLength > MAX_PRIVATE_DOCUMENT_BYTES) {
    throw new AuthError("UPLOAD_SIZE_INVALID", "حجم فایل باید کمتر از ۱۰ مگابایت باشد.", 400)
  }
  if (!signatureMatches(input.mimeType, input.bytes)) {
    throw new AuthError("UPLOAD_SIGNATURE_INVALID", "محتوای فایل با نوع اعلام‌شده مطابقت ندارد.", 400)
  }

  const safeFileName = input.originalFileName
    .normalize("NFKC")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(-120) || "document"

  return {
    bytes: input.bytes,
    mimeType: input.mimeType,
    sizeBytes: input.bytes.byteLength,
    contentHash: createHash("sha256").update(input.bytes).digest("hex"),
    safeFileName,
  }
}
