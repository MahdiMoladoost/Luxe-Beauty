import { z } from "zod"

import { AuthError } from "@/lib/auth/errors"
import type { RequestContext, SessionPrincipal } from "@/lib/auth/types"
import { availabilityRepository } from "@/lib/availability/repository"
import {
  AvailabilityPolicyError,
  generateSlots,
  scheduleWindows,
} from "@/lib/availability/time"
import { catalogRepository } from "@/lib/catalog/repository"
import { normalizePersianText } from "@/lib/localization/normalize-fa"

const ownerTypeSchema = z.enum(["PROFESSIONAL", "BRANCH"])
const weeklyRuleSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startMinute: z.number().int().min(0).max(1439),
  endMinute: z.number().int().min(1).max(1440),
  timezone: z.literal("Asia/Tehran").default("Asia/Tehran"),
  active: z.boolean().default(true),
}).refine((value) => value.startMinute < value.endMinute, {
  message: "Schedule start must be before end.",
})

const replaceScheduleSchema = z.object({
  ownerType: ownerTypeSchema,
  ownerId: z.string().uuid(),
  expectedUpdatedAt: z.string().datetime({ offset: true }).nullable(),
  rules: z.array(weeklyRuleSchema).max(50),
})

const scheduleIdentitySchema = z.object({
  ownerType: ownerTypeSchema,
  ownerId: z.string().uuid(),
})

const exceptionSchema = scheduleIdentitySchema.extend({
  kind: z.enum(["CLOSED", "AVAILABLE"]),
  startsAt: z.string().datetime({ offset: true }),
  endsAt: z.string().datetime({ offset: true }),
  reason: z.string().trim().min(3).max(500).nullable().optional(),
})

const previewSchema = z.object({
  from: z.string().datetime({ offset: true }),
  to: z.string().datetime({ offset: true }),
  stepMinute: z.number().int().min(5).max(120).default(15),
  limit: z.number().int().min(1).max(200).default(60),
})

function scheduleError(kind: string): never {
  switch (kind) {
    case "OWNER_NOT_FOUND":
      throw new AuthError("SCHEDULE_OWNER_NOT_FOUND", "تقویم قابل مدیریت یافت نشد.", 404)
    case "VERSION_CONFLICT":
      throw new AuthError(
        "VERSION_CONFLICT",
        "برنامه زمانی هم‌زمان تغییر کرده است. نسخه جدید را دریافت و دوباره تلاش کنید.",
        409,
      )
    case "EXCEPTION_NOT_FOUND":
      throw new AuthError("SCHEDULE_EXCEPTION_NOT_FOUND", "استثنای برنامه زمانی یافت نشد.", 404)
    default:
      throw new AuthError("SCHEDULE_OPERATION_FAILED", "عملیات برنامه زمانی انجام نشد.", 400)
  }
}

function assertNonOverlappingRules(rules: Array<z.infer<typeof weeklyRuleSchema>>): void {
  const active = rules.filter((rule) => rule.active)
  for (let day = 0; day <= 6; day += 1) {
    const dayRules = active
      .filter((rule) => rule.dayOfWeek === day)
      .sort((left, right) => left.startMinute - right.startMinute)
    for (let index = 1; index < dayRules.length; index += 1) {
      if (dayRules[index].startMinute < dayRules[index - 1].endMinute) {
        throw new AuthError(
          "SCHEDULE_RULE_OVERLAP",
          "بازه‌های برنامه هفتگی در یک روز نباید هم‌پوشانی داشته باشند.",
          409,
        )
      }
    }
  }
}

function scheduleDto(schedule: NonNullable<Awaited<ReturnType<typeof availabilityRepository.listOwnedSchedule>>>) {
  return {
    updatedAt: schedule.updatedAt,
    rules: schedule.rules.map((rule) => ({
      id: rule.id,
      ownerType: rule.ownerType,
      ownerId: rule.ownerId,
      dayOfWeek: rule.dayOfWeek,
      startMinute: rule.startMinute,
      endMinute: rule.endMinute,
      timezone: rule.timezone,
      active: rule.active,
      version: rule.version,
      updatedAt: rule.updatedAt,
    })),
    exceptions: schedule.exceptions.map((exception) => ({
      id: exception.id,
      kind: exception.kind,
      startsAt: exception.startsAt,
      endsAt: exception.endsAt,
      reason: exception.reason,
      createdAt: exception.createdAt,
    })),
  }
}

export async function getOwnedSchedule(
  principal: SessionPrincipal,
  rawIdentity: unknown,
) {
  const identity = scheduleIdentitySchema.parse(rawIdentity)
  const schedule = await availabilityRepository.listOwnedSchedule(
    principal,
    identity.ownerType,
    identity.ownerId,
  )
  if (!schedule) scheduleError("OWNER_NOT_FOUND")
  return scheduleDto(schedule)
}

export async function replaceOwnedSchedule(
  principal: SessionPrincipal,
  rawInput: unknown,
  context: RequestContext,
) {
  const input = replaceScheduleSchema.parse(rawInput)
  assertNonOverlappingRules(input.rules)
  const result = await availabilityRepository.replaceWeeklyRules({
    principal,
    ownerType: input.ownerType,
    ownerId: input.ownerId,
    expectedUpdatedAt: input.expectedUpdatedAt ? new Date(input.expectedUpdatedAt) : null,
    rules: input.rules,
    context,
  })
  if (result.kind !== "UPDATED") scheduleError(result.kind)
  return {
    updatedAt: result.updatedAt,
    rules: result.rules.map((rule) => ({
      id: rule.id,
      dayOfWeek: rule.dayOfWeek,
      startMinute: rule.startMinute,
      endMinute: rule.endMinute,
      timezone: rule.timezone,
      active: rule.active,
      version: rule.version,
      updatedAt: rule.updatedAt,
    })),
  }
}

export async function createOwnedScheduleException(
  principal: SessionPrincipal,
  rawInput: unknown,
  context: RequestContext,
) {
  const input = exceptionSchema.parse(rawInput)
  const startsAt = new Date(input.startsAt)
  const endsAt = new Date(input.endsAt)
  if (!(startsAt < endsAt)) {
    throw new AuthError("INVALID_SCHEDULE_RANGE", "شروع استثنا باید پیش از پایان آن باشد.", 409)
  }
  if (endsAt.getTime() - startsAt.getTime() > 31 * 24 * 60 * 60 * 1000) {
    throw new AuthError("SCHEDULE_EXCEPTION_TOO_LONG", "هر استثنا حداکثر می‌تواند ۳۱ روز باشد.", 409)
  }
  const result = await availabilityRepository.createException({
    principal,
    ownerType: input.ownerType,
    ownerId: input.ownerId,
    kind: input.kind,
    startsAt,
    endsAt,
    reason: input.reason ? normalizePersianText(input.reason) : null,
    context,
  })
  if (result.kind !== "CREATED") scheduleError(result.kind)
  return {
    id: result.exception.id,
    ownerType: result.exception.ownerType,
    ownerId: result.exception.ownerId,
    kind: result.exception.kind,
    startsAt: result.exception.startsAt,
    endsAt: result.exception.endsAt,
    reason: result.exception.reason,
    createdAt: result.exception.createdAt,
  }
}

export async function deleteOwnedScheduleException(
  principal: SessionPrincipal,
  exceptionId: string,
  context: RequestContext,
) {
  const result = await availabilityRepository.deleteException({
    principal,
    exceptionId: z.string().uuid().parse(exceptionId),
    context,
  })
  if (result.kind !== "DELETED") scheduleError(result.kind)
  return result
}

export async function previewOfferingAvailability(offeringId: string, rawInput: unknown) {
  const input = previewSchema.parse(rawInput)
  const offering = await catalogRepository.publicOffering(z.string().uuid().parse(offeringId))
  if (!offering) throw new AuthError("OFFERING_NOT_FOUND", "خدمت فعال و قابل رزرو یافت نشد.", 404)

  const owner = offering.professionalId
    ? { ownerType: "PROFESSIONAL" as const, ownerId: offering.professionalId }
    : offering.branchId
      ? { ownerType: "BRANCH" as const, ownerId: offering.branchId }
      : null
  if (!owner) {
    throw new AuthError(
      "AVAILABILITY_OWNER_REQUIRED",
      "برای نمایش زمان خالی، خدمت باید به متخصص یا شعبه متصل باشد.",
      409,
    )
  }

  const startsAt = new Date(input.from)
  const endsAt = new Date(input.to)
  const durationMinute =
    offering.baseDurationMinute +
    offering.preparationMinute +
    offering.cleanupMinute +
    offering.bufferBeforeMinute +
    offering.bufferAfterMinute

  try {
    const calendar = await availabilityRepository.calendarData({
      ownerType: owner.ownerType,
      ownerId: owner.ownerId,
      startsAt,
      endsAt,
    })
    const windows = scheduleWindows(
      calendar.rules.map((rule) => ({
        dayOfWeek: rule.dayOfWeek,
        startMinute: rule.startMinute,
        endMinute: rule.endMinute,
        timezone: rule.timezone,
      })),
      calendar.exceptions.map((exception) => ({
        kind: exception.kind,
        startsAt: exception.startsAt,
        endsAt: exception.endsAt,
      })),
      { startsAt, endsAt },
    )
    const slots = generateSlots({
      windows,
      occupied: calendar.occupied.map((item) => ({
        startsAt: item.occupiedFrom,
        endsAt: item.occupiedUntil,
      })),
      durationMinute,
      stepMinute: input.stepMinute,
      notBefore: new Date(),
      limit: input.limit,
    })
    return {
      offeringId: offering.id,
      ownerType: owner.ownerType,
      ownerId: owner.ownerId,
      timezone: calendar.rules[0]?.timezone ?? "Asia/Tehran",
      durationMinute,
      range: { startsAt, endsAt },
      slots: slots.map((slot) => ({ startsAt: slot.startsAt, endsAt: slot.endsAt })),
      generatedAt: new Date(),
    }
  } catch (error) {
    if (error instanceof AvailabilityPolicyError) {
      throw new AuthError(error.code, "بازه یا تنظیمات زمان‌بندی معتبر نیست.", 409, {
        reason: error.message,
      })
    }
    throw error
  }
}
