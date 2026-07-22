import { z } from "zod"

import { AuthError } from "@/lib/auth/errors"
import type { SessionPrincipal } from "@/lib/auth/types"
import { bookingStatuses, type BookingStatus } from "@/lib/domain/booking-state"
import { normalizePersianText } from "@/lib/localization/normalize-fa"
import {
  customerPanelRepository,
  type CustomerPanelBooking,
} from "@/lib/customer-panel/repository"

const bookingIdSchema = z.string().uuid()
const bookingQuerySchema = z.object({
  scope: z.enum(["all", "upcoming", "past"]).default("all"),
  status: z.enum(bookingStatuses).optional(),
  query: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(50).default(15),
})

function accountDto(account: NonNullable<Awaited<ReturnType<typeof customerPanelRepository.account>>>) {
  return {
    id: account.id,
    mobileNormalized: account.mobileNormalized,
    status: account.status,
    identityStatus: account.identityStatus,
    locale: account.locale,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
    profile: account.profile
      ? {
          id: account.profile.id,
          firstName: account.profile.firstName,
          lastName: account.profile.lastName,
          birthDate: account.profile.birthDate?.toISOString().slice(0, 10) ?? null,
          createdAt: account.profile.createdAt,
          updatedAt: account.profile.updatedAt,
        }
      : null,
  }
}

function bookingDto(booking: CustomerPanelBooking) {
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
    disputeWindowEndsAt: booking.disputeWindowEndsAt,
    cancelledAt: booking.cancelledAt,
    finalizedAt: booking.finalizedAt,
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
    provider: {
      id: booking.provider.id,
      nameFa: booking.provider.nameFa,
      slug: booking.provider.slug,
      status: booking.provider.status,
      bookingEnabled: booking.provider.bookingEnabled,
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
    payments: booking.payments.map((payment) => ({
      id: payment.id,
      purpose: payment.purpose,
      providerKey: payment.providerKey,
      providerRef: payment.providerRef,
      status: payment.status,
      amountToman: payment.amountToman.toString(),
      succeededAt: payment.succeededAt,
      failedAt: payment.failedAt,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    })),
  }
}

async function requireAccount(principal: SessionPrincipal) {
  const account = await customerPanelRepository.account(principal.userId)
  if (!account) throw new AuthError("ACCOUNT_NOT_FOUND", "حساب کاربری یافت نشد.", 404)
  return account
}

export async function customerPanelBootstrap(principal: SessionPrincipal) {
  const account = await requireAccount(principal)
  return { account: accountDto(account) }
}

export async function customerDashboard(principal: SessionPrincipal, now = new Date()) {
  const account = await requireAccount(principal)
  const result = await customerPanelRepository.dashboard(principal.userId, now)
  return {
    account: accountDto(account),
    counts: result.counts,
    recentBookings: result.recentBookings.map(bookingDto),
    generatedAt: now,
  }
}

export async function customerBookings(
  principal: SessionPrincipal,
  rawQuery: Record<string, string | undefined>,
  now = new Date(),
) {
  await requireAccount(principal)
  const input = bookingQuerySchema.parse(rawQuery)
  const query = input.query ? normalizePersianText(input.query) : undefined
  const result = await customerPanelRepository.listBookings(
    principal.userId,
    {
      scope: input.scope,
      status: input.status as BookingStatus | undefined,
      query,
      page: input.page,
      pageSize: input.pageSize,
    },
    now,
  )

  return {
    items: result.rows.map(bookingDto),
    pagination: {
      page: input.page,
      pageSize: input.pageSize,
      total: result.total,
      totalPages: Math.max(1, Math.ceil(result.total / input.pageSize)),
    },
    filters: {
      scope: input.scope,
      status: input.status ?? null,
      query: query ?? "",
    },
    generatedAt: now,
  }
}

export async function customerBookingDetail(principal: SessionPrincipal, bookingId: string) {
  await requireAccount(principal)
  const booking = await customerPanelRepository.ownedBooking(
    principal.userId,
    bookingIdSchema.parse(bookingId),
  )
  if (!booking) throw new AuthError("BOOKING_NOT_FOUND", "نوبت یافت نشد.", 404)
  return bookingDto(booking)
}
