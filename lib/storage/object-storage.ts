import { createHash, createHmac } from "node:crypto"

export type StoredObject = {
  bytes: Uint8Array
  mimeType: string
}

export interface ObjectStorage {
  readonly key: string
  putPrivate(input: { objectKey: string; bytes: Uint8Array; mimeType: string }): Promise<void>
  getPrivate(objectKey: string): Promise<StoredObject>
  deletePrivate(objectKey: string): Promise<void>
}

const memoryObjects = new Map<string, StoredObject>()

class MemoryObjectStorage implements ObjectStorage {
  readonly key = "memory"

  private assertTest(): void {
    if (process.env.NODE_ENV !== "test" && process.env.APP_ENV !== "test") {
      throw new Error("Memory storage is allowed only in tests")
    }
  }

  async putPrivate(input: { objectKey: string; bytes: Uint8Array; mimeType: string }): Promise<void> {
    this.assertTest()
    memoryObjects.set(input.objectKey, { bytes: Uint8Array.from(input.bytes), mimeType: input.mimeType })
  }

  async getPrivate(objectKey: string): Promise<StoredObject> {
    this.assertTest()
    const object = memoryObjects.get(objectKey)
    if (!object) throw new Error("Object not found")
    return { bytes: Uint8Array.from(object.bytes), mimeType: object.mimeType }
  }

  async deletePrivate(objectKey: string): Promise<void> {
    this.assertTest()
    memoryObjects.delete(objectKey)
  }
}

function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required for S3-compatible storage`)
  return value
}

function sha256(value: Uint8Array | string): string {
  return createHash("sha256").update(value).digest("hex")
}

function hmac(key: Buffer | string, value: string): Buffer {
  return createHmac("sha256", key).update(value).digest()
}

function amzTimestamp(now: Date): { date: string; timestamp: string } {
  const iso = now.toISOString().replace(/[:-]|\.\d{3}/g, "")
  return { date: iso.slice(0, 8), timestamp: iso }
}

function canonicalPath(bucket: string, objectKey: string): string {
  return `/${[bucket, ...objectKey.split("/")].map((part) => encodeURIComponent(part).replace(/%2F/g, "/")).join("/")}`
}

class S3CompatibleObjectStorage implements ObjectStorage {
  readonly key: string
  private readonly endpoint = new URL(required("S3_ENDPOINT"))
  private readonly region = process.env.S3_REGION || "us-east-1"
  private readonly accessKeyId = required("S3_ACCESS_KEY_ID")
  private readonly secretAccessKey = required("S3_SECRET_ACCESS_KEY")
  private readonly bucket = required("S3_PRIVATE_DOCUMENTS_BUCKET")

  constructor(key: string) {
    this.key = key
  }

  private async request(input: {
    method: "GET" | "PUT" | "DELETE"
    objectKey: string
    bytes?: Uint8Array
    mimeType?: string
  }): Promise<Response> {
    const now = new Date()
    const { date, timestamp } = amzTimestamp(now)
    const path = canonicalPath(this.bucket, input.objectKey)
    const payloadHash = sha256(input.bytes ?? new Uint8Array())
    const host = this.endpoint.host
    const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${timestamp}\n`
    const signedHeaders = "host;x-amz-content-sha256;x-amz-date"
    const canonicalRequest = [
      input.method,
      path,
      "",
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join("\n")
    const credentialScope = `${date}/${this.region}/s3/aws4_request`
    const stringToSign = [
      "AWS4-HMAC-SHA256",
      timestamp,
      credentialScope,
      sha256(canonicalRequest),
    ].join("\n")
    const dateKey = hmac(`AWS4${this.secretAccessKey}`, date)
    const regionKey = hmac(dateKey, this.region)
    const serviceKey = hmac(regionKey, "s3")
    const signingKey = hmac(serviceKey, "aws4_request")
    const signature = createHmac("sha256", signingKey).update(stringToSign).digest("hex")
    const authorization = `AWS4-HMAC-SHA256 Credential=${this.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

    const url = new URL(this.endpoint)
    url.pathname = path
    const headers = new Headers({
      authorization,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": timestamp,
    })
    if (input.mimeType) headers.set("content-type", input.mimeType)

    return fetch(url, {
      method: input.method,
      headers,
      ...(input.bytes ? { body: Buffer.from(input.bytes) } : {}),
    })
  }

  async putPrivate(input: { objectKey: string; bytes: Uint8Array; mimeType: string }): Promise<void> {
    const response = await this.request({ method: "PUT", ...input })
    if (!response.ok) throw new Error(`Private object upload failed with status ${response.status}`)
  }

  async getPrivate(objectKey: string): Promise<StoredObject> {
    const response = await this.request({ method: "GET", objectKey })
    if (!response.ok) throw new Error(`Private object read failed with status ${response.status}`)
    return {
      bytes: new Uint8Array(await response.arrayBuffer()),
      mimeType: response.headers.get("content-type") || "application/octet-stream",
    }
  }

  async deletePrivate(objectKey: string): Promise<void> {
    const response = await this.request({ method: "DELETE", objectKey })
    if (!response.ok && response.status !== 404) {
      throw new Error(`Private object delete failed with status ${response.status}`)
    }
  }
}

export function objectStorage(): ObjectStorage {
  const provider = process.env.STORAGE_PROVIDER || "minio"
  if (provider === "memory") return new MemoryObjectStorage()
  if (provider === "minio" || provider === "s3") return new S3CompatibleObjectStorage(provider)
  throw new Error(`Unsupported storage provider: ${provider}`)
}
