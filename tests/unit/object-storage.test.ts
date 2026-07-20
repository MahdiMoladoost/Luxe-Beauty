import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { objectStorage } from "@/lib/storage/object-storage"

beforeEach(() => {
  process.env.STORAGE_PROVIDER = "minio"
  process.env.S3_ENDPOINT = "http://localhost:9000"
  process.env.S3_REGION = "us-east-1"
  process.env.S3_ACCESS_KEY_ID = "test-access-key"
  process.env.S3_SECRET_ACCESS_KEY = "test-secret-key"
  process.env.S3_PRIVATE_DOCUMENTS_BUCKET = "private-documents"
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("S3-compatible private object storage", () => {
  it("signs PUT requests without exposing the secret and uses a private path", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 200 }))
    const storage = objectStorage()
    await storage.putPrivate({
      objectKey: "providers/p1/documents/d1/license.pdf",
      bytes: new TextEncoder().encode("%PDF-1.4"),
      mimeType: "application/pdf",
    })

    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toBe("http://localhost:9000/private-documents/providers/p1/documents/d1/license.pdf")
    expect(init?.method).toBe("PUT")
    const headers = new Headers(init?.headers)
    expect(headers.get("authorization")).toContain("Credential=test-access-key/")
    expect(headers.get("authorization")).not.toContain("test-secret-key")
    expect(headers.get("x-amz-content-sha256")).toMatch(/^[a-f0-9]{64}$/)
  })

  it("reads and deletes private objects through signed requests", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response("private-data", { status: 200, headers: { "content-type": "application/pdf" } }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
    const storage = objectStorage()

    const object = await storage.getPrivate("providers/p1/documents/d1/license.pdf")
    expect(new TextDecoder().decode(object.bytes)).toBe("private-data")
    expect(object.mimeType).toBe("application/pdf")
    await storage.deletePrivate("providers/p1/documents/d1/license.pdf")

    expect(fetchMock.mock.calls.map((call) => call[1]?.method)).toEqual(["GET", "DELETE"])
  })
})
