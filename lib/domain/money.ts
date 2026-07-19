declare const tomanBrand: unique symbol

export type Toman = bigint & { readonly [tomanBrand]: "Toman" }

function assertNonNegative(value: bigint, label: string): void {
  if (value < 0n) {
    throw new RangeError(`${label} must not be negative`)
  }
}

export function toman(value: bigint | number | string): Toman {
  let parsed: bigint

  if (typeof value === "bigint") {
    parsed = value
  } else if (typeof value === "number") {
    if (!Number.isSafeInteger(value)) {
      throw new TypeError("Toman number input must be a safe integer")
    }
    parsed = BigInt(value)
  } else {
    const normalized = value.trim()
    if (!/^\d+$/.test(normalized)) {
      throw new TypeError("Toman string input must contain digits only")
    }
    parsed = BigInt(normalized)
  }

  assertNonNegative(parsed, "Toman amount")
  return parsed as Toman
}

export function addToman(...amounts: readonly Toman[]): Toman {
  return amounts.reduce<bigint>((total, amount) => total + amount, 0n) as Toman
}

export function subtractToman(amount: Toman, deduction: Toman): Toman {
  const result = amount - deduction
  assertNonNegative(result, "Toman subtraction result")
  return result as Toman
}

export function multiplyToman(amount: Toman, quantity: number): Toman {
  if (!Number.isSafeInteger(quantity) || quantity < 0) {
    throw new TypeError("Quantity must be a non-negative safe integer")
  }

  return (amount * BigInt(quantity)) as Toman
}

/**
 * Calculates a percentage using basis points (10_000 = 100%) with half-up
 * integer rounding. Financial percentages never use floating-point numbers.
 */
export function percentageOfToman(amount: Toman, basisPoints: number): Toman {
  if (!Number.isSafeInteger(basisPoints) || basisPoints < 0) {
    throw new TypeError("Basis points must be a non-negative safe integer")
  }

  const numerator = amount * BigInt(basisPoints)
  const rounded = (numerator + 5_000n) / 10_000n
  return rounded as Toman
}

export function minToman(first: Toman, second: Toman): Toman {
  return (first <= second ? first : second) as Toman
}

export function maxToman(first: Toman, second: Toman): Toman {
  return (first >= second ? first : second) as Toman
}

export function serializeToman(amount: Toman): string {
  return amount.toString(10)
}

export function formatToman(amount: Toman, locale = "fa-IR"): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(amount)
}
