import { randomInt, randomUUID } from "node:crypto"
import { afterEach, describe, expect, it } from "vitest"

import type { RequestContext, SessionPrincipal } from "@/lib/auth/types"
import { bookingConfig } from "@/lib/booking/config"
import { createBookingFromHold, getOwnedBooking } from "@/lib/booking/conversion-service"
import { createBookingHold } from "@/lib/booking/hold-service"
import { createOwnedBookingRecipient } from "@/lib/booking/recipient-service"
import {
  createCatalogCategory,
  createCatalogStandardService,
  createOwnedOffering,
  quotePublicOffering,
} from "@/lib/catalog/service"
import { prisma } from "@/lib/infrastructure/prisma"

const userIds = new Set<string>()
const providerIds = new Set<string>()
const branchIds = new Set<string>()
const offeringIds = new Set<string>()
const quoteIds = new Set<string>()
const categoryIds = new Set<string>()
const serviceIds = new Set<string>()
const cityIds = new Set<string>()
const provinceIds = new Set<string>()
const recipientIds = new Set<string>()
const holdIds = new Set<string>()
const bookingIds = new Set<string>()

function context(label: string): RequestContext {
  return {
    correlationId: `booking-conversion-${label}-${randomUUID()}`,
    ipAddress: "127.0.8.10",
    userAgent: "vitest-booking-conversion",
  }
}

async function principal(permissions: string[] = []): Promise<SessionPrincipal> {
  const mobile = `091${randomInt(10_000_000, 99_999_999)}`
  const user = await prisma.user.create({
    data: { mobileNormalized: mobile, status: "ACTIVE", identityStatus: "VERIFIED" },
  })
  userIds.add(user.id)
  return {
    sessionId: randomUUID(),
    userId: user.id,
    mobileNormalized: mobile,
    userStatus: "ACTIVE",
    identityStatus: "VERIFIED",
    authMethod: "OTP",
    twoFactorVerifiedAt: null,
    mustChangePassword: false,
    roleKeys: permissions.includes("content.manage") ? ["content_manager"] : ["customer"],
    permissions,
  }
}

function legalAcceptance() {
  return {
    termsVersion: bookingConfig.legalVersions.terms,
    privacyVersion: bookingConfig.legalVersions.privacy,
    bookingVersion: bookingConfig.legalVersions.booking,
  }
}

async function fixture(approval: "INSTANT" | "MANUAL" = "INSTANT") {
  const admin = await principal(["content.manage"])
  const owner = await principal(["provider.manage"])
  const customer = await principal()
  const otherCustomer = await principal()
  const suffix = randomUUID().slice(0, 8)

  const province = await prisma.province.create({
    data: {
      nameFa: `استان ${suffix}`,
      normalizedName: `booking-province-${suffix}`,
      slug: `booking-province-${suffix}`,
    },
  })
  provinceIds.add(province.id)
  const city = await prisma.city.create({
    data: {
      provinceId: province.id,
      nameFa: `شهر ${suffix}`,
      normalizedName: `booking-city-${suffix}`,
      slug: `booking-city-${suffix}`,
    },
  })
  cityIds.add(city.id)

  const provider = await prisma.providerOrganization.create({
    data: {
      ownerUserId: owner.userId,
      type: "SINGLE_SALON",
      status: "APPROVED",
      nameFa: "سالن تبدیل رزرو",
      normalizedName: `booking-provider-${suffix}`,
      slug: `booking-provider-${suffix}`,
      verificationAt: new Date(),
      bookingEnabled: true,
    },
  })
  providerIds.add(provider.id)
  const branch = await prisma.branch.create({
    data: {
      organizationId: provider.id,
      cityId: city.id,
      nameFa: "شعبه تبدیل رزرو",
      slug: `booking-branch-${suffix}`,
      active: true,
      addressVerified: true,
    },
  })
  branchIds.add(branch.id)

  const category = await createCatalogCategory(
    admin,
    { nameFa: "دسته تبدیل رزرو", slug: `booking-category-${suffix}` },
    context("category"),
  )
  categoryIds.add(category.id)
  const service = await createCatalogStandardService(
    admin,
    { categoryId: category.id, titleFa: "خدمت تبدیل رزرو", slug: `booking-service-${suffix}` },
    context("service"),
  )
  serviceIds.add(service.id)

  const offering = await createOwnedOffering(
    owner,
    provider.id,
    {
      branchId: branch.id,
      standardServiceId: service.id,
      titleFa: "خدمت قابل تبدیل",
      priceModel: "FIXED",
      priceMinToman: "550000",
      priceMaxToman: null,
      baseDurationMinute: 60,
      preparationMinute: 0,
      cleanupMinute: 0,
      bufferBeforeMinute: 0,
      bufferAfterMinute: 0,
      audienceRules: { audience: "WOMEN", minAge: 18, requiredQuestionnaireKeys: ["hairLength"] },
      bookingPolicy: { approval, approvalDeadlineMinute: 30 },
      active: true,
      published: true,
    },
    context("offering"),
  )
  if (!offering) throw new Error("Offering was not created")
  offeringIds.add(offering.id)

  const quote = await quotePublicOffering(customer, offering.id, { quantity: 1 })
  quoteIds.add(quote.id)
  const startsAt = new Date(Date.now() + 3 * 60 * 60 * 1000)
  startsAt.setUTCSeconds(0, 0)
  await prisma.scheduleException.create({
    data: {
      ownerType: "BRANCH",
      ownerId: branch.id,
      kind: "AVAILABLE",
      startsAt: new Date(startsAt.getTime() - 30 * 60 * 1000),
      endsAt: new Date(startsAt.getTime() + 3 * 60 * 60 * 1000),
      createdBy: owner.userId,
      reason: "بازه تست تبدیل رزرو",
    },
  })

  const recipient = await createOwnedBookingRecipient(
    customer,
    {
      firstName: "مریم",
      lastName: "آزمایشی",
      birthDate: "1994-02-10",
      genderCode: "FEMALE",
      relationLabel: "خودم",
    },
    context("recipient"),
  )
  if (!recipient) throw new Error("Recipient was not created")
  recipientIds.add(recipient.id)

  const hold = await createBookingHold(
    customer,
    { quoteId: quote.id, startsAt: startsAt.toISOString() },
    `hold-${randomUUID()}`,
    context("hold"),
  )
  holdIds.add(hold.hold.id)

  return { customer, otherCustomer, recipient, hold: hold.hold, startsAt }
}

afterEach(async () => {
  if (userIds.size > 0) {
    await prisma.idempotencyRecord.deleteMany({
      where: {
        OR: [...userIds].flatMap((id) => [
          { scope: `booking-hold:create:${id}` },
          { scope: `booking:create:${id}` },
        ]),
      },
    })
  }
  if (holdIds.size > 0 || bookingIds.size > 0) {
    await prisma.outboxEvent.deleteMany({
      where: {
        OR: [
          ...(holdIds.size > 0
            ? [{ aggregateType: "BookingHold", aggregateId: { in: [...holdIds] } }]
            : []),
          ...(bookingIds.size > 0
            ? [{ aggregateType: "Booking", aggregateId: { in: [...bookingIds] } }]
            : []),
        ],
      },
    })
  }
  if (holdIds.size > 0) await prisma.bookingHold.deleteMany({ where: { id: { in: [...holdIds] } } })
  if (bookingIds.size > 0) await prisma.booking.deleteMany({ where: { id: { in: [...bookingIds] } } })
  if (recipientIds.size > 0) {
    await prisma.serviceRecipient.deleteMany({ where: { id: { in: [...recipientIds] } } })
  }
  if (branchIds.size > 0) {
    await prisma.scheduleException.deleteMany({ where: { ownerId: { in: [...branchIds] } } })
    await prisma.weeklyScheduleRule.deleteMany({ where: { ownerId: { in: [...branchIds] } } })
  }
  if (quoteIds.size > 0) await prisma.serviceQuote.deleteMany({ where: { id: { in: [...quoteIds] } } })
  if (offeringIds.size > 0) await prisma.serviceOffering.deleteMany({ where: { id: { in: [...offeringIds] } } })
  if (serviceIds.size > 0) await prisma.standardService.deleteMany({ where: { id: { in: [...serviceIds] } } })
  if (categoryIds.size > 0) await prisma.serviceCategory.deleteMany({ where: { id: { in: [...categoryIds] } } })
  if (branchIds.size > 0) await prisma.branch.deleteMany({ where: { id: { in: [...branchIds] } } })
  if (providerIds.size > 0) await prisma.providerOrganization.deleteMany({ where: { id: { in: [...providerIds] } } })
  if (cityIds.size > 0) await prisma.city.deleteMany({ where: { id: { in: [...cityIds] } } })
  if (provinceIds.size > 0) await prisma.province.deleteMany({ where: { id: { in: [...provinceIds] } } })
  if (userIds.size > 0) {
    await prisma.auditLog.deleteMany({ where: { actorUserId: { in: [...userIds] } } })
    await prisma.user.deleteMany({ where: { id: { in: [...userIds] } } })
  }

  for (const set of [
    userIds,
    providerIds,
    branchIds,
    offeringIds,
    quoteIds,
    categoryIds,
    serviceIds,
    cityIds,
    provinceIds,
    recipientIds,
    holdIds,
    bookingIds,
  ]) set.clear()
})

describe("atomic hold to booking conversion", () => {
  it("creates and replays an instant confirmed booking without releasing the allocation", async () => {
    const { customer, otherCustomer, recipient, hold } = await fixture("INSTANT")
    const key = `booking-${randomUUID()}`
    const input = {
      holdId: hold.id,
      recipientId: recipient.id,
      legalAcceptance: legalAcceptance(),
      questionnaireAnswers: { hairLength: "LONG" },
    }

    const created = await createBookingFromHold(customer, input, key, context("create"))
    bookingIds.add(created.booking.id)
    expect(created.booking.status).toBe("CONFIRMED")
    expect(created.booking.items).toHaveLength(1)
    expect(created.booking.transitions.map((item) => item.toStatus)).toEqual([
      "HOLDING_SLOT",
      "CONFIRMED",
    ])

    const persistedHold = await prisma.bookingHold.findUniqueOrThrow({ where: { id: hold.id } })
    expect(persistedHold.status).toBe("CONSUMED")
    expect(persistedHold.consumedBookingId).toBe(created.booking.id)

    const replay = await createBookingFromHold(customer, input, key, context("replay"))
    expect(replay.replayed).toBe(true)
    expect(replay.booking.id).toBe(created.booking.id)

    await expect(getOwnedBooking(otherCustomer, created.booking.id)).rejects.toMatchObject({
      code: "BOOKING_NOT_FOUND",
    })
    await expect(
      createBookingFromHold(customer, input, `booking-${randomUUID()}`, context("consumed")),
    ).rejects.toMatchObject({ code: "BOOKING_HOLD_ALREADY_CONSUMED" })
  })

  it("creates a manual-approval booking with a visible deadline", async () => {
    const { customer, recipient, hold } = await fixture("MANUAL")
    const created = await createBookingFromHold(
      customer,
      {
        holdId: hold.id,
        recipientId: recipient.id,
        legalAcceptance: legalAcceptance(),
        questionnaireAnswers: { hairLength: "SHORT" },
      },
      `booking-${randomUUID()}`,
      context("manual"),
    )
    bookingIds.add(created.booking.id)
    expect(created.booking.status).toBe("AWAITING_PROVIDER_APPROVAL")
    expect(created.booking.approvalDeadlineAt).toBeInstanceOf(Date)
  })

  it("allows only one concurrent conversion of the same hold", async () => {
    const { customer, recipient, hold } = await fixture("INSTANT")
    const input = {
      holdId: hold.id,
      recipientId: recipient.id,
      legalAcceptance: legalAcceptance(),
      questionnaireAnswers: { hairLength: "MEDIUM" },
    }
    const results = await Promise.allSettled([
      createBookingFromHold(customer, input, `booking-${randomUUID()}`, context("race-one")),
      createBookingFromHold(customer, input, `booking-${randomUUID()}`, context("race-two")),
    ])
    const fulfilled = results.filter((result) => result.status === "fulfilled")
    const rejected = results.filter((result) => result.status === "rejected")
    expect(fulfilled).toHaveLength(1)
    expect(rejected).toHaveLength(1)
    const winner = (
      fulfilled[0] as PromiseFulfilledResult<Awaited<ReturnType<typeof createBookingFromHold>>>
    ).value
    bookingIds.add(winner.booking.id)
    expect((rejected[0] as PromiseRejectedResult).reason).toMatchObject({
      code: expect.stringMatching(/BOOKING_HOLD_ALREADY_CONSUMED|BOOKING_CONCURRENCY_RETRY/),
    })
  })

  it("rejects an expired hold before creating any booking", async () => {
    const { customer, recipient, hold } = await fixture("INSTANT")
    const pastCreatedAt = new Date(Date.now() - 60_000)
    await prisma.bookingHold.update({
      where: { id: hold.id },
      data: {
        createdAt: pastCreatedAt,
        expiresAt: new Date(pastCreatedAt.getTime() + 1000),
      },
    })

    await expect(
      createBookingFromHold(
        customer,
        {
          holdId: hold.id,
          recipientId: recipient.id,
          legalAcceptance: legalAcceptance(),
          questionnaireAnswers: { hairLength: "LONG" },
        },
        `booking-${randomUUID()}`,
        context("expired"),
      ),
    ).rejects.toMatchObject({ code: "BOOKING_HOLD_EXPIRED" })
    expect(await prisma.booking.count({ where: { customerUserId: customer.userId } })).toBe(0)
  })
})
