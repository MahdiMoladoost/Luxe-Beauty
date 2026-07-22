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
          active: true,
          verified: true,
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
} satisfies Prisma.BookingInclude

export type ProviderPanelBooking = Prisma.BookingGetPayload<{ include: typeof bookingInclude }>

export type ProviderBookingFilters = {
  status?: BookingStatus
  query?: string
  startsFrom?: Date
  startsUntil?: Date
  page: number
  pageSize: number
  sort: "newest" | "appointment"
}

const activeUpcomingStatuses: BookingStatus[] = [
  "AWAITING_PAYMENT",
  "PAYMENT_PENDING",
  "AWAITING_PROVIDER_APPROVAL",
  "CONFIRMED",
  "RESCHEDULE_PROPOSED",
  "RESCHEDULED",
]

export class ProviderPanelRepository {
  constructor(private readonly database: PrismaClient = prisma) {}

  async ownedProviders(userId: string) {
    return this.database.providerOrganization.findMany({
      where: { ownerUserId: userId, deletedAt: null },
      select: {
        id: true,
        nameFa: true,
        slug: true,
        type: true,
        status: true,
        bookingEnabled: true,
        verificationAt: true,
        version: true,
        updatedAt: true,
      },
      orderBy: [{ status: "asc" }, { createdAt: "asc" }],
    })
  }

  async ownedProvider(userId: string, providerId: string) {
    return this.database.providerOrganization.findFirst({
      where: { id: providerId, ownerUserId: userId, deletedAt: null },
      select: {
        id: true,
        nameFa: true,
        slug: true,
        type: true,
        status: true,
        bookingEnabled: true,
        verificationAt: true,
        version: true,
        updatedAt: true,
      },
    })
  }

  async dashboard(providerId: string, today: { startsAt: Date; endsAt: Date }, now: Date) {
    const [
      branchTotal,
      activeBranches,
      offeringTotal,
      publishedOfferings,
      activeProfessionals,
      pendingApprovals,
      confirmedUpcoming,
      todayBookings,
      totalBookings,
      recentBookings,
    ] = await this.database.$transaction([
      this.database.branch.count({ where: { organizationId: providerId, deletedAt: null } }),
      this.database.branch.count({ where: { organizationId: providerId, deletedAt: null, active: true } }),
      this.database.serviceOffering.count({ where: { providerId, deletedAt: null } }),
      this.database.serviceOffering.count({
        where: { providerId, deletedAt: null, active: true, published: true },
      }),
      this.database.professionalAffiliation.count({
        where: { organizationId: providerId, status: "ACTIVE" },
      }),
      this.database.booking.count({
        where: { providerId, status: "AWAITING_PROVIDER_APPROVAL" },
      }),
      this.database.booking.count({
        where: {
          providerId,
          status: { in: ["CONFIRMED", "RESCHEDULED"] },
          items: { some: { startsAt: { gte: now } } },
        },
      }),
      this.database.booking.count({
        where: {
          providerId,
          status: { in: activeUpcomingStatuses },
          items: { some: { startsAt: { gte: today.startsAt, lt: today.endsAt } } },
        },
      }),
      this.database.booking.count({ where: { providerId } }),
      this.database.booking.findMany({
        where: { providerId },
        include: bookingInclude,
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
    ])

    return {
      counts: {
        branchTotal,
        activeBranches,
        offeringTotal,
        publishedOfferings,
        activeProfessionals,
        pendingApprovals,
        confirmedUpcoming,
        todayBookings,
        totalBookings,
      },
      recentBookings,
    }
  }

  async listBookings(providerId: string, filters: ProviderBookingFilters) {
    const conditions: Prisma.BookingWhereInput[] = [{ providerId }]

    if (filters.status) conditions.push({ status: filters.status })
    if (filters.startsFrom || filters.startsUntil) {
      conditions.push({
        items: {
          some: {
            startsAt: {
              ...(filters.startsFrom ? { gte: filters.startsFrom } : {}),
              ...(filters.startsUntil ? { lt: filters.startsUntil } : {}),
            },
          },
        },
      })
    }
    if (filters.query) {
      conditions.push({
        OR: [
          { recipient: { firstName: { contains: filters.query, mode: "insensitive" } } },
          { recipient: { lastName: { contains: filters.query, mode: "insensitive" } } },
          { branch: { nameFa: { contains: filters.query, mode: "insensitive" } } },
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
    const orderBy: Prisma.BookingOrderByWithRelationInput[] =
      filters.sort === "appointment"
        ? [{ items: { _count: "desc" } }, { createdAt: "desc" }]
        : [{ createdAt: "desc" }]

    const [total, rows] = await this.database.$transaction([
      this.database.booking.count({ where }),
      this.database.booking.findMany({
        where,
        include: bookingInclude,
        orderBy,
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
      }),
    ])

    if (filters.sort === "appointment") {
      rows.sort((left, right) => {
        const leftStart = left.items[0]?.startsAt.getTime() ?? Number.MAX_SAFE_INTEGER
        const rightStart = right.items[0]?.startsAt.getTime() ?? Number.MAX_SAFE_INTEGER
        return leftStart - rightStart
      })
    }

    return { total, rows }
  }
}

export const providerPanelRepository = new ProviderPanelRepository()
