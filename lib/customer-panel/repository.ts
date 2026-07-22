import { Prisma, type BookingStatus, type PrismaClient } from "@prisma/client"

import { prisma } from "@/lib/infrastructure/prisma"

const bookingInclude = {
  recipient: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      birthDate: true,
      genderCode: true,
      relationLabel: true,
    },
  },
  provider: {
    select: {
      id: true,
      nameFa: true,
      slug: true,
      status: true,
      bookingEnabled: true,
    },
  },
  branch: {
    select: {
      id: true,
      nameFa: true,
      active: true,
      city: { select: { id: true, nameFa: true } },
      neighborhood: { select: { id: true, nameFa: true } },
    },
  },
  items: {
    orderBy: { startsAt: "asc" as const },
    include: {
      offering: {
        select: {
          id: true,
          titleFa: true,
          standardService: { select: { id: true, titleFa: true } },
        },
      },
      professional: {
        select: {
          id: true,
          displayNameFa: true,
          verified: true,
          active: true,
        },
      },
    },
  },
  transitions: {
    orderBy: { createdAt: "asc" as const },
    select: {
      id: true,
      fromStatus: true,
      toStatus: true,
      reasonCode: true,
      reason: true,
      createdAt: true,
    },
  },
  payments: {
    orderBy: { createdAt: "desc" as const },
    select: {
      id: true,
      purpose: true,
      providerKey: true,
      providerRef: true,
      status: true,
      amountToman: true,
      succeededAt: true,
      failedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  },
} satisfies Prisma.BookingInclude

export type CustomerPanelBooking = Prisma.BookingGetPayload<{ include: typeof bookingInclude }>

export type CustomerBookingFilters = {
  scope: "all" | "upcoming" | "past"
  status?: BookingStatus
  query?: string
  page: number
  pageSize: number
}

const upcomingStatuses: BookingStatus[] = [
  "HOLDING_SLOT",
  "AWAITING_PAYMENT",
  "PAYMENT_PENDING",
  "AWAITING_PROVIDER_APPROVAL",
  "CONFIRMED",
  "RESCHEDULE_PROPOSED",
  "RESCHEDULED",
  "CHECKED_IN",
  "IN_SERVICE",
]

const completedStatuses: BookingStatus[] = [
  "COMPLETED_BY_PROVIDER",
  "AWAITING_CUSTOMER_DISPUTE_WINDOW",
  "FINALIZED",
  "CUSTOMER_NO_SHOW",
  "PROVIDER_NO_SHOW",
  "DISPUTED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
]

export class CustomerPanelRepository {
  constructor(private readonly database: PrismaClient = prisma) {}

  account(userId: string) {
    return this.database.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        mobileNormalized: true,
        status: true,
        identityStatus: true,
        locale: true,
        createdAt: true,
        updatedAt: true,
        profile: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            birthDate: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    })
  }

  async dashboard(userId: string, now: Date) {
    const [bookingTotal, upcoming, awaitingProvider, finalized, recipientTotal, recentBookings] =
      await this.database.$transaction([
        this.database.booking.count({ where: { customerUserId: userId } }),
        this.database.booking.count({
          where: {
            customerUserId: userId,
            status: { in: upcomingStatuses },
            items: { some: { startsAt: { gte: now } } },
          },
        }),
        this.database.booking.count({
          where: { customerUserId: userId, status: "AWAITING_PROVIDER_APPROVAL" },
        }),
        this.database.booking.count({
          where: { customerUserId: userId, status: { in: completedStatuses } },
        }),
        this.database.serviceRecipient.count({
          where: { customerUserId: userId, deletedAt: null },
        }),
        this.database.booking.findMany({
          where: { customerUserId: userId },
          include: bookingInclude,
          orderBy: { createdAt: "desc" },
          take: 6,
        }),
      ])

    return {
      counts: {
        bookingTotal,
        upcoming,
        awaitingProvider,
        finalized,
        recipientTotal,
      },
      recentBookings,
    }
  }

  async listBookings(userId: string, filters: CustomerBookingFilters, now: Date) {
    const conditions: Prisma.BookingWhereInput[] = [{ customerUserId: userId }]

    if (filters.scope === "upcoming") {
      conditions.push({
        status: { in: upcomingStatuses },
        items: { some: { startsAt: { gte: now } } },
      })
    }
    if (filters.scope === "past") {
      conditions.push({
        OR: [
          { status: { in: completedStatuses } },
          { status: { in: ["REJECTED", "EXPIRED", "CUSTOMER_CANCELLED", "PROVIDER_CANCELLED"] } },
          { items: { some: { endsAt: { lt: now } } } },
        ],
      })
    }
    if (filters.status) conditions.push({ status: filters.status })
    if (filters.query) {
      conditions.push({
        OR: [
          { provider: { nameFa: { contains: filters.query, mode: "insensitive" } } },
          { branch: { nameFa: { contains: filters.query, mode: "insensitive" } } },
          { recipient: { firstName: { contains: filters.query, mode: "insensitive" } } },
          { recipient: { lastName: { contains: filters.query, mode: "insensitive" } } },
          {
            items: {
              some: {
                OR: [
                  { offering: { titleFa: { contains: filters.query, mode: "insensitive" } } },
                  {
                    offering: {
                      standardService: {
                        titleFa: { contains: filters.query, mode: "insensitive" },
                      },
                    },
                  },
                  {
                    professional: {
                      displayNameFa: { contains: filters.query, mode: "insensitive" },
                    },
                  },
                ],
              },
            },
          },
        ],
      })
    }

    const where: Prisma.BookingWhereInput = { AND: conditions }
    const [total, rows] = await this.database.$transaction([
      this.database.booking.count({ where }),
      this.database.booking.findMany({
        where,
        include: bookingInclude,
        orderBy: { createdAt: "desc" },
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
      }),
    ])

    return { total, rows }
  }

  ownedBooking(userId: string, bookingId: string) {
    return this.database.booking.findFirst({
      where: { id: bookingId, customerUserId: userId },
      include: bookingInclude,
    })
  }
}

export const customerPanelRepository = new CustomerPanelRepository()
