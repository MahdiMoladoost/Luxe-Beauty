import { randomUUID } from "node:crypto"
import type { Booking, BookingDraft, SlotHold, TimeSlot } from "@/lib/domain"
import {
  HOLD_DURATION_MINUTES,
  addMinutesToTime,
  calculateQuote,
  createTrackingCode,
  rangesOverlap,
  validateBookingDraft,
} from "@/lib/booking-engine"
import { createDailySlots, getCompatibleStaff, services, staffMembers } from "@/lib/mock-data"

type BookingState = {
  holds: Map<string, SlotHold>
  bookings: Map<string, Booking>
}

declare global {
  // eslint-disable-next-line no-var
  var __luxeBookingState: BookingState | undefined
}

const state: BookingState = globalThis.__luxeBookingState ?? {
  holds: new Map<string, SlotHold>(),
  bookings: new Map<string, Booking>(),
}

if (process.env.NODE_ENV !== "production") {
  globalThis.__luxeBookingState = state
}

function cleanExpiredHolds() {
  const now = Date.now()
  for (const [id, hold] of state.holds.entries()) {
    if (new Date(hold.expiresAt).getTime() <= now) state.holds.delete(id)
  }
}

function hasConflict(input: {
  salonId: string
  staffId: string
  date: string
  startTime: string
  endTime: string
  excludeHoldId?: string
}) {
  cleanExpiredHolds()

  const holdConflict = Array.from(state.holds.values()).some(
    (hold) =>
      hold.id !== input.excludeHoldId &&
      hold.salonId === input.salonId &&
      hold.staffId === input.staffId &&
      hold.date === input.date &&
      rangesOverlap(hold.startTime, hold.endTime, input.startTime, input.endTime),
  )

  if (holdConflict) return true

  return Array.from(state.bookings.values()).some(
    (booking) =>
      booking.salonId === input.salonId &&
      booking.staffId === input.staffId &&
      booking.date === input.date &&
      !["cancelled", "expired"].includes(booking.status) &&
      rangesOverlap(booking.startTime, booking.endTime, input.startTime, input.endTime),
  )
}

function findAvailableStaff(input: {
  salonId: string
  serviceIds: string[]
  requestedStaffId?: string
  date: string
  startTime: string
  endTime: string
}) {
  const compatible = getCompatibleStaff(input.serviceIds, input.salonId)
  const candidates = input.requestedStaffId && input.requestedStaffId !== "any"
    ? compatible.filter((staff) => staff.id === input.requestedStaffId)
    : compatible

  return candidates.find(
    (staff) =>
      !hasConflict({
        salonId: input.salonId,
        staffId: staff.id,
        date: input.date,
        startTime: input.startTime,
        endTime: input.endTime,
      }),
  )
}

export function listAvailableSlots(input: {
  salonId: string
  date: string
  staffId?: string
  serviceIds?: string[]
}): TimeSlot[] {
  cleanExpiredHolds()
  const selectedServiceIds = input.serviceIds?.length
    ? input.serviceIds
    : services.filter((service) => service.salonId === input.salonId).slice(0, 1).map((service) => service.id)
  const quote = calculateQuote(selectedServiceIds, input.salonId)
  const compatibleStaff = getCompatibleStaff(selectedServiceIds, input.salonId)
  const requestedStaff = input.staffId && input.staffId !== "any"
    ? compatibleStaff.filter((staff) => staff.id === input.staffId)
    : compatibleStaff

  const slots: TimeSlot[] = []
  for (const staff of requestedStaff) {
    const daily = createDailySlots(input.salonId, staff.id, input.date)
    for (const slot of daily) {
      const endTime = addMinutesToTime(slot.startTime, quote.durationMinutes)
      slots.push({
        ...slot,
        endTime,
        available: !hasConflict({
          salonId: input.salonId,
          staffId: staff.id,
          date: input.date,
          startTime: slot.startTime,
          endTime,
        }),
      })
    }
  }

  return slots.sort((a, b) => a.startTime.localeCompare(b.startTime) || a.staffId.localeCompare(b.staffId))
}

export function createSlotHold(input: {
  salonId: string
  serviceIds: string[]
  requestedStaffId?: string
  date: string
  startTime: string
  customerKey: string
}) {
  cleanExpiredHolds()
  const quote = calculateQuote(input.serviceIds, input.salonId)
  const endTime = addMinutesToTime(input.startTime, quote.durationMinutes)
  const staff = findAvailableStaff({
    salonId: input.salonId,
    serviceIds: input.serviceIds,
    requestedStaffId: input.requestedStaffId,
    date: input.date,
    startTime: input.startTime,
    endTime,
  })

  if (!staff) {
    throw new Error("این زمان دیگر در دسترس نیست. زمان یا آرایشگر دیگری انتخاب کنید.")
  }

  for (const [id, existing] of state.holds.entries()) {
    if (existing.customerKey === input.customerKey) state.holds.delete(id)
  }

  const hold: SlotHold = {
    id: randomUUID(),
    salonId: input.salonId,
    staffId: staff.id,
    date: input.date,
    startTime: input.startTime,
    endTime,
    customerKey: input.customerKey,
    serviceIds: input.serviceIds,
    expiresAt: new Date(Date.now() + HOLD_DURATION_MINUTES * 60_000).toISOString(),
  }
  state.holds.set(hold.id, hold)
  return { hold, quote, staff }
}

export function confirmBooking(input: {
  holdId: string
  draft: BookingDraft
  markDepositPaid?: boolean
}) {
  cleanExpiredHolds()
  const validation = validateBookingDraft(input.draft)
  if (!validation.valid) {
    const error = new Error("اطلاعات رزرو کامل یا معتبر نیست.") as Error & { fields?: Record<string, string> }
    error.fields = validation.fields
    throw error
  }

  const hold = state.holds.get(input.holdId)
  if (!hold) throw new Error("زمان نگه‌داری‌شده منقضی شده است. دوباره زمان را انتخاب کنید.")
  if (hold.customerKey !== input.draft.customerMobile) throw new Error("این Hold متعلق به کاربر دیگری است.")
  if (
    hold.salonId !== input.draft.salonId ||
    hold.date !== input.draft.date ||
    hold.startTime !== input.draft.startTime ||
    hold.serviceIds.slice().sort().join(",") !== input.draft.serviceIds.slice().sort().join(",")
  ) {
    throw new Error("اطلاعات نهایی رزرو با زمان نگه‌داری‌شده هماهنگ نیست.")
  }

  if (
    hasConflict({
      salonId: hold.salonId,
      staffId: hold.staffId,
      date: hold.date,
      startTime: hold.startTime,
      endTime: hold.endTime,
      excludeHoldId: hold.id,
    })
  ) {
    state.holds.delete(hold.id)
    throw new Error("این زمان هم‌زمان توسط رزرو دیگری ثبت شد. زمان دیگری انتخاب کنید.")
  }

  const quote = calculateQuote(input.draft.serviceIds, input.draft.salonId, input.draft.discountCode)
  const depositPaid = quote.deposit === 0 || Boolean(input.markDepositPaid)
  const booking: Booking = {
    id: randomUUID(),
    trackingCode: createTrackingCode(),
    salonId: hold.salonId,
    staffId: hold.staffId,
    customerMobile: input.draft.customerMobile,
    customerName: input.draft.customerName,
    date: hold.date,
    startTime: hold.startTime,
    endTime: hold.endTime,
    status: depositPaid ? "confirmed" : "pending_payment",
    paymentStatus: depositPaid ? "paid" : "pending",
    quote,
    customerNote: input.draft.customerNote,
    createdAt: new Date().toISOString(),
  }

  state.bookings.set(booking.id, booking)
  state.holds.delete(hold.id)
  return {
    booking,
    staff: staffMembers.find((item) => item.id === booking.staffId),
  }
}

export function getBookingsForMobile(mobile: string) {
  return Array.from(state.bookings.values())
    .filter((booking) => booking.customerMobile === mobile)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function cancelBooking(bookingId: string, customerMobile: string) {
  const booking = state.bookings.get(bookingId)
  if (!booking || booking.customerMobile !== customerMobile) throw new Error("رزرو پیدا نشد.")
  if (["completed", "cancelled", "no_show"].includes(booking.status)) throw new Error("این رزرو قابل لغو نیست.")
  booking.status = "cancelled"
  if (booking.paymentStatus === "paid") booking.paymentStatus = "partially_refunded"
  state.bookings.set(booking.id, booking)
  return booking
}

export function getBookingStateSnapshot() {
  cleanExpiredHolds()
  return {
    activeHolds: state.holds.size,
    bookings: state.bookings.size,
  }
}
