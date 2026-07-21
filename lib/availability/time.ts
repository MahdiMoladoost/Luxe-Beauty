export type TimeInterval = { startsAt: Date; endsAt: Date }
export type WeeklyRule = {
  dayOfWeek: number
  startMinute: number
  endMinute: number
  timezone: string
}
export type CalendarException = TimeInterval & { kind: "CLOSED" | "AVAILABLE" }

export class AvailabilityPolicyError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message)
    this.name = "AvailabilityPolicyError"
  }
}

const formatterCache = new Map<string, Intl.DateTimeFormat>()

function formatter(timeZone: string): Intl.DateTimeFormat {
  const existing = formatterCache.get(timeZone)
  if (existing) return existing
  const created = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  })
  formatterCache.set(timeZone, created)
  return created
}

function zonedParts(date: Date, timeZone: string) {
  const values = Object.fromEntries(
    formatter(timeZone)
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  ) as Record<string, number>
  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute,
    second: values.second,
  }
}

function timeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = zonedParts(date, timeZone)
  const representedAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  )
  return representedAsUtc - date.getTime()
}

export function localDateTimeToUtc(
  input: { year: number; month: number; day: number; hour: number; minute: number },
  timeZone: string,
): Date {
  const localAsUtc = Date.UTC(input.year, input.month - 1, input.day, input.hour, input.minute, 0, 0)
  let candidate = localAsUtc
  for (let iteration = 0; iteration < 3; iteration += 1) {
    candidate = localAsUtc - timeZoneOffsetMs(new Date(candidate), timeZone)
  }
  return new Date(candidate)
}

function localCalendarDate(date: Date, timeZone: string) {
  const parts = zonedParts(date, timeZone)
  return { year: parts.year, month: parts.month, day: parts.day }
}

function dateKey(input: { year: number; month: number; day: number }): string {
  return `${input.year.toString().padStart(4, "0")}-${input.month.toString().padStart(2, "0")}-${input.day
    .toString()
    .padStart(2, "0")}`
}

function compareCalendarDate(
  left: { year: number; month: number; day: number },
  right: { year: number; month: number; day: number },
): number {
  return dateKey(left).localeCompare(dateKey(right))
}

function nextCalendarDate(input: { year: number; month: number; day: number }) {
  const next = new Date(Date.UTC(input.year, input.month - 1, input.day + 1))
  return { year: next.getUTCFullYear(), month: next.getUTCMonth() + 1, day: next.getUTCDate() }
}

function dayOfWeek(input: { year: number; month: number; day: number }): number {
  return new Date(Date.UTC(input.year, input.month - 1, input.day)).getUTCDay()
}

function minuteParts(minuteOfDay: number) {
  return { hour: Math.floor(minuteOfDay / 60), minute: minuteOfDay % 60 }
}

export function mergeIntervals(intervals: TimeInterval[]): TimeInterval[] {
  const sorted = intervals
    .filter((interval) => interval.startsAt < interval.endsAt)
    .sort((left, right) => left.startsAt.getTime() - right.startsAt.getTime())
  const merged: TimeInterval[] = []
  for (const interval of sorted) {
    const previous = merged.at(-1)
    if (!previous || interval.startsAt > previous.endsAt) {
      merged.push({ startsAt: new Date(interval.startsAt), endsAt: new Date(interval.endsAt) })
      continue
    }
    if (interval.endsAt > previous.endsAt) previous.endsAt = new Date(interval.endsAt)
  }
  return merged
}

export function subtractIntervals(base: TimeInterval[], blocks: TimeInterval[]): TimeInterval[] {
  let result = mergeIntervals(base)
  for (const block of mergeIntervals(blocks)) {
    result = result.flatMap((interval) => {
      if (block.endsAt <= interval.startsAt || block.startsAt >= interval.endsAt) return [interval]
      const remaining: TimeInterval[] = []
      if (block.startsAt > interval.startsAt) {
        remaining.push({ startsAt: interval.startsAt, endsAt: block.startsAt })
      }
      if (block.endsAt < interval.endsAt) {
        remaining.push({ startsAt: block.endsAt, endsAt: interval.endsAt })
      }
      return remaining
    })
  }
  return result
}

export function scheduleWindows(
  rules: WeeklyRule[],
  exceptions: CalendarException[],
  range: TimeInterval,
): TimeInterval[] {
  if (!(range.startsAt < range.endsAt)) {
    throw new AvailabilityPolicyError("INVALID_RANGE", "Availability range must have a positive duration")
  }
  if (range.endsAt.getTime() - range.startsAt.getTime() > 31 * 24 * 60 * 60 * 1000) {
    throw new AvailabilityPolicyError("RANGE_TOO_LARGE", "Availability range cannot exceed 31 days")
  }

  const timeZones = [...new Set(rules.map((rule) => rule.timezone))]
  if (timeZones.length > 1) {
    throw new AvailabilityPolicyError("MIXED_TIMEZONES", "One schedule owner cannot use multiple timezones")
  }
  const timeZone = timeZones[0] ?? "Asia/Tehran"
  let current = localCalendarDate(range.startsAt, timeZone)
  const finalDate = localCalendarDate(new Date(range.endsAt.getTime() - 1), timeZone)
  const base: TimeInterval[] = []

  while (compareCalendarDate(current, finalDate) <= 0) {
    const weekday = dayOfWeek(current)
    for (const rule of rules.filter((candidate) => candidate.dayOfWeek === weekday)) {
      const start = minuteParts(rule.startMinute)
      const end = minuteParts(rule.endMinute)
      const startsAt = localDateTimeToUtc({ ...current, ...start }, rule.timezone)
      const endCalendar = rule.endMinute === 1440 ? nextCalendarDate(current) : current
      const endsAt = localDateTimeToUtc(
        {
          ...endCalendar,
          hour: rule.endMinute === 1440 ? 0 : end.hour,
          minute: rule.endMinute === 1440 ? 0 : end.minute,
        },
        rule.timezone,
      )
      const clipped = {
        startsAt: startsAt < range.startsAt ? range.startsAt : startsAt,
        endsAt: endsAt > range.endsAt ? range.endsAt : endsAt,
      }
      if (clipped.startsAt < clipped.endsAt) base.push(clipped)
    }
    current = nextCalendarDate(current)
  }

  const availableExceptions = exceptions
    .filter((exception) => exception.kind === "AVAILABLE")
    .map(({ startsAt, endsAt }) => ({ startsAt, endsAt }))
  const closedExceptions = exceptions
    .filter((exception) => exception.kind === "CLOSED")
    .map(({ startsAt, endsAt }) => ({ startsAt, endsAt }))

  return subtractIntervals(mergeIntervals([...base, ...availableExceptions]), closedExceptions)
}

export function generateSlots(input: {
  windows: TimeInterval[]
  occupied: TimeInterval[]
  durationMinute: number
  stepMinute: number
  notBefore?: Date
  limit: number
}): TimeInterval[] {
  if (!Number.isSafeInteger(input.durationMinute) || input.durationMinute < 5 || input.durationMinute > 1440) {
    throw new AvailabilityPolicyError("INVALID_DURATION", "Slot duration is outside the supported range")
  }
  if (!Number.isSafeInteger(input.stepMinute) || input.stepMinute < 5 || input.stepMinute > 120) {
    throw new AvailabilityPolicyError("INVALID_STEP", "Slot step is outside the supported range")
  }
  if (!Number.isSafeInteger(input.limit) || input.limit < 1 || input.limit > 200) {
    throw new AvailabilityPolicyError("INVALID_LIMIT", "Slot limit is outside the supported range")
  }

  const free = subtractIntervals(input.windows, input.occupied)
  const durationMs = input.durationMinute * 60_000
  const stepMs = input.stepMinute * 60_000
  const slots: TimeInterval[] = []
  for (const window of free) {
    let cursor = window.startsAt.getTime()
    if (input.notBefore && cursor < input.notBefore.getTime()) {
      const delta = input.notBefore.getTime() - cursor
      cursor += Math.ceil(delta / stepMs) * stepMs
    }
    while (cursor + durationMs <= window.endsAt.getTime()) {
      slots.push({ startsAt: new Date(cursor), endsAt: new Date(cursor + durationMs) })
      if (slots.length >= input.limit) return slots
      cursor += stepMs
    }
  }
  return slots
}
