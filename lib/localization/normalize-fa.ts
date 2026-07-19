const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹"
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩"

const ARABIC_TO_PERSIAN_LETTERS: Readonly<Record<string, string>> = {
  ي: "ی",
  ى: "ی",
  ئ: "ی",
  ك: "ک",
  ة: "ه",
 ۀ: "ه",
}

export function toLatinDigits(value: string): string {
  return Array.from(value, (character) => {
    const persianIndex = PERSIAN_DIGITS.indexOf(character)
    if (persianIndex >= 0) return String(persianIndex)

    const arabicIndex = ARABIC_DIGITS.indexOf(character)
    if (arabicIndex >= 0) return String(arabicIndex)

    return character
  }).join("")
}

export function normalizePersianText(value: string): string {
  const normalizedLetters = Array.from(value.normalize("NFKC"), (character) => {
    return ARABIC_TO_PERSIAN_LETTERS[character] ?? character
  }).join("")

  return toLatinDigits(normalizedLetters)
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(/[\u200B-\u200F\u202A-\u202E\u2060\uFEFF]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function normalizeSearchText(value: string): string {
  return normalizePersianText(value)
    .toLocaleLowerCase("fa-IR")
    .replace(/[ـ]/g, "")
    .replace(/[\p{P}\p{S}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function normalizeIranMobile(value: string): string {
  let mobile = toLatinDigits(value).replace(/[^0-9+]/g, "")

  if (mobile.startsWith("+98")) mobile = `0${mobile.slice(3)}`
  if (mobile.startsWith("0098")) mobile = `0${mobile.slice(4)}`
  if (mobile.startsWith("98") && mobile.length === 12) mobile = `0${mobile.slice(2)}`

  if (!/^09\d{9}$/.test(mobile)) {
    throw new TypeError("Invalid Iranian mobile number")
  }

  return mobile
}

export function normalizeIranNationalId(value: string): string {
  const nationalId = toLatinDigits(value).replace(/\D/g, "")

  if (!/^\d{10}$/.test(nationalId)) {
    throw new TypeError("Iranian national ID must contain exactly 10 digits")
  }

  return nationalId
}
