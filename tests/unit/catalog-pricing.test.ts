import { describe, expect, it } from "vitest"

import {
  calculateOfferingQuote,
  OfferingPricingError,
  pricingSnapshot,
  validateOfferingPricing,
} from "@/lib/catalog/pricing"

const duration = {
  baseDurationMinute: 60,
  preparationMinute: 10,
  cleanupMinute: 5,
  bufferBeforeMinute: 5,
  bufferAfterMinute: 10,
}

describe("catalog pricing policy", () => {
  it("creates a final integer-toman quote for fixed pricing", () => {
    const quote = calculateOfferingQuote(
      {
        ...duration,
        priceModel: "FIXED",
        priceMinToman: 500_000n,
        priceMaxToman: null,
      },
      2,
    )

    expect(quote.priceKind).toBe("FINAL")
    expect(quote.totalToman).toBe(1_000_000n)
    expect(quote.durationMinute).toBe(150)
    expect(quote.directlyBookable).toBe(true)
    expect(pricingSnapshot(quote)).toMatchObject({
      unitPriceToman: "500000",
      totalToman: "1000000",
      finalPrice: true,
      currency: "TOMAN",
    })
  })

  it("labels range and starting-from prices as estimates", () => {
    const range = calculateOfferingQuote(
      {
        ...duration,
        priceModel: "RANGE",
        priceMinToman: 400_000n,
        priceMaxToman: 700_000n,
      },
      1,
    )
    expect(range.priceKind).toBe("ESTIMATE")
    expect(range.finalPrice).toBe(false)
    expect(range.directlyBookable).toBe(false)
    expect(range.priceMaxToman).toBe(700_000n)
  })

  it("does not invent a price for consultation-based services", () => {
    const consultation = calculateOfferingQuote(
      {
        ...duration,
        priceModel: "AFTER_CONSULTATION",
        priceMinToman: null,
        priceMaxToman: null,
      },
      1,
    )
    expect(consultation.priceKind).toBe("CONSULTATION_REQUIRED")
    expect(consultation.totalToman).toBe(0n)
    expect(consultation.directlyBookable).toBe(false)
  })

  it("rejects invalid ranges and unsupported pricing models", () => {
    expect(() =>
      validateOfferingPricing({
        ...duration,
        priceModel: "RANGE",
        priceMinToman: 800_000n,
        priceMaxToman: 700_000n,
      }),
    ).toThrow(OfferingPricingError)

    let unsupported: unknown
    try {
      validateOfferingPricing({
        ...duration,
        priceModel: "PACKAGE",
        priceMinToman: 500_000n,
        priceMaxToman: null,
      })
    } catch (error) {
      unsupported = error
    }
    expect(unsupported).toBeInstanceOf(OfferingPricingError)
    expect((unsupported as OfferingPricingError).code).toBe("PRICE_MODEL_NOT_IMPLEMENTED")
  })

  it("rejects a quote whose occupied duration exceeds one day", () => {
    expect(() =>
      calculateOfferingQuote(
        {
          baseDurationMinute: 720,
          preparationMinute: 0,
          cleanupMinute: 0,
          bufferBeforeMinute: 0,
          bufferAfterMinute: 1,
          priceModel: "FIXED",
          priceMinToman: 100_000n,
          priceMaxToman: null,
        },
        2,
      ),
    ).toThrowError("One quote cannot reserve more than 1440 minutes")
  })
})
