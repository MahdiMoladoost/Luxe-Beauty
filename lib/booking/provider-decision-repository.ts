import { Prisma, type PrismaClient } from "@prisma/client"

import type { RequestContext, SessionPrincipal } from "@/lib/auth/types"
import {
  ProviderBookingDecisionPolicyError,
  type ProviderBookingDecisionAction,
  type ProviderRejectionReasonCode,
  validateProviderBookingDecision,
} from "@/lib/booking/provider-decision-policy"
import { prisma } from "@/lib/infrastructure/prisma"

const providerBookingInclude = {
  items: true,
  transitions: { orderBy: { createdAt: "asc" as const } },
  recipient: true,
  payments: { select: { id: true, status: true } },
} satisfies Prisma.BookingInclude

type ProviderBooking = Prisma.BookingGetPayload<{ include: typeof providerBookingInclude }>

export type ProviderBookingDecisionResult =
  | { kind: "UPDATED"; booking: ProviderBooking }
  | { kind: "REPLAY"; booking: ProviderBooking }
  | { kind: "APPROVAL_DEADLINE_EXPIRED"; booking: ProviderBooking }
  | {
      kind:
        | "IDEMPOTENCY_CONFLICT"
        | "IDEMPOTENCY_IN_PROGRESS"
        | "BOOKING_NOT_FOUND"
        | "BOOKING_NOT_PENDING"
        | "VERSION_CONFLICT"
        | "PAYMENT_WORKFLOW_REQUIRED"
        | "BOOKING_ALLOCATION_NOT_FOUND"
        | "CONCURRENCY_CONFLICT"
    }

export class ProviderBookingDecisionRepository {
  constructor(private readonly database: PrismaClient = prisma) {}

  private transaction<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.database.$transaction(operation, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 10_000,
      timeout: 20_000,
    })
  }

  async decideOrReplay(input: {
    principal: SessionPrincipal
    bookingId: string
    action: ProviderBookingDecisionAction
    expectedVersion: number
    reasonCode?: ProviderRejectionReasonCode
    reason?: string | null
    idempotencyKey: string
    requestHash: string
    now: Date
    context: RequestContext
  }): Promise<ProviderBookingDecisionResult> {
    return this.transaction(async (tx) => {
      const idempotencyScope = `booking:provider-decision:${input.principal.userId}`
      await this.advisoryLock(tx, `idempotency:${idempotencyScope}:${input.idempotencyKey}`)

      const existingIdempotency = await tx.idempotencyRecord.findUnique({
        where: { scope_key: { scope: idempotencyScope, key: input.idempotencyKey } },
      })
      if (existingIdempotency) {
        if (existingIdempotency.requestHash !== input.requestHash) {
          return { kind: "IDEMPOTENCY_CONFLICT" }
        }
        if (existingIdempotency.completedAt && existingIdempotency.resourceId) {
          const booking = await tx.booking.findFirst({
            where: {
              id: existingIdempotency.resourceId,
              provider: { ownerUserId: input.principal.userId, deletedAt: null },
            },
            include: providerBookingInclude,
          })
          if (booking) return { kind: "REPLAY", booking }
        }
        return { kind: "IDEMPOTENCY_IN_PROGRESS" }
      }

      await this.advisoryLock(tx, `booking:${input.bookingId}`)
      const booking = await tx.booking.findFirst({
        where: {
          id: input.bookingId,
          provider: { ownerUserId: input.principal.userId, deletedAt: null },
        },
        include: providerBookingInclude,
      })
      if (!booking) return { kind: "BOOKING_NOT_FOUND" }
      if (booking.payments.length > 0) return { kind: "PAYMENT_WORKFLOW_REQUIRED" }

      const allocation = await tx.bookingHold.findUnique({
        where: { consumedBookingId: booking.id },
      })
      if (!allocation || allocation.status !== "CONSUMED") {
        return { kind: "BOOKING_ALLOCATION_NOT_FOUND" }
      }

      let decision
      try {
        decision = validateProviderBookingDecision({
          action: input.action,
          status: booking.status,
          actualVersion: booking.version,
          expectedVersion: input.expectedVersion,
          approvalDeadlineAt: booking.approvalDeadlineAt,
          now: input.now,
          reasonCode: input.reasonCode,
          reason: input.reason,
        })
      } catch (error) {
        if (!(error instanceof ProviderBookingDecisionPolicyError)) throw error
        if (error.code === "BOOKING_NOT_AWAITING_PROVIDER_APPROVAL") {
          return { kind: "BOOKING_NOT_PENDING" }
        }
        if (error.code === "BOOKING_VERSION_CONFLICT") {
          return { kind: "VERSION_CONFLICT" }
        }
        if (error.code === "APPROVAL_DEADLINE_EXPIRED") {
          const expired = await this.expireLockedBooking(tx, {
            booking,
            allocationId: allocation.id,
            now: input.now,
            correlationId: input.context.correlationId,
            triggeredByUserId: input.principal.userId,
          })
          if (!expired) return { kind: "CONCURRENCY_CONFLICT" }
          return { kind: "APPROVAL_DEADLINE_EXPIRED", booking: expired }
        }
        throw error
      }

      const changed = await tx.booking.updateMany({
        where: {
          id: booking.id,
          status: "AWAITING_PROVIDER_APPROVAL",
          version: input.expectedVersion,
          approvalDeadlineAt: { gt: input.now },
        },
        data: {
          status: decision.targetStatus,
          version: { increment: 1 },
        },
      })
      if (changed.count !== 1) return { kind: "CONCURRENCY_CONFLICT" }

      if (decision.targetStatus === "REJECTED") {
        const released = await tx.bookingHold.updateMany({
          where: { id: allocation.id, status: "CONSUMED", consumedBookingId: booking.id },
          data: { status: "RELEASED", releasedAt: input.now },
        })
        if (released.count !== 1) {
          throw new Error("Booking allocation changed during provider rejection")
        }
      }

      await tx.bookingTransition.create({
        data: {
          bookingId: booking.id,
          fromStatus: "AWAITING_PROVIDER_APPROVAL",
          toStatus: decision.targetStatus,
          actorUserId: input.principal.userId,
          reasonCode: decision.reasonCode,
          reason: decision.reason,
          correlationId: input.context.correlationId,
          metadata: {
            source: "provider-api",
            previousVersion: booking.version,
            expectedVersion: input.expectedVersion,
            allocationReleased: decision.targetStatus === "REJECTED",
          } as Prisma.InputJsonValue,
        },
      })

      await tx.auditLog.create({
        data: {
          actorUserId: input.principal.userId,
          action:
            decision.targetStatus === "CONFIRMED"
              ? "booking.provider-approved"
              : "booking.provider-rejected",
          resourceType: "Booking",
          resourceId: booking.id,
          scopeType: "PROVIDER",
          scopeId: booking.providerId,
          reason: decision.reason,
          correlationId: input.context.correlationId,
          metadata: {
            fromStatus: "AWAITING_PROVIDER_APPROVAL",
            toStatus: decision.targetStatus,
            reasonCode: decision.reasonCode,
            previousVersion: booking.version,
          } as Prisma.InputJsonValue,
        },
      })

      const updated = await tx.booking.findUniqueOrThrow({
        where: { id: booking.id },
        include: providerBookingInclude,
      })
      const responseSnapshot = this.responseSnapshot(updated)

      await tx.idempotencyRecord.create({
        data: {
          scope: idempotencyScope,
          key: input.idempotencyKey,
          requestHash: input.requestHash,
          responseStatus: 200,
          responseBody: responseSnapshot as Prisma.InputJsonValue,
          resourceType: "Booking",
          resourceId: updated.id,
          expiresAt: new Date(input.now.getTime() + 24 * 60 * 60 * 1000),
          completedAt: input.now,
        },
      })

      await tx.outboxEvent.create({
        data: {
          aggregateType: "Booking",
          aggregateId: updated.id,
          eventType:
            decision.targetStatus === "CONFIRMED"
              ? "booking.provider-approved"
              : "booking.provider-rejected",
          dedupeKey: `booking-provider-decision:${updated.id}:${updated.version}`,
          payload: responseSnapshot as Prisma.InputJsonValue,
        },
      })

      return { kind: "UPDATED", booking: updated }
    })
  }

  private async expireLockedBooking(
    tx: Prisma.TransactionClient,
    input: {
      booking: ProviderBooking
      allocationId: string
      now: Date
      correlationId: string
      triggeredByUserId: string
    },
  ): Promise<ProviderBooking | null> {
    const changed = await tx.booking.updateMany({
      where: {
        id: input.booking.id,
        status: "AWAITING_PROVIDER_APPROVAL",
        version: input.booking.version,
        approvalDeadlineAt: { lte: input.now },
      },
      data: { status: "EXPIRED", version: { increment: 1 } },
    })
    if (changed.count !== 1) return null

    const released = await tx.bookingHold.updateMany({
      where: {
        id: input.allocationId,
        status: "CONSUMED",
        consumedBookingId: input.booking.id,
      },
      data: { status: "RELEASED", releasedAt: input.now },
    })
    if (released.count !== 1) {
      throw new Error("Booking allocation changed during approval expiry")
    }

    await tx.bookingTransition.create({
      data: {
        bookingId: input.booking.id,
        fromStatus: "AWAITING_PROVIDER_APPROVAL",
        toStatus: "EXPIRED",
        actorUserId: null,
        reasonCode: "APPROVAL_DEADLINE_EXPIRED",
        correlationId: input.correlationId,
        metadata: {
          source: "provider-command",
          triggeredByUserId: input.triggeredByUserId,
          approvalDeadlineAt: input.booking.approvalDeadlineAt?.toISOString() ?? null,
        } as Prisma.InputJsonValue,
      },
    })
    await tx.auditLog.create({
      data: {
        actorUserId: input.triggeredByUserId,
        action: "booking.provider-approval-expired",
        resourceType: "Booking",
        resourceId: input.booking.id,
        scopeType: "PROVIDER",
        scopeId: input.booking.providerId,
        correlationId: input.correlationId,
        metadata: {
          source: "provider-command",
          approvalDeadlineAt: input.booking.approvalDeadlineAt?.toISOString() ?? null,
          allocationReleased: true,
        } as Prisma.InputJsonValue,
      },
    })

    const expired = await tx.booking.findUniqueOrThrow({
      where: { id: input.booking.id },
      include: providerBookingInclude,
    })
    await tx.outboxEvent.create({
      data: {
        aggregateType: "Booking",
        aggregateId: expired.id,
        eventType: "booking.provider-approval-expired",
        dedupeKey: `booking-provider-approval-expired:${expired.id}`,
        payload: this.responseSnapshot(expired) as Prisma.InputJsonValue,
      },
    })
    return expired
  }

  private async advisoryLock(tx: Prisma.TransactionClient, key: string): Promise<void> {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))`
  }

  private responseSnapshot(booking: ProviderBooking) {
    return {
      id: booking.id,
      providerId: booking.providerId,
      branchId: booking.branchId,
      status: booking.status,
      currency: booking.currency,
      totalToman: booking.totalToman.toString(),
      approvalDeadlineAt: booking.approvalDeadlineAt?.toISOString() ?? null,
      version: booking.version,
      updatedAt: booking.updatedAt.toISOString(),
      items: booking.items.map((item) => ({
        id: item.id,
        offeringId: item.offeringId,
        professionalId: item.professionalId,
        startsAt: item.startsAt.toISOString(),
        endsAt: item.endsAt.toISOString(),
      })),
    }
  }
}

export const providerBookingDecisionRepository = new ProviderBookingDecisionRepository()
