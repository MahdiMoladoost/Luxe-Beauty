import { describe, expect, it } from "vitest"

import { validatePrivateDocument } from "@/lib/storage/file-validation"

function bytes(value: string): Uint8Array {
  return new TextEncoder().encode(value)
}

describe("private document validation", () => {
  it("accepts a PDF by MIME, size and signature and sanitizes its name", () => {
    const result = validatePrivateDocument({
      bytes: bytes("%PDF-1.4\nprovider-document"),
      mimeType: "application/pdf",
      originalFileName: "مجوز سالن 1405.pdf",
    })
    expect(result.mimeType).toBe("application/pdf")
    expect(result.safeFileName).toMatch(/\.pdf$/)
    expect(result.contentHash).toMatch(/^[a-f0-9]{64}$/)
  })

  it("rejects MIME spoofing and unsupported content", () => {
    expect(() => validatePrivateDocument({
      bytes: bytes("not-a-pdf"),
      mimeType: "application/pdf",
      originalFileName: "fake.pdf",
    })).toThrowError(/محتوای فایل/)

    expect(() => validatePrivateDocument({
      bytes: bytes("hello"),
      mimeType: "text/plain",
      originalFileName: "note.txt",
    })).toThrowError(/نوع فایل/)
  })
})
