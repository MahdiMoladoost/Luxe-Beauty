import type { BeautyService, BookingDraft, BookingQuote } from "@/lib/domain"
import { services } from "@/lib/mock-data"

export const HOLD_DURATION_MINUTES = 7

export function isIranianMobile(value: string) {
  return /^09\d{9}$/.test(normalizeDigits(value).replace(/\s|-/g, ""))
}

export function normalizeDigits(value: string) {
  const persian = "۰۱۲۳۴۵۶۷۸۹"
  const arabic = "٠١٢٣٤٥٦٧٨٩"
  return value
    .replace(/[۰-۹]/g, (digit) => String(persian.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(arabic.indexOf(digit)))
}

export function formatToman(amount: number) {
  return `${new Intl.NumberFormat("fa-IR").format(amount)} تومان`
}

export function addMinutesToTime(startTime: string, minutes: number) {
  const [hour, minute] = startTime.split(":").map(Number)
  const total = hour * 60 + minute + minutes
  const normalized = ((total % 1440) + 1440) % 1440
  return `${String(Math.floor(normalized / 60)).padStart(2, "0")}:${String(normalized % 60).padStart(2, "0")}`
}

export function toMinutes(time: string) {
  const [hour, minute] = time.split(":").map(Number)
  return hour * 60 + minute
}

export function rangesOverlap(startA: string, endA: string, startB: string, endB: string) {
  return toMinutes(startA) < toMinutes(endB) && toMinutes(startB) < toMinutes(endA)
}

export function getSelectedServices(serviceIds: string[], salonId?: string): BeautyService[] {
  const uniqueIds = Array.from(new Set(serviceIds))
  return services.filter((service) => uniqueIds.includes(service.id) && (!salonId || service.salonId === salonId))
}

export function calculateQuote(serviceIds: string[], salonId?: string, discountCode?: string): BookingQuote {
  const selected = getSelectedServices(serviceIds, salonId)
  if (selected.length !== new Set(serviceIds).size) {
    throw new Error("یک یا چند خدمت معتبر نیست یا به این سالن تعلق ندارد.")
  }

  const lines = selected.map((service) => ({
    serviceId: service.id,
    serviceName: service.name,
    durationMinutes: service.durationMinutes,
    unitPrice: service.discountPrice ?? service.price,
    depositAmount: service.depositAmount,
  }))

  const subtotal = selected.reduce((sum, service) => sum + service.price, 0)
  const campaignDiscount = selected.reduce(
    (sum, service) => sum + Math.max(0, service.price - (service.discountPrice ?? service.price)),
    0,
  )
  const couponDiscount = discountCode?.trim().toUpperCase() === "LUXE10" ? Math.round((subtotal - campaignDiscount) * 0.1) : 0
  const discount = campaignDiscount + couponDiscount
  const total = Math.max(0, subtotal - discount)
  const deposit = Math.min(total, selected.reduce((sum, service) => sum + service.depositAmount, 0))
  const durationMinutes = selected.reduce((sum, service) => sum + service.durationMinutes, 0)

  return { lines, subtotal, discount, total, deposit, durationMinutes }
}

export function validateBookingDraft(draft: BookingDraft) {
  const fields: Record<string, string> = {}
  const selected = getSelectedServices(draft.serviceIds, draft.salonId)

  if (!draft.salonId) fields.salonId = "انتخاب سالن الزامی است."
  if (draft.serviceIds.length === 0) fields.serviceIds = "حداقل یک خدمت انتخاب کنید."
  if (selected.length !== new Set(draft.serviceIds).size) fields.serviceIds = "خدمات انتخاب‌شده معتبر نیستند."
  if (!draft.staffId) fields.staffId = "آرایشگر یا گزینه هر آرایشگر موجود را انتخاب کنید."
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date)) fields.date = "تاریخ معتبر انتخاب کنید."
  if (!/^\d{2}:\d{2}$/.test(draft.startTime)) fields.startTime = "ساعت معتبر انتخاب کنید."
  if (!isIranianMobile(draft.customerMobile)) fields.customerMobile = "شماره موبایل باید با ۰۹ شروع شود و ۱۱ رقم باشد."
  if (!draft.acceptedTerms) fields.acceptedTerms = "پذیرش قوانین رزرو الزامی است."

  if (draft.staffId && selected.some((service) => !service.staffIds.includes(draft.staffId as string))) {
    fields.staffId = "آرایشگر انتخاب‌شده همه خدمات سبد را ارائه نمی‌دهد."
  }

  return {
    valid: Object.keys(fields).length === 0,
    fields,
  }
}

export function createTrackingCode() {
  const timestampPart = Date.now().toString(36).slice(-6).toUpperCase()
  const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `LX-${timestampPart}-${randomPart}`
}
