import { z } from "zod"

import { localDateTimeToUtc } from "@/lib/availability/time"
import { AuthError } from "@/lib/auth/errors"
import type { SessionPrincipal } from "@/lib/auth/types"
import { bookingStatuses, type BookingStatus } from "@/lib/domain/booking-state"
import { normalizePersianText } from "@/lib/localization/normalize-fa"
import {
  providerPanelRepository,
  type ProviderPanelBooking,
} from "@/lib/provider-panel/repository"

const providerIdSchema = z.string().uuid()
const bookingIdSchema = z.string().uuid()
const dateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
const bookingQuerySchema = z.object({
  providerId: providerIdSchema,
  status: z.enum(bookingStatuses).optional(),
  query: z.string().trim().max(100).optional(),
  dateFrom: dateOnlySchema.optional(),
  dateTo: dateOnlySchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(50).default(15),
  sort: z.enum(["newest", "appointment"]).default("newest"),
})

function tehranCalendarParts(date: Date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Tehran",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  ) as Record<string, number>
  return { year: parts.year, month: parts.month, day: parts.day }
}

function nextCalendarDate(input: { year: number; month: number; day: number }) {
  const next = new Date(Date.UTC(input.year, input.month - 1, input.day + 1))
  return { year: next.getUTCFullYear(), month: next.getUTCMonth() + 1, day: next.getUTCDate() }
}

function parseDateOnly(value: string) {
  const [year, month, day] = value.split("-").map(Number)
  return { year, month, day }
}

function startOfTehranDate(value: string) {
  return localDateTimeToUtc({ ...parseDateOnly(value), hour: 0, minute: 0 }, "Asia/Tehran")
}

function endOfTehranDate(value: string) {
  return localDateTimeToUtc({ ...nextCalendarDate(parseDateOnly(value)), hour: 0, minute: 0 }, "Asia/Tehran")
}

function providerDto(provider: {
  id: string
  nameFa: string
  slug: string
  type: string
  status: string
  bookingEnabled: boolean
  verificationAt: Date | null
  version: number
  updatedAt: Date
}) {
  return {
    id: provider.id,
    nameFa: provider.nameFa,
    slug: provider.slug,
    type: provider.type,
    status: provider.status,
    bookingEnabled: provider.bookingEnabled,
    verificationAt: provider.verificationAt,
    version: provider.version,
    updatedAt: provider.updatedAt,
  }
}

function bookingDto(booking: ProviderPanelBooking) {
  return {
    id: booking.id,
    status: booking.status,
    currency: booking.currency,
    subtotalToman: booking.subtotalToman.toString(),
    discountToman: booking.discountToman.toString(),
    travelFeeToman: booking.travelFeeToman.toString(),
    platformFeeToman: booking.platformFeeToman.toString(),
    totalToman: booking.totalToman.toString(),
    approvalDeadlineAt: booking.approvalDeadlineAt,
    version: booking.version,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
    recipient: {
      id: booking.recipient.id,
      firstName: booking.recipient.firstName,
      lastName: booking.recipient.lastName,
      birthDate: booking.recipient.birthDate?.toISOString().slice(0, 10) ?? null,
      genderCode: booking.recipient.genderCode,
      relationLabel: booking.recipient.relationLabel,
    },
    branch: booking.branch
      ? {
          id: booking.branch.id,
          nameFa: booking.branch.nameFa,
          active: booking.branch.active,
          city: booking.branch.city,
          neighborhood: booking.branch.neighborhood,
        }
      : null,
    items: booking.items.map((item) => ({
      id: item.id,
      startsAt: item.startsAt,
      endsAt: item.endsAt,
      occupiedFrom: item.occupiedFrom,
      occupiedUntil: item.occupiedUntil,
      unitPriceToman: item.unitPriceToman.toString(),
      quantity: item.quantity,
      offering: item.offering,
      professional: item.professional,
    })),
    transitions: booking.transitions,
  }
}

async function requireOwnedProvider(principal: SessionPrincipal, providerId: string) {
  const provider = await providerPanelRepository.ownedProvider(
    principal.userId,
    providerIdSchema.parse(providerId),
  )
  if (!provider) throw new AuthError("PROVIDER_NOT_FOUND", "پنل ارائه‌دهنده یافت نشد.", 404)
  return provider
}

export async function providerPanelBootstrap(
  principal: SessionPrincipal,
  requestedProviderId?: string | null,
) {
  const providers = await providerPanelRepository.ownedProviders(principal.userId)
  const selectedId = requestedProviderId
    ? providerIdSchema.parse(requestedProviderId)
    : providers[0]?.id
  const selectedProvider = selectedId
    ? providers.find((provider) => provider.id === selectedId) ?? null
    : null

  if (selectedId && !selectedProvider) {
    throw new AuthError("PROVIDER_NOT_FOUND", "پنل ارائه‌دهنده یافت نشد.", 404)
  }

  return {
    providers: providers.map(providerDto),
    selectedProvider: selectedProvider ? providerDto(selectedProvider) : null,
  }
}

export async function providerDashboard(
  principal: SessionPrincipal,
  providerId: string,
  now = new Date(),
) {
  const provider = await requireOwnedProvider(principal, providerId)
  const current = tehranCalendarParts(now)
  const next = nextCalendarDate(current)
  const today = {
    startsAt: localDateTimeToUtc({ ...current, hour: 0, minute: 0 }, "Asia/Tehran"),
    endsAt: localDateTimeToUtc({ ...next, hour: 0, minute: 0 }, "Asia/Tehran"),
  }
  const result = await providerPanelRepository.dashboard(provider.id, today, now)
  return {
    provider: providerDto(provider),
    counts: result.counts,
    recentBookings: result.recentBookings.map(bookingDto),
    generatedAt: now,
  }
}

export async function providerBookings(
  principal: SessionPrincipal,
  rawQuery: Record<string, string | undefined>,
) {
  const input = bookingQuerySchema.parse(rawQuery)
  await requireOwnedProvider(principal, input.providerId)

  if (input.dateFrom && input.dateTo && input.dateFrom > input.dateTo) {
    throw new AuthError("INVALID_DATE_RANGE", "بازه تاریخ انتخاب‌شده معتبر نیست.", 400)
  }

  const query = input.query ? normalizePersianText(input.query) : undefined
  const result = await providerPanelRepository.listBookings(input.providerId, {
    status: input.status as BookingStatus | undefined,
    query,
    startsFrom: input.dateFrom ? startOfTehranDate(input.dateFrom) : undefined,
    startsUntil: input.dateTo ? endOfTehranDate(input.dateTo) : undefined,
    page: input.page,
    pageSize: input.pageSize,
    sort: input.sort,
  })

  return {
    items: result.rows.map(bookingDto),
    pagination: {
      page: input.page,
      pageSize: input.pageSize,
      total: result.total,
      totalPages: Math.max(1, Math.ceil(result.total / input.pageSize)),
    },
    filters: {
      providerId: input.providerId,
      status: input.status ?? null,
      query: query ?? "",
      dateFrom: input.dateFrom ?? null,
      dateTo: input.dateTo ?? null,
      sort: input.sort,
    },
  }
}

export async function providerBookingDetails(
  principal: SessionPrincipal,
  providerId: string,
  bookingId: string,
) {
  const provider = await requireOwnedProvider(principal, providerId)
  const booking = await providerPanelRepository.booking(
    provider.id,
    bookingIdSchema.parse(bookingId),
  )
  if (!booking) throw new AuthError("BOOKING_NOT_FOUND", "نوبت قابل مدیریت یافت نشد.", 404)
  return bookingDto(booking)
}
