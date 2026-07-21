import {
  Prisma,
  type BookingHold,
  type BookingStatus,
  type PrismaClient,
  type ScheduleOwnerType,
} from "@prisma/client"

import { scheduleWindows } from "@/lib/availability/time"
import type { RequestContext, SessionPrincipal } from "@/lib/auth/types"
import { bookingConfig } from "@/lib/booking/config"
import {
  intervalsOverlap,
  parseBookableQuoteSnapshot,
} from "@/lib/booking/hold-policy"
import { prisma } from "@/lib/infrastructure/prisma"

const BLOCKING_BOOKING_STATUSES: BookingStatus[] = [
  "HOLDING_SLOT",
  "AWAITING_PAYMENT",
  "PAYMENT_PENDING",
  "AWAITING_PROVIDER_APPROVAL",
  "CONFIRMED",
  "RESCHEDULE_PROPOSED",
  "RESCHEDULED",
  "CHECKED_IN",
  "IN_SERVICE",
  "COMPLETED_BY_PROVIDER",
  "AWAITING_CUSTOMER_DISPUTE_WINDOW",
  "DISPUTED",
]

const offeringInclude = {
  provider: true,
  branch: true,
  professional: true,
  standardService: true,
} satisfies Prisma.ServiceOfferingInclude

export type HoldRepositoryResult =
  | { kind: "CREATED"; hold: BookingHold }
  | { kind: "REPLAY"; hold: BookingHold }
  | {
      kind:
        | "IDEMPOTENCY_CONFLICT"
        | "IDEMPOTENCY_IN_PROGRESS"
        | "QUOTE_NOT_FOUND"
        | "QUOTE_EXPIRED"
        | "QUOTE_OWNER_MISMATCH"
        | "QUOTE_STALE"
        | "OFFERING_NOT_AVAILABLE"
        | "SCHEDULE_NOT_CONFIGURED"
        | "SLOT_NOT_AVAILABLE"
    }

export class BookingHoldRepository {
  constructor(private readonly database: PrismaClient = prisma) {}

  transaction<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.database.$transaction(operation, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 10_000,
      timeout: 20_000,
    })
  }

  async createOrReplay(input: {
    principal: SessionPrincipal
    quoteId: string
    startsAt: Date
    idempotencyKey: string
    requestHash: string
    now: Date
    context: RequestContext
  }): Promise<HoldRepositoryResult> {
    return this.transaction(async (tx) => {
      const idempotencyScope = `booking-hold:create:${input.principal.userId}`
      await this.advisoryLock(tx, `idempotency:${idempotencyScope}:${input.idempotencyKey}`)

      const existingIdempotency = await tx.idempotencyRecord.findUnique({
        where: { scope_key: { scope: idempotencyScope, key: input.idempotencyKey } },
      })
      if (existingIdempotency) {
        if (existingIdempotency.requestHash !== input.requestHash) {
          return { kind: "IDEMPOTENCY_CONFLICT" }
        }
        if (existingIdempotency.completedAt && existingIdempotency.resourceId) {
          const hold = await tx.bookingHold.findFirst({
            where: {
              id: existingIdempotency.resourceId,
              customerUserId: input.principal.userId,
            },
          })
          if (hold) return { kind: "REPLAY", hold }
        }
        return { kind: "IDEMPOTENCY_IN_PROGRESS" }
      }

      const quote = await tx.serviceQuote.findUnique({ where: { id: input.quoteId } })
      if (!quote) return { kind: "QUOTE_NOT_FOUND" }
      if (quote.expiresAt <= input.now) return { kind: "QUOTE_EXPIRED" }
      if (quote.customerUserId && quote.customerUserId !== input.principal.userId) {
        return { kind: "QUOTE_OWNER_MISMATCH" }
      }

      const quoteSnapshot = parseBookableQuoteSnapshot(quote.snapshot)
      if (
        quoteSnapshot.offering.id !== quote.offeringId ||
        quoteSnapshot.offering.providerId !== quote.providerId ||
        quoteSnapshot.calculation.durationMinute !== quote.durationMinute ||
        quoteSnapshot.calculation.totalToman !== quote.totalToman.toString()
      ) {
        return { kind: "QUOTE_STALE" }
      }

      const offering = await tx.serviceOffering.findFirst({
        where: {
          id: quote.offeringId,
          providerId: quote.providerId,
          active: true,
          published: true,
          deletedAt: null,
          standardService: { active: true },
          provider: { status: "APPROVED", bookingEnabled: true, deletedAt: null },
        },
        include: offeringInclude,
      })
      if (!offering) return { kind: "OFFERING_NOT_AVAILABLE" }
      if (
        offering.version !== quoteSnapshot.offering.version ||
        offering.branchId !== quoteSnapshot.offering.branchId ||
        offering.professionalId !== quoteSnapshot.offering.professionalId
      ) {
        return { kind: "QUOTE_STALE" }
      }
      if (offering.branchId && (!offering.branch || !offering.branch.active || offering.branch.deletedAt)) {
        return { kind: "OFFERING_NOT_AVAILABLE" }
      }
      if (
        offering.professionalId &&
        (!offering.professional || !offering.professional.active || !offering.professional.verified)
      ) {
        return { kind: "OFFERING_NOT_AVAILABLE" }
      }

      const resource = offering.professionalId
        ? { type: "PROFESSIONAL" as ScheduleOwnerType, id: offering.professionalId }
        : offering.branchId
          ? { type: "BRANCH" as ScheduleOwnerType, id: offering.branchId }
          : null
      if (!resource) return { kind: "SCHEDULE_NOT_CONFIGURED" }

      await this.advisoryLock(tx, `booking-resource:${resource.type}:${resource.id}`)
      await tx.bookingHold.updateMany({
        where: {
          resourceType: resource.type,
          resourceId: resource.id,
          status: "ACTIVE",
          expiresAt: { lte: input.now },
        },
        data: { status: "EXPIRED" },
      })

      const occupiedUntil = new Date(input.startsAt.getTime() + quote.durationMinute * 60_000)
      const requestedInterval = { startsAt: input.startsAt, endsAt: occupiedUntil }
      const [rules, exceptions, bookingItems, activeHolds] = await Promise.all([
        tx.weeklyScheduleRule.findMany({
          where: {
            ownerType: resource.type,
            ownerId: resource.id,
            active: true,
          },
          orderBy: [{ dayOfWeek: "asc" }, { startMinute: "asc" }],
        }),
        tx.scheduleException.findMany({
          where: {
            ownerType: resource.type,
            ownerId: resource.id,
            startsAt: { lt: occupiedUntil },
            endsAt: { gt: input.startsAt },
          },
        }),
        resource.type === "PROFESSIONAL"
          ? tx.bookingItem.findMany({
              where: {
                professionalId: resource.id,
                occupiedFrom: { lt: occupiedUntil },
                occupiedUntil: { gt: input.startsAt },
                booking: { status: { in: BLOCKING_BOOKING_STATUSES } },
              },
              select: { occupiedFrom: true, occupiedUntil: true },
            })
          : tx.bookingItem.findMany({
              where: {
                occupiedFrom: { lt: occupiedUntil },
                occupiedUntil: { gt: input.startsAt },
                booking: {
                  branchId: resource.id,
                  status: { in: BLOCKING_BOOKING_STATUSES },
                },
              },
              select: { occupiedFrom: true, occupiedUntil: true },
            }),
        tx.bookingHold.findMany({
          where: {
            resourceType: resource.type,
            resourceId: resource.id,
            status: "ACTIVE",
            expiresAt: { gt: input.now },
            occupiedFrom: { lt: occupiedUntil },
            occupiedUntil: { gt: input.startsAt },
          },
          select: { occupiedFrom: true, occupiedUntil: true },
        }),
      ])

      if (rules.length === 0 && !exceptions.some((item) => item.kind === "AVAILABLE")) {
        return { kind: "SCHEDULE_NOT_CONFIGURED" }
      }
      const windows = scheduleWindows(
        rules.map((rule) => ({
          dayOfWeek: rule.dayOfWeek,
          startMinute: rule.startMinute,
          endMinute: rule.endMinute,
          timezone: rule.timezone,
        })),
        exceptions.map((exception) => ({
          kind: exception.kind,
          startsAt: exception.startsAt,
          endsAt: exception.endsAt,
        })),
        requestedInterval,
      )
      const insideWindow = windows.some(
        (window) => window.startsAt <= input.startsAt && window.endsAt >= occupiedUntil,
      )
      const conflicts = [...bookingItems, ...activeHolds].some((item) =>
        intervalsOverlap(requestedInterval, {
          startsAt: item.occupiedFrom,
          endsAt: item.occupiedUntil,
        }),
      )
      if (!insideWindow || conflicts) return { kind: "SLOT_NOT_AVAILABLE" }

      await tx.idempotencyRecord.create({
        data: {
          scope: idempotencyScope,
          key: input.idempotencyKey,
          requestHash: input.requestHash,
          expiresAt: new Date(input.now.getTime() + 24 * 60 * 60 * 1000),
        },
      })

      const configuredExpiry = new Date(input.now.getTime() + bookingConfig.holdTtlSeconds * 1000)
      const expiresAt = configuredExpiry < quote.expiresAt ? configuredExpiry : quote.expiresAt
      const hold = await tx.bookingHold.create({
        data: {
          customerUserId: input.principal.userId,
          quoteId: quote.id,
          offeringId: offering.id,
          providerId: offering.providerId,
          branchId: offering.branchId,
          professionalId: offering.professionalId,
          resourceType: resource.type,
          resourceId: resource.id,
          startsAt: input.startsAt,
          endsAt: occupiedUntil,
          occupiedFrom: input.startsAt,
          occupiedUntil,
          status: "ACTIVE",
          expiresAt,
          idempotencyKey: input.idempotencyKey,
          requestHash: input.requestHash,
          snapshot: {
            schemaVersion: 1,
            quoteId: quote.id,
            quoteExpiresAt: quote.expiresAt.toISOString(),
            quoteSnapshot,
            offeringVersion: offering.version,
            resourceType: resource.type,
            resourceId: resource.id,
            occupiedFrom: input.startsAt.toISOString(),
            occupiedUntil: occupiedUntil.toISOString(),
            configuredHoldTtlSeconds: bookingConfig.holdTtlSeconds,
            effectiveExpiresAt: expiresAt.toISOString(),
          } as Prisma.InputJsonValue,
        },
      })

      const response = this.responseSnapshot(hold)
      await tx.idempotencyRecord.update({
        where: { scope_key: { scope: idempotencyScope, key: input.idempotencyKey } },
        data: {
          responseStatus: 201,
          responseBody: response as Prisma.InputJsonValue,
          resourceType: "BookingHold",
          resourceId: hold.id,
          completedAt: new Date(),
        },
      })
      await tx.auditLog.create({
        data: {
          actorUserId: input.principal.userId,
          action: "booking.hold.created",
          resourceType: "BookingHold",
          resourceId: hold.id,
          scopeType: "PROVIDER",
          scopeId: offering.providerId,
          correlationId: input.context.correlationId,
          metadata: {
            offeringId: offering.id,
            quoteId: quote.id,
            resourceType: resource.type,
            resourceId: resource.id,
            startsAt: input.startsAt.toISOString(),
            expiresAt: hold.expiresAt.toISOString(),
          } as Prisma.InputJsonValue,
        },
      })
      await tx.outboxEvent.create({
        data: {
          aggregateType: "BookingHold",
          aggregateId: hold.id,
          eventType: "booking.hold.created",
          dedupeKey: `booking-hold-created:${hold.id}`,
          payload: response as Prisma.InputJsonValue,
        },
      })
      return { kind: "CREATED", hold }
    })
  }

  async ownedHold(customerUserId: string, holdId: string, now: Date) {
    return this.transaction(async (tx) => {
      await tx.bookingHold.updateMany({
        where: {
          id: holdId,
          customerUserId,
          status: "ACTIVE",
          expiresAt: { lte: now },
        },
        data: { status: "EXPIRED" },
      })
      return tx.bookingHold.findFirst({ where: { id: holdId, customerUserId } })
    })
  }

  async releaseOwnedHold(input: {
    principal: SessionPrincipal
    holdId: string
    context: RequestContext
    now: Date
  }) {
    return this.transaction(async (tx) => {
      const hold = await tx.bookingHold.findFirst({
        where: { id: input.holdId, customerUserId: input.principal.userId },
      })
      if (!hold) return { kind: "NOT_FOUND" as const }
      if (hold.status !== "ACTIVE") return { kind: "UNCHANGED" as const, hold }
      await this.advisoryLock(tx, `booking-resource:${hold.resourceType}:${hold.resourceId}`)
      const updated = await tx.bookingHold.update({
        where: { id: hold.id },
        data: {
          status: hold.expiresAt <= input.now ? "EXPIRED" : "RELEASED",
          releasedAt: hold.expiresAt <= input.now ? null : input.now,
        },
      })
      await tx.auditLog.create({
        data: {
          actorUserId: input.principal.userId,
          action: updated.status === "RELEASED" ? "booking.hold.released" : "booking.hold.expired",
          resourceType: "BookingHold",
          resourceId: hold.id,
          scopeType: "PROVIDER",
          scopeId: hold.providerId,
          correlationId: input.context.correlationId,
        },
      })
      return { kind: "UPDATED" as const, hold: updated }
    })
  }

  responseSnapshot(hold: BookingHold) {
    return {
      id: hold.id,
      quoteId: hold.quoteId,
      offeringId: hold.offeringId,
      providerId: hold.providerId,
      branchId: hold.branchId,
      professionalId: hold.professionalId,
      resourceType: hold.resourceType,
      resourceId: hold.resourceId,
      startsAt: hold.startsAt.toISOString(),
      endsAt: hold.endsAt.toISOString(),
      occupiedFrom: hold.occupiedFrom.toISOString(),
      occupiedUntil: hold.occupiedUntil.toISOString(),
      status: hold.status,
      expiresAt: hold.expiresAt.toISOString(),
      createdAt: hold.createdAt.toISOString(),
      updatedAt: hold.updatedAt.toISOString(),
    }
  }

  private async advisoryLock(tx: Prisma.TransactionClient, key: string): Promise<void> {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))`
  }
}

export const bookingHoldRepository = new BookingHoldRepository()
