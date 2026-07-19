import { describe, expect, it } from "vitest"
import {
  addToman,
  multiplyToman,
  percentageOfToman,
  serializeToman,
  subtractToman,
  toman,
} from "../../lib/domain/money"

describe("Toman value helpers", () => {
  it("accepts only non-negative integer amounts", () => {
    expect(serializeToman(toman("1250000"))).toBe("1250000")
    expect(() => toman(-1)).toThrow(RangeError)
    expect(() => toman(1.5)).toThrow(TypeError)
    expect(() => toman("12.5")).toThrow(TypeError)
  })

  it("adds, subtracts and multiplies without floating point arithmetic", () => {
    expect(serializeToman(addToman(toman(100), toman(250), toman(50)))).toBe("400")
    expect(serializeToman(subtractToman(toman(400), toman(175)))).toBe("225")
    expect(serializeToman(multiplyToman(toman(125), 4))).toBe("500")
    expect(() => subtractToman(toman(100), toman(101))).toThrow(RangeError)
  })

  it("calculates basis-point percentages with half-up integer rounding", () => {
    expect(serializeToman(percentageOfToman(toman(1_000_000), 1_500))).toBe("150000")
    expect(serializeToman(percentageOfToman(toman(3), 5_000))).toBe("2")
  })
})
