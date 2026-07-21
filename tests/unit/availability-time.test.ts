import { describe, expect, it } from "vitest"

import {
  generateSlots,
  localDateTimeToUtc,
  mergeIntervals,
  scheduleWindows,
  subtractIntervals,
} from "@/lib/availability/time"

describe("availability interval engine", () => {
  it("converts Tehran local time without relying on browser locale", () => {
    const utc = localDateTimeToUtc(
      { year: 2026, month: 7, day: 20, hour: 9, minute: 0 },
      "Asia/Tehran",
    )
    expect(utc.toISOString()).toBe("2026-07-20T05:30:00.000Z")
  })

  it("combines weekly windows, exceptions and occupied intervals", () => {
    const range = {
      startsAt: new Date("2026-07-19T20:30:00.000Z"),
      endsAt: new Date("2026-07-20T20:30:00.000Z"),
    }
    const windows = scheduleWindows(
      [
        {
          dayOfWeek: 1,
          startMinute: 9 * 60,
          endMinute: 12 * 60,
          timezone: "Asia/Tehran",
        },
      ],
      [
        {
          kind: "CLOSED",
          startsAt: new Date("2026-07-20T06:30:00.000Z"),
          endsAt: new Date("2026-07-20T07:00:00.000Z"),
        },
      ],
      range,
    )

    const slots = generateSlots({
      windows,
      occupied: [
        {
          startsAt: new Date("2026-07-20T05:30:00.000Z"),
          endsAt: new Date("2026-07-20T06:30:00.000Z"),
        },
      ],
      durationMinute: 60,
      stepMinute: 30,
      limit: 20,
    })

    expect(slots.map((slot) => slot.startsAt.toISOString())).toEqual([
      "2026-07-20T07:00:00.000Z",
      "2026-07-20T07:30:00.000Z",
    ])
  })

  it("merges adjacent windows and subtracts blocking intervals", () => {
    const merged = mergeIntervals([
      {
        startsAt: new Date("2030-01-01T08:00:00.000Z"),
        endsAt: new Date("2030-01-01T09:00:00.000Z"),
      },
      {
        startsAt: new Date("2030-01-01T09:00:00.000Z"),
        endsAt: new Date("2030-01-01T10:00:00.000Z"),
      },
    ])
    const free = subtractIntervals(merged, [
      {
        startsAt: new Date("2030-01-01T08:30:00.000Z"),
        endsAt: new Date("2030-01-01T09:30:00.000Z"),
      },
    ])
    expect(free).toHaveLength(2)
    expect(free[0].endsAt.toISOString()).toBe("2030-01-01T08:30:00.000Z")
    expect(free[1].startsAt.toISOString()).toBe("2030-01-01T09:30:00.000Z")
  })
})
