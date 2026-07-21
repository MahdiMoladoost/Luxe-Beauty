import {
  Prisma,
  type BookingStatus,
  type PrismaClient,
  type ScheduleExceptionKind,
  type ScheduleOwnerType,
} from "@prisma/client"

import type { RequestContext, SessionPrincipal } from "@/lib/auth/types"
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

export class AvailabilityRepository {
  constructor(private readonly database: PrismaClient = prisma) {}

  transaction<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.database.$transaction(operation, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    })
  }

  async listOwnedSchedule(principal: SessionPrincipal, ownerType: ScheduleOwnerType, ownerId: string) {
    const authorized = await this.authorizeOwner(this.database, principal.userId, ownerType, ownerId)
    if (!authorized) return null
    const [rules, exceptions] = await Promise.all([
      this.database.weeklyScheduleRule.findMany({
        where: { ownerType, ownerId },
        orderBy: [{ dayOfWeek: "asc" }, { startMinute: "asc" }],
      }),
      this.database.scheduleException.findMany({
        where: { ownerType, ownerId, endsAt: { gt: new Date() } },
        orderBy: { startsAt: "asc" },
        take: 200,
      }),
    ])
    const latest = rules.reduce<Date | null>(
      (value, rule) => (!value || rule.updatedAt > value ? rule.updatedAt : value),
      null,
    )
    return { rules, exceptions, updatedAt: latest }
  }

  async replaceWeeklyRules(input: {
    principal: SessionPrincipal
    ownerType: ScheduleOwnerType
    ownerId: string
    expectedUpdatedAt: Date | null
    rules: Array<{
      dayOfWeek: number
      startMinute: number
      endMinute: number
      timezone: string
      active: boolean
    }>
    context: RequestContext
  }) {
    return this.transaction(async (tx) => {
      const authorized = await this.authorizeOwner(tx, input.principal.userId, input.ownerType, input.ownerId)
      if (!authorized) return { kind: "OWNER_NOT_FOUND" as const }

      const latest = await tx.weeklyScheduleRule.findFirst({
        where: { ownerType: input.ownerType, ownerId: input.ownerId },
        orderBy: { updatedAt: "desc" },
        select: { updatedAt: true },
      })
      const currentTimestamp = latest?.updatedAt ?? null
      if (
        (currentTimestamp === null && input.expectedUpdatedAt !== null) ||
        (currentTimestamp !== null &&
          (input.expectedUpdatedAt === null || currentTimestamp.getTime() !== input.expectedUpdatedAt.getTime()))
      ) {
        return { kind: "VERSION_CONFLICT" as const }
      }

      await tx.weeklyScheduleRule.deleteMany({
        where: { ownerType: input.ownerType, ownerId: input.ownerId },
      })
      if (input.rules.length > 0) {
        await tx.weeklyScheduleRule.createMany({
          data: input.rules.map((rule) => ({
            ownerType: input.ownerType,
            ownerId: input.ownerId,
            dayOfWeek: rule.dayOfWeek,
            startMinute: rule.startMinute,
            endMinute: rule.endMinute,
            timezone: rule.timezone,
            active: rule.active,
            version: 1,
          })),
        })
      }
      const rules = await tx.weeklyScheduleRule.findMany({
        where: { ownerType: input.ownerType, ownerId: input.ownerId },
        orderBy: [{ dayOfWeek: "asc" }, { startMinute: "asc" }],
      })
      await tx.auditLog.create({
        data: {
          actorUserId: input.principal.userId,
          action: "availability.weekly-schedule.replaced",
          resourceType: "WeeklyScheduleRule",
          resourceId: input.ownerId,
          scopeType: input.ownerType,
          scopeId: input.ownerId,
          correlationId: input.context.correlationId,
          metadata: {
            ruleCount: rules.length,
            previousUpdatedAt: currentTimestamp?.toISOString() ?? null,
          } as Prisma.InputJsonValue,
        },
      })
      const updatedAt = rules.reduce<Date | null>(
        (value, rule) => (!value || rule.updatedAt > value ? rule.updatedAt : value),
        null,
      )
      return { kind: "UPDATED" as const, rules, updatedAt }
    })
  }

  async createException(input: {
    principal: SessionPrincipal
    ownerType: ScheduleOwnerType
    ownerId: string
    kind: ScheduleExceptionKind
    startsAt: Date
    endsAt: Date
    reason?: string | null
    context: RequestContext
  }) {
    return this.transaction(async (tx) => {
      const authorized = await this.authorizeOwner(tx, input.principal.userId, input.ownerType, input.ownerId)
      if (!authorized) return { kind: "OWNER_NOT_FOUND" as const }
      const exception = await tx.scheduleException.create({
        data: {
          ownerType: input.ownerType,
          ownerId: input.ownerId,
          kind: input.kind,
          startsAt: input.startsAt,
          endsAt: input.endsAt,
          reason: input.reason ?? null,
          createdBy: input.principal.userId,
        },
      })
      await tx.auditLog.create({
        data: {
          actorUserId: input.principal.userId,
          action: "availability.exception.created",
          resourceType: "ScheduleException",
          resourceId: exception.id,
          scopeType: input.ownerType,
          scopeId: input.ownerId,
          correlationId: input.context.correlationId,
          reason: input.reason ?? null,
          metadata: {
            kind: input.kind,
            startsAt: input.startsAt.toISOString(),
            endsAt: input.endsAt.toISOString(),
          } as Prisma.InputJsonValue,
        },
      })
      return { kind: "CREATED" as const, exception }
    })
  }

  async deleteException(input: {
    principal: SessionPrincipal
    exceptionId: string
    context: RequestContext
  }) {
    return this.transaction(async (tx) => {
      const exception = await tx.scheduleException.findUnique({ where: { id: input.exceptionId } })
      if (!exception) return { kind: "EXCEPTION_NOT_FOUND" as const }
      const authorized = await this.authorizeOwner(
        tx,
        input.principal.userId,
        exception.ownerType,
        exception.ownerId,
      )
      if (!authorized) return { kind: "EXCEPTION_NOT_FOUND" as const }
      await tx.scheduleException.delete({ where: { id: exception.id } })
      await tx.auditLog.create({
        data: {
          actorUserId: input.principal.userId,
          action: "availability.exception.deleted",
          resourceType: "ScheduleException",
          resourceId: exception.id,
          scopeType: exception.ownerType,
          scopeId: exception.ownerId,
          correlationId: input.context.correlationId,
          metadata: {
            kind: exception.kind,
            startsAt: exception.startsAt.toISOString(),
            endsAt: exception.endsAt.toISOString(),
          } as Prisma.InputJsonValue,
        },
      })
      return { kind: "DELETED" as const }
    })
  }

  async calendarData(input: {
    ownerType: ScheduleOwnerType
    ownerId: string
    startsAt: Date
    endsAt: Date
  }) {
    const [rules, exceptions, occupied] = await Promise.all([
      this.database.weeklyScheduleRule.findMany({
        where: {
          ownerType: input.ownerType,
          ownerId: input.ownerId,
          active: true,
        },
        orderBy: [{ dayOfWeek: "asc" }, { startMinute: "asc" }],
      }),
      this.database.scheduleException.findMany({
        where: {
          ownerType: input.ownerType,
          ownerId: input.ownerId,
          startsAt: { lt: input.endsAt },
          endsAt: { gt: input.startsAt },
        },
        orderBy: { startsAt: "asc" },
      }),
      input.ownerType === "PROFESSIONAL"
        ? this.database.bookingItem.findMany({
            where: {
              professionalId: input.ownerId,
              occupiedFrom: { lt: input.endsAt },
              occupiedUntil: { gt: input.startsAt },
              booking: { status: { in: BLOCKING_BOOKING_STATUSES } },
            },
            select: { occupiedFrom: true, occupiedUntil: true },
          })
        : this.database.bookingItem.findMany({
            where: {
              occupiedFrom: { lt: input.endsAt },
              occupiedUntil: { gt: input.startsAt },
              booking: {
                branchId: input.ownerId,
                status: { in: BLOCKING_BOOKING_STATUSES },
              },
            },
            select: { occupiedFrom: true, occupiedUntil: true },
          }),
    ])
    return { rules, exceptions, occupied }
  }

  private async authorizeOwner(
    db: PrismaClient | Prisma.TransactionClient,
    userId: string,
    ownerType: ScheduleOwnerType,
    ownerId: string,
  ): Promise<boolean> {
    if (ownerType === "PROFESSIONAL") {
      const profile = await db.professionalProfile.findFirst({
        where: { id: ownerId, userId, active: true, verified: true },
        select: { id: true },
      })
      return Boolean(profile)
    }
    const branch = await db.branch.findFirst({
      where: {
        id: ownerId,
        deletedAt: null,
        organization: { ownerUserId: userId, deletedAt: null },
      },
      select: { id: true },
    })
    return Boolean(branch)
  }
}

export const availabilityRepository = new AvailabilityRepository()
