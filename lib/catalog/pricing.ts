import { multiplyToman, serializeToman, toman, type Toman } from "@/lib/domain/money"

export const supportedPriceModels = [
  "FIXED",
  "STARTING_FROM",
  "RANGE",
  "AFTER_CONSULTATION",
] as const

export type SupportedPriceModel = (typeof supportedPriceModels)[number]

export class OfferingPricingError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message)
    this.name = "OfferingPricingError"
  }
}

type PricingDefinition = {
  priceModel: string
  priceMinToman: bigint | null
  priceMaxToman: bigint | null
  baseDurationMinute: number
  preparationMinute: number
  cleanupMinute: number
  bufferBeforeMinute: number
  bufferAfterMinute: number
}

export type OfferingQuoteCalculation = {
  priceKind: "FINAL" | "ESTIMATE" | "CONSULTATION_REQUIRED"
  unitPriceToman: Toman
  totalToman: Toman
  priceMinToman: Toman | null
  priceMaxToman: Toman | null
  durationMinute: number
  quantity: number
  finalPrice: boolean
  directlyBookable: boolean
}

function positiveAmount(value: bigint | null, label: string): Toman {
  if (value === null || value <= 0n) {
    throw new OfferingPricingError("INVALID_PRICE", `${label} must be a positive integer toman amount`)
  }
  return toman(value)
}

function assertMinutes(value: number, label: string, maximum: number): void {
  if (!Number.isSafeInteger(value) || value < 0 || value > maximum) {
    throw new OfferingPricingError("INVALID_DURATION", `${label} is outside the supported range`)
  }
}

export function validateOfferingPricing(definition: PricingDefinition): void {
  if (!supportedPriceModels.includes(definition.priceModel as SupportedPriceModel)) {
    throw new OfferingPricingError(
      "PRICE_MODEL_NOT_IMPLEMENTED",
      "This pricing model requires a later dedicated pricing engine",
    )
  }

  assertMinutes(definition.baseDurationMinute, "baseDurationMinute", 720)
  if (definition.baseDurationMinute < 5) {
    throw new OfferingPricingError("INVALID_DURATION", "baseDurationMinute must be at least 5 minutes")
  }
  assertMinutes(definition.preparationMinute, "preparationMinute", 180)
  assertMinutes(definition.cleanupMinute, "cleanupMinute", 180)
  assertMinutes(definition.bufferBeforeMinute, "bufferBeforeMinute", 180)
  assertMinutes(definition.bufferAfterMinute, "bufferAfterMinute", 180)

  if (definition.priceModel === "AFTER_CONSULTATION") {
    if (definition.priceMinToman !== null || definition.priceMaxToman !== null) {
      throw new OfferingPricingError(
        "INVALID_PRICE",
        "Consultation-based offerings must not advertise a final price",
      )
    }
    return
  }

  const minimum = positiveAmount(definition.priceMinToman, "priceMinToman")
  if (definition.priceModel === "FIXED") {
    if (definition.priceMaxToman !== null && definition.priceMaxToman !== minimum) {
      throw new OfferingPricingError("INVALID_PRICE", "Fixed price maximum must be empty or equal to minimum")
    }
    return
  }

  if (definition.priceModel === "STARTING_FROM") {
    if (definition.priceMaxToman !== null && definition.priceMaxToman < minimum) {
      throw new OfferingPricingError("INVALID_PRICE", "Starting-from maximum cannot be below minimum")
    }
    return
  }

  const maximum = positiveAmount(definition.priceMaxToman, "priceMaxToman")
  if (maximum < minimum) {
    throw new OfferingPricingError("INVALID_PRICE_RANGE", "Maximum price cannot be below minimum price")
  }
}

export function calculateOfferingQuote(
  definition: PricingDefinition,
  quantity: number,
): OfferingQuoteCalculation {
  validateOfferingPricing(definition)
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 20) {
    throw new OfferingPricingError("INVALID_QUANTITY", "Quantity must be an integer between 1 and 20")
  }

  const durationMinute =
    definition.baseDurationMinute * quantity +
    definition.preparationMinute +
    definition.cleanupMinute +
    definition.bufferBeforeMinute +
    definition.bufferAfterMinute
  if (durationMinute > 1440) {
    throw new OfferingPricingError(
      "QUOTE_DURATION_TOO_LONG",
      "One quote cannot reserve more than 1440 minutes",
    )
  }

  if (definition.priceModel === "AFTER_CONSULTATION") {
    return {
      priceKind: "CONSULTATION_REQUIRED",
      unitPriceToman: toman(0n),
      totalToman: toman(0n),
      priceMinToman: null,
      priceMaxToman: null,
      durationMinute,
      quantity,
      finalPrice: false,
      directlyBookable: false,
    }
  }

  const minimum = toman(definition.priceMinToman as bigint)
  const maximum = definition.priceMaxToman === null ? null : toman(definition.priceMaxToman)
  const finalPrice = definition.priceModel === "FIXED"

  return {
    priceKind: finalPrice ? "FINAL" : "ESTIMATE",
    unitPriceToman: minimum,
    totalToman: multiplyToman(minimum, quantity),
    priceMinToman: minimum,
    priceMaxToman: maximum,
    durationMinute,
    quantity,
    finalPrice,
    directlyBookable: finalPrice,
  }
}

export function pricingSnapshot(calculation: OfferingQuoteCalculation) {
  return {
    priceKind: calculation.priceKind,
    unitPriceToman: serializeToman(calculation.unitPriceToman),
    totalToman: serializeToman(calculation.totalToman),
    priceMinToman: calculation.priceMinToman ? serializeToman(calculation.priceMinToman) : null,
    priceMaxToman: calculation.priceMaxToman ? serializeToman(calculation.priceMaxToman) : null,
    durationMinute: calculation.durationMinute,
    quantity: calculation.quantity,
    finalPrice: calculation.finalPrice,
    directlyBookable: calculation.directlyBookable,
    currency: "TOMAN",
  }
}
