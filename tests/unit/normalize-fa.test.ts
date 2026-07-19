import { describe, expect, it } from "vitest"
import {
  normalizeIranMobile,
  normalizeIranNationalId,
  normalizePersianText,
  normalizeSearchText,
  toLatinDigits,
} from "../../lib/localization/normalize-fa"

describe("Persian input normalization", () => {
  it("normalizes Persian and Arabic digits", () => {
    expect(toLatinDigits("۱۲۳٤٥۶")).toBe("123456")
  })

  it("normalizes Arabic letter variants, invisible separators and whitespace", () => {
    expect(normalizePersianText("  كاشت‌ ناخن  يک  ")).toBe("کاشت ناخن یک")
    expect(normalizeSearchText("میکاپ، در غرب تهران!")).toBe("میکاپ در غرب تهران")
  })

  it("normalizes valid Iranian mobile formats", () => {
    expect(normalizeIranMobile("+98 912 345 6789")).toBe("09123456789")
    expect(normalizeIranMobile("۰۹۱۲۳۴۵۶۷۸۹")).toBe("09123456789")
    expect(() => normalizeIranMobile("02112345678")).toThrow(TypeError)
  })

  it("normalizes national ID format without logging or exposing it", () => {
    expect(normalizeIranNationalId("۱۲۳-۴۵۶-۷۸۹۰")).toBe("1234567890")
    expect(() => normalizeIranNationalId("123")).toThrow(TypeError)
  })
})
