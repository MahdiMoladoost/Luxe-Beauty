import { createHash } from "node:crypto"
import { readFileSync, writeFileSync } from "node:fs"

const media = [
  {
    name: "hero",
    slug: "hero",
    parts: [
      "public/generated/hero-01.b64",
      "public/generated/hero-02.b64",
      "public/generated/hero-03.b64",
    ],
    bytes: 9840,
    sha256: "57aa165a321f7f061a36d8992e096e54571a9bfbfe40e5bf7fe0887d17697511",
  },
  {
    name: "beauty sprite",
    slug: "sprite",
    parts: [
      "public/generated/sprite-01.b64",
      "public/generated/sprite-02.b64",
      "public/generated/sprite-03.b64",
      "public/generated/sprite-04.b64",
      "public/generated/sprite-05.b64",
      "public/generated/sprite-06.b64",
    ],
    bytes: 20440,
    sha256: "2fbe89d1fbf1142f46114e0355116251337d866e53f82b98749914db2b989a13",
  },
]

for (const item of media) {
  const chunks = item.parts.map((path) => readFileSync(path, "utf8").trim())
  const base64 = chunks.join("")
  const buffer = Buffer.from(base64, "base64")
  const signature = `${buffer.subarray(0, 4).toString("ascii")}:${buffer.subarray(8, 12).toString("ascii")}`
  const digest = createHash("sha256").update(buffer).digest("hex")

  console.log(`${item.name} parts: ${chunks.map((chunk) => chunk.length).join(", ")}`)
  console.log(`${item.name} base64 length: ${base64.length}`)

  if (signature !== "RIFF:WEBP" || buffer.length !== item.bytes || digest !== item.sha256) {
    writeFileSync(`media-debug-${item.slug}.b64`, base64)
    writeFileSync(`media-debug-${item.slug}.webp`, buffer)
  }

  if (signature !== "RIFF:WEBP") {
    throw new Error(`${item.name} is not a valid WebP payload`)
  }
  if (buffer.length !== item.bytes) {
    throw new Error(`${item.name} byte length mismatch: expected ${item.bytes}, received ${buffer.length}`)
  }
  if (digest !== item.sha256) {
    throw new Error(`${item.name} checksum mismatch`)
  }

  console.log(`validated ${item.name}: ${buffer.length} bytes`)
}
