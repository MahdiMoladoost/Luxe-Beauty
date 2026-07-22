import { Prisma, type PrismaClient } from "@prisma/client"

import type { RequestContext, SessionPrincipal } from "@/lib/auth/types"
import {
  bookingDecision,
  parseBookingConversionSnapshot,
  validateRecipientAndQuestionnaire,
} from "@/lib/booking/conversion-policy"
import { prisma } from "@/lib/infrastructure/prisma"

const bookingInclude = {
  items: true,
  transitions: { orderBy: { createdAt: "asc" as const } },
  recipient: true,
} satisfies Prisma.BookingInclude

type BookingWithDetails = Prisma.BookingGetPayload<{ include: typeof bookingInclude }>

export type BookingConversionRepositoryResult =
  | { kind: "CREATED"; booking: BookingWithDetails }
  | { kind: "REPLAY"; booking: BookingWithDetails }
  | {
      kind:
        | "IDEMPOTENCY_CONFLICT"
        | "IDEMPOTENCY_IN_PROGRESS"
        | "HOLD_NOT_FOUND"
        | "HOLD_EXPIRED"
        | "HOLD_NOT_ACTIVE"
        | "HOLD_ALREADY_CONSUMED"
        | "RECIPIENT_NOT_FOUND"
        | "QUOTE_NOT_FOUND"
        | "QUOTE_STALE"
        | "OFFERING_NOT_AVAILABLE"
    }

export class BookingConversionRepository {
  constructor(private readonly database: PrismaClient = prisma) {}

  private transaction<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.database.$transaction(operation, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 10_000,
      timeout: 20_000,
    })
  }

  async createOrReplay(input: {
    principal: SessionPrincipal
    holdId: string
    recipientId: string
    idempotencyKey: string
    requestHash: string
    legalAcceptance: {
      termsVersion: string
      privacyVersion: string
      bookingVersion: string
    }
    questionnaireAnswers: Record<string, unknown> | null
    now: Date
    context: RequestContext
  }): Promise<BookingConversionRepositoryResult> {
    return this.transaction(async (tx) => {
      const idempotencyScope = `booking:create:${input.principal.userId}`
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
              customerUserId: input.principal.userId,
            },
            include: bookingInclude,
          })
          if (booking) return { kind: "REPLAY", booking }
        }
        return { kind: "IDEMPOTENCY_IN_PROGRESS" }
      }

      await this.advisoryLock(tx, `booking-hold:${input.holdId}`)
      const hold = await tx.bookingHold.findUnique({ where: { id: input.holdId } })
      if (!hold || hold.customerUserId !== input.principal.userId) {
        return { kind: "HOLD_NOT_FOUND" }
      }
      if (hold.status === "CONSUMED") return { kind: "HOLD_ALREADY_CONSUMED" }
      if (hold.status !== "ACTIVE") return { kind: "HOLD_NOT_ACTIVE" }
      if (hold.expiresAt <= input.now) {
        const expired = await tx.bookingHold.update({
          where: { id: hold.id },
          data: { status: "EXPIRED" },
        })
        await tx.auditLog.create({
          data: {
            actorUserId: input.principal.userId,
            action: "booking.hold.expired-before-conversion",
            resourceType: "BookingHold",
            resourceId: hold.id,
            scopeType: "PROVIDER",
            scopeId: hold.providerId,
            correlationId: input.context.correlationId,
          },
        })
        await tx.outboxEvent.create({
          data: {
            aggregateType: "BookingHold",
            aggregateId: hold.id,
            eventType: "booking.hold.expired",
            dedupeKey: `booking-hold-expired:${hold.id}`,
            payload: {
              id: expired.id,
              status: expired.status,
              expiredAt: input.now.toISOString(),
            } as Prisma.InputJsonValue,
          },
        })
        return { kind: "HOLD_EXPIRED" }
      }

      const snapshot = parseBookingConversionSnapshot(hold.snapshot)
      if (
        snapshot.quoteId !== hold.quoteId ||
        snapshot.offeringVersion !== snapshot.quoteSnapshot.offering.version ||
        snapshot.quoteSnapshot.offering.id !== hold.offeringId ||
        snapshot.quoteSnapshot.offering.providerId !== hold.providerId ||
        snapshot.quoteSnapshot.offering.branchId !== hold.branchId ||
        snapshot.quoteSnapshot.offering.professionalId !== hold.professionalId ||
        snapshot.resourceType !== hold.resourceType ||
        snapshot.resourceId !== hold.resourceId ||
        snapshot.occupiedFrom !== hold.occupiedFrom.toISOString() ||
        snapshot.occupiedUntil !== hold.occupiedUntil.toISOString()
      ) {
        return { kind: "QUOTE_STALE" }
      }

      const recipient = await tx.serviceRecipient.findFirst({
        where: {
          id: input.recipientId,
          customerUserId: input.principal.userId,
          deletedAt: null,
        },
      })
      if (!recipient) return { kind: "RECIPIENT_NOT_FOUND" }

      const quote = await tx.serviceQuote.findUnique({ where: { id: hold.quoteId } })
      if (!quote) return { kind: "QUOTE_NOT_FOUND" }
      if (
        quote.expiresAt < hold.expiresAt ||
        quote.expiresAt <= input.now ||
        snapshot.quoteExpiresAt !== quote.expiresAt.toISOString() ||
        snapshot.quoteSnapshot.expiresAt !== quote.expiresAt.toISOString() ||
        (quote.customerUserId && quote.customerUserId !== input.principal.userId) ||
        quote.offeringId !== hold.offeringId ||
        quote.providerId !== hold.providerId ||
        quote.durationMinute !== snapshot.quoteSnapshot.calculation.durationMinute ||
        quote.quantity !== snapshot.quoteSnapshot.calculation.quantity ||
        quote.unitPriceToman.toString() !== snapshot.quoteSnapshot.calculation.unitPriceToman ||
        quote.totalToman.toString() !== snapshot.quoteSnapshot.calculation.totalToman
      ) {
        return { kind: "QUOTE_STALE" }
      }

      const offering = await tx.serviceOffering.findFirst({
        where: {
          id: hold.offeringId,
          providerId: hold.providerId,
          branchId: hold.branchId,
          professionalId: hold.professionalId,
          version: snapshot.offeringVersion,
          active: true,
          published: true,
          deletedAt: null,
          standardService: { active: true },
          provider: { status: "APPROVED", bookingEnabled: true, deletedAt: null },
          AND: [
            { OR: [{ branchId: null }, { branch: { active: true, deletedAt: null } }] },
            { OR: [{ professionalId: null }, { professional: { active: true, verified: true } }] },
          ],
        },
        include: {
          provider: { select: { ownerUserId: true } },
          professional: { select: { userId: true } },
        },
      })
      if (!offering) return { kind: "OFFERING_NOT_AVAILABLE" }

      if (
        offering.professionalId &&
        offering.professional &&
        offering.professional.userId !== offering.provider.ownerUserId
      ) {
        const affiliation = await tx.professionalAffiliation.findFirst({
          where: {
            professionalId: offering.professionalId,
            organizationId: offering.providerId,
            status: "ACTIVE",
            OR: offering.branchId
              ? [{ branchId: null }, { branchId: offering.branchId }]
              : [{ branchId: null }, { branchId: { not: null } }],
          },
          select: { id: true },
        })
        if (!affiliation) return { kind: "OFFERING_NOT_AVAILABLE" }
      }

      await this.advisoryLock(tx, `booking-resource:${hold.resourceType}:${hold.resourceId}`)

      const eligibility = validateRecipientAndQuestionnaire({
        recipient,
        audienceRulesValue: snapshot.quoteSnapshot.audienceRules,
        bookingPolicyValue: snapshot.quoteSnapshot.bookingPolicy,
        questionnaireAnswers: input.questionnaireAnswers,
        appointmentStartsAt: hold.startsAt,
      })
      const decision = bookingDecision({
        bookingPolicyValue: snapshot.quoteSnapshot.bookingPolicy,
        startsAt: hold.startsAt,
        now: input.now,
      })

      await tx.idempotencyRecord.create({
        data: {
          scope: idempotencyScope,
          key: input.idempotencyKey,
          requestHash: input.requestHash,
          expiresAt: new Date(input.now.getTime() + 24 * 60 * 60 * 1000),
        },
      })

      const priceSnapshot = {
        schemaVersion: 1,
        source: "SERVICE_QUOTE",
        holdId: hold.id,
        quoteId: quote.id,
        quoteExpiresAt: quote.expiresAt.toISOString(),
        offering: snapshot.quoteSnapshot.offering,
        calculation: snapshot.quoteSnapshot.calculation,
        pricingRules: snapshot.quoteSnapshot.pricingRules ?? null,
      } as Prisma.InputJsonValue
      const policySnapshot = {
        schemaVersion: 1,
        bookingPolicy: eligibility.bookingPolicy,
        audienceRules: eligibility.audienceRules,
        recipientAgeAtAppointment: eligibility.recipientAgeAtAppointment,
        decision: {
          status: decision.finalStatus,
          approvalDeadlineAt: decision.approvalDeadlineAt?.toISOString() ?? null,
        },
      } as Prisma.InputJsonValue
      const questionnaireSnapshot = input.questionnaireAnswers
        ? ({ schemaVersion: 1, answers: input.questionnaireAnswers } as Prisma.InputJsonValue)
        : Prisma.JsonNull
      const legalAcceptanceSnapshot = {
        schemaVersion: 1,
        acceptedAt: input.now.toISOString(),
        acceptedByUserId: input.principal.userId,
        termsVersion: input.legalAcceptance.termsVersion,
        privacyVersion: input.legalAcceptance.privacyVersion,
        bookingVersion: input.legalAcceptance.bookingVersion,
      } as Prisma.InputJsonValue

      const booking = await tx.booking.create({
        data: {
          customerUserId: input.principal.userId,
          recipientId: recipient.id,
          providerId: hold.providerId,
          branchId: hold.branchId,
          status: "HOLDING_SLOT",
          currency: "TOMAN",
          subtotalToman: quote.totalToman,
          discountToman: 0n,
          travelFeeToman: 0n,
          platformFeeToman: 0n,
          totalToman: quote.totalToman,
          priceSnapshot,
          policySnapshot,
          questionnaireSnapshot,
          legalAcceptanceSnapshot,
          idempotencyKey: `booking:${input.requestHash}`,
          approvalDeadlineAt: decision.approvalDeadlineAt,
          version: 1,
        },
      })

      await tx.bookingItem.create({
        data: {
          bookingId: booking.id,
          offeringId: hold.offeringId,
          professionalId: hold.professionalId,
          startsAt: hold.startsAt,
          endsAt: hold.endsAt,
          occupiedFrom: hold.occupiedFrom,
          occupiedUntil: hold.occupiedUntil,
          travelBeforeMinute: 0,
          travelAfterMinute: 0,
          unitPriceToman: quote.unitPriceToman,
          quantity: quote.quantity,
          priceSnapshot,
          durationSnapshot: {
            schemaVersion: 1,
            durationMinute: quote.durationMinute,
            formula: snapshot.quoteSnapshot.durationFormula,
            serviceStartsAt: hold.startsAt.toISOString(),
            serviceEndsAt: hold.endsAt.toISOString(),
            occupiedFrom: hold.occupiedFrom.toISOString(),
            occupiedUntil: hold.occupiedUntil.toISOString(),
          } as Prisma.InputJsonValue,
        },
      })

      await tx.bookingTransition.createMany({
        data: [
          {
            bookingId: booking.id,
            fromStatus: null,
            toStatus: "HOLDING_SLOT",
            actorUserId: input.principal.userId,
            reasonCode: "HOLD_CONSUMED",
            correlationId: input.context.correlationId,
            metadata: { holdId: hold.id } as Prisma.InputJsonValue,
          },
          {
            bookingId: booking.id,
            fromStatus: "HOLDING_SLOT",
            toStatus: decision.finalStatus,
            actorUserId: input.principal.userId,
            reasonCode:
              decision.finalStatus === "CONFIRMED"
                ? "INSTANT_APPROVAL_POLICY"
                : "MANUAL_APPROVAL_POLICY",
            correlationId: input.context.correlationId,
            metadata: {
              approvalDeadlineAt: decision.approvalDeadlineAt?.toISOString() ?? null,
            } as Prisma.InputJsonValue,
          },
        ],
      })

      await tx.booking.update({
        where: { id: booking.id },
        data: { status: decision.finalStatus },
      })
      await tx.bookingHold.update({
        where: { id: hold.id },
        data: {
          status: "CONSUMED",
          consumedBookingId: booking.id,
        },
      })

      await tx.auditLog.create({
        data: {
          actorUserId: input.principal.userId,
          action: "booking.created-from-hold",
          resourceType: "Booking",
          resourceId: booking.id,
          scopeType: "PROVIDER",
          scopeId: hold.providerId,
          correlationId: input.context.correlationId,
          metadata: {
            holdId: hold.id,
            recipientId: recipient.id,
            offeringId: hold.offeringId,
            status: decision.finalStatus,
            startsAt: hold.startsAt.toISOString(),
            approvalDeadlineAt: decision.approvalDeadlineAt?.toISOString() ?? null,
          } as Prisma.InputJsonValue,
        },
      })

      const response = await tx.booking.findUniqueOrThrow({
        where: { id: booking.id },
        include: bookingInclude,
      })
      const responseSnapshot = this.responseSnapshot(response)
      await tx.idempotencyRecord.update({
        where: { scope_key: { scope: idempotencyScope, key: input.idempotencyKey } },
        data: {
          responseStatus: 201,
          responseBody: responseSnapshot as Prisma.InputJsonValue,
          resourceType: "Booking",
          resourceId: booking.id,
          completedAt: input.now,
        },
      })
      await tx.outboxEvent.create({
        data: {
          aggregateType: "Booking",
          aggregateId: booking.id,
          eventType:
            decision.finalStatus === "CONFIRMED"
              ? "booking.confirmed"
              : "booking.awaiting-provider-approval",
          dedupeKey: `booking-created:${booking.id}`,
          payload: responseSnapshot as Prisma.InputJsonValue,
        },
      })

      return { kind: "CREATED", booking: response }
    })
  }

  ownedBooking(customerUserId: string, bookingId: string) {
    return this.database.booking.findFirst({
      where: { id: bookingId, customerUserId },
      include: bookingInclude,
    })
  }

  private async advisoryLock(tx: Prisma.TransactionClient, key: string): Promise<void> {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))`
  }

  private responseSnapshot(booking: BookingWithDetails) {
    return {
      id: booking.id,
      recipientId: booking.recipientId,
      providerId: booking.providerId,
      branchId: booking.branchId,
      status: booking.status,
      currency: booking.currency,
      subtotalToman: booking.subtotalToman.toString(),
      discountToman: booking.discountToman.toString(),
      travelFeeToman: booking.travelFeeToman.toString(),
      platformFeeToman: booking.platformFeeToman.toString(),
      totalToman: booking.totalToman.toString(),
      approvalDeadlineAt: booking.approvalDeadlineAt?.toISOString() ?? null,
      version: booking.version,
      createdAt: booking.createdAt.toISOString(),
      items: booking.items.map((item) => ({
        id: item.id,
        offeringId: item.offeringId,
        professionalId: item.professionalId,
        startsAt: item.startsAt.toISOString(),
        endsAt: item.endsAt.toISOString(),
        occupiedFrom: item.occupiedFrom.toISOString(),
        occupiedUntil: item.occupiedUntil.toISOString(),
        unitPriceToman: item.unitPriceToman.toString(),
        quantity: item.quantity,
      })),
    }
  }
}

export const bookingConversionRepository = new BookingConversionRepository()
