import { randomInt, randomUUID } from "node:crypto"
import { afterEach, describe, expect, it } from "vitest"

import type { RequestContext, SessionPrincipal } from "@/lib/auth/types"
import {
  approveProviderBooking,
  rejectProviderBooking,
} from "@/lib/booking/provider-decision-service"
import { prisma } from "@/lib/infrastructure/prisma"
import { expireProviderApprovals } from "../../worker/provider-approval-expiry.mjs"

const userIds = new Set<string>()
const providerIds = new Set<string>()
const branchIds = new Set<string>()
const categoryIds = new Set<string>()
const serviceIds = new Set<string>()
const offeringIds = new Set<string>()
const recipientIds = new Set<string>()
const quoteIds = new Set<string>()
const bookingIds = new Set<string>()
const holdIds = new Set<string>()
const cityIds = new Set<string>()
const provinceIds = new Set<string>()

function context(label: string): RequestContext {
  return {
    correlationId: `provider-booking-${label}-${randomUUID()}`,
    ipAddress: "127.0.9.10",
    userAgent: "vitest-provider-booking",
  }
}

async function principal(roleKey: string): Promise<SessionPrincipal> {
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
    roleKeys: [roleKey],
    permissions: roleKey === "provider_owner" ? ["provider.manage"] : [],
  }
}

async function fixture(options?: { deadlineOffsetMinute?: number }) {
  const owner = await principal("provider_owner")
  const otherOwner = await principal("provider_owner")
  const customer = await principal("customer")
  const suffix = randomUUID().slice(0, 8)
  const now = new Date()
  const startsAt = new Date(now.getTime() + 4 * 60 * 60 * 1000)
  const endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000)
  const approvalDeadlineAt = new Date(
    now.getTime() + (options?.deadlineOffsetMinute ?? 30) * 60 * 1000,
  )

  const province = await prisma.province.create({
    data: {
      nameFa: `استان تصمیم ${suffix}`,
      normalizedName: `provider-decision-province-${suffix}`,
      slug: `provider-decision-province-${suffix}`,
    },
  })
  provinceIds.add(province.id)
  const city = await prisma.city.create({
    data: {
      provinceId: province.id,
      nameFa: `شهر تصمیم ${suffix}`,
      normalizedName: `provider-decision-city-${suffix}`,
      slug: `provider-decision-city-${suffix}`,
    },
  })
  cityIds.add(city.id)

  const provider = await prisma.providerOrganization.create({
    data: {
      ownerUserId: owner.userId,
      type: "SINGLE_SALON",
      status: "APPROVED",
      nameFa: `سالن تصمیم ${suffix}`,
      normalizedName: `provider-decision-${suffix}`,
      slug: `provider-decision-${suffix}`,
      verificationAt: now,
      bookingEnabled: true,
    },
  })
  providerIds.add(provider.id)
  const branch = await prisma.branch.create({
    data: {
      organizationId: provider.id,
      cityId: city.id,
      nameFa: `شعبه تصمیم ${suffix}`,
      slug: `provider-decision-branch-${suffix}`,
      active: true,
      addressVerified: true,
    },
  })
  branchIds.add(branch.id)

  const category = await prisma.serviceCategory.create({
    data: {
      nameFa: `دسته تصمیم ${suffix}`,
      normalizedName: `provider-decision-category-${suffix}`,
      slug: `provider-decision-category-${suffix}`,
      active: true,
    },
  })
  categoryIds.add(category.id)
  const service = await prisma.standardService.create({
    data: {
      categoryId: category.id,
      titleFa: `خدمت تصمیم ${suffix}`,
      normalizedTitle: `provider-decision-service-${suffix}`,
      slug: `provider-decision-service-${suffix}`,
      active: true,
    },
  })
  serviceIds.add(service.id)
  const offering = await prisma.serviceOffering.create({
    data: {
      providerId: provider.id,
      branchId: branch.id,
      standardServiceId: service.id,
      titleFa: "خدمت نیازمند تأیید",
      priceModel: "FIXED",
      priceMinToman: 600000n,
      priceMaxToman: null,
      baseDurationMinute: 60,
      audienceRules: {},
      bookingPolicy: { approval: "MANUAL", approvalDeadlineMinute: 30 },
      active: true,
      published: true,
      version: 1,
    },
  })
  offeringIds.add(offering.id)

  const recipient = await prisma.serviceRecipient.create({
    data: {
      customerUserId: customer.userId,
      firstName: "مریم",
      lastName: "آزمایشی",
      birthDate: new Date("1995-01-15T00:00:00.000Z"),
      genderCode: "FEMALE",
      relationLabel: "خودم",
    },
  })
  recipientIds.add(recipient.id)

  const quote = await prisma.serviceQuote.create({
    data: {
      offeringId: offering.id,
      providerId: provider.id,
      customerUserId: customer.userId,
      quantity: 1,
      unitPriceToman: 600000n,
      totalToman: 600000n,
      durationMinute: 60,
      snapshot: { schemaVersion: 1 },
      expiresAt: new Date(now.getTime() + 15 * 60 * 1000),
    },
  })
  quoteIds.add(quote.id)

  const booking = await prisma.booking.create({
    data: {
      customerUserId: customer.userId,
      recipientId: recipient.id,
      providerId: provider.id,
      branchId: branch.id,
      status: "AWAITING_PROVIDER_APPROVAL",
      currency: "TOMAN",
      subtotalToman: 600000n,
      discountToman: 0n,
      travelFeeToman: 0n,
      platformFeeToman: 0n,
      totalToman: 600000n,
      priceSnapshot: { schemaVersion: 1 },
      policySnapshot: { schemaVersion: 1, bookingPolicy: { approval: "MANUAL" } },
      questionnaireSnapshot: { schemaVersion: 1, answers: {} },
      legalAcceptanceSnapshot: { schemaVersion: 1 },
      idempotencyKey: `fixture-booking-${randomUUID()}`,
      approvalDeadlineAt,
      version: 1,
    },
  })
  bookingIds.add(booking.id)
  await prisma.bookingItem.create({
    data: {
      bookingId: booking.id,
      offeringId: offering.id,
      professionalId: null,
      startsAt,
      endsAt,
      occupiedFrom: startsAt,
      occupiedUntil: endsAt,
      travelBeforeMinute: 0,
      travelAfterMinute: 0,
      unitPriceToman: 600000n,
      quantity: 1,
      priceSnapshot: { schemaVersion: 1 },
      durationSnapshot: { schemaVersion: 1, durationMinute: 60 },
    },
  })
  await prisma.bookingTransition.create({
    data: {
      bookingId: booking.id,
      fromStatus: "HOLDING_SLOT",
      toStatus: "AWAITING_PROVIDER_APPROVAL",
      actorUserId: customer.userId,
      reasonCode: "MANUAL_APPROVAL_POLICY",
      correlationId: context("fixture-transition").correlationId,
    },
  })

  const hold = await prisma.bookingHold.create({
    data: {
      customerUserId: customer.userId,
      quoteId: quote.id,
      offeringId: offering.id,
      providerId: provider.id,
      branchId: branch.id,
      professionalId: null,
      resourceType: "BRANCH",
      resourceId: branch.id,
      startsAt,
      endsAt,
      occupiedFrom: startsAt,
      occupiedUntil: endsAt,
      status: "CONSUMED",
      expiresAt: new Date(now.getTime() + 10 * 60 * 1000),
      idempotencyKey: `fixture-hold-${randomUUID()}`,
      requestHash: randomUUID().replaceAll("-", ""),
      snapshot: { schemaVersion: 1 },
      consumedBookingId: booking.id,
    },
  })
  holdIds.add(hold.id)

  return { owner, otherOwner, customer, provider, branch, offering, booking, hold }
}

afterEach(async () => {
  if (userIds.size > 0) {
    await prisma.idempotencyRecord.deleteMany({
      where: {
        OR: [...userIds].map((userId) => ({
          scope: `booking:provider-decision:${userId}`,
        })),
      },
    })
  }
  if (bookingIds.size > 0) {
    await prisma.outboxEvent.deleteMany({
      where: { aggregateType: "Booking", aggregateId: { in: [...bookingIds] } },
    })
    await prisma.auditLog.deleteMany({
      where: { resourceType: "Booking", resourceId: { in: [...bookingIds] } },
    })
  }
  if (holdIds.size > 0) {
    await prisma.bookingHold.deleteMany({ where: { id: { in: [...holdIds] } } })
  }
  if (bookingIds.size > 0) {
    await prisma.booking.deleteMany({ where: { id: { in: [...bookingIds] } } })
  }
  if (quoteIds.size > 0) {
    await prisma.serviceQuote.deleteMany({ where: { id: { in: [...quoteIds] } } })
  }
  if (recipientIds.size > 0) {
    await prisma.serviceRecipient.deleteMany({ where: { id: { in: [...recipientIds] } } })
  }
  if (offeringIds.size > 0) {
    await prisma.serviceOffering.deleteMany({ where: { id: { in: [...offeringIds] } } })
  }
  if (serviceIds.size > 0) {
    await prisma.standardService.deleteMany({ where: { id: { in: [...serviceIds] } } })
  }
  if (categoryIds.size > 0) {
    await prisma.serviceCategory.deleteMany({ where: { id: { in: [...categoryIds] } } })
  }
  if (branchIds.size > 0) {
    await prisma.branch.deleteMany({ where: { id: { in: [...branchIds] } } })
  }
  if (providerIds.size > 0) {
    await prisma.providerOrganization.deleteMany({ where: { id: { in: [...providerIds] } } })
  }
  if (cityIds.size > 0) {
    await prisma.city.deleteMany({ where: { id: { in: [...cityIds] } } })
  }
  if (provinceIds.size > 0) {
    await prisma.province.deleteMany({ where: { id: { in: [...provinceIds] } } })
  }
  if (userIds.size > 0) {
    await prisma.auditLog.deleteMany({ where: { actorUserId: { in: [...userIds] } } })
    await prisma.user.deleteMany({ where: { id: { in: [...userIds] } } })
  }

  for (const set of [
    userIds,
    providerIds,
    branchIds,
    categoryIds,
    serviceIds,
    offeringIds,
    recipientIds,
    quoteIds,
    bookingIds,
    holdIds,
    cityIds,
    provinceIds,
  ]) {
    set.clear()
  }
})

describe("provider booking decisions", () => {
  it("approves a pending booking and replays the exact command", async () => {
    const { owner, booking, hold } = await fixture()
    const key = `provider-approve-${randomUUID()}`
    const created = await approveProviderBooking(
      owner,
      booking.id,
      { expectedVersion: 1 },
      key,
      context("approve"),
    )
    expect(created.booking.status).toBe("CONFIRMED")
    expect(created.booking.version).toBe(2)
    expect(created.booking.transitions.at(-1)?.reasonCode).toBe("PROVIDER_APPROVED")

    const allocation = await prisma.bookingHold.findUniqueOrThrow({ where: { id: hold.id } })
    expect(allocation.status).toBe("CONSUMED")

    const replay = await approveProviderBooking(
      owner,
      booking.id,
      { expectedVersion: 1 },
      key,
      context("approve-replay"),
    )
    expect(replay.replayed).toBe(true)
    expect(replay.booking.id).toBe(booking.id)
    expect(replay.booking.version).toBe(2)
  })

  it("rejects a pending booking and releases its allocation", async () => {
    const { owner, booking, hold } = await fixture()
    const rejected = await rejectProviderBooking(
      owner,
      booking.id,
      {
        expectedVersion: 1,
        reasonCode: "PROFESSIONAL_UNAVAILABLE",
        reason: "متخصص در این بازه امکان ارائه خدمت ندارد.",
      },
      `provider-reject-${randomUUID()}`,
      context("reject"),
    )
    expect(rejected.booking.status).toBe("REJECTED")
    expect(rejected.booking.version).toBe(2)

    const allocation = await prisma.bookingHold.findUniqueOrThrow({ where: { id: hold.id } })
    expect(allocation.status).toBe("RELEASED")
    expect(allocation.releasedAt).toBeInstanceOf(Date)
  })

  it("hides another provider booking and rejects stale versions", async () => {
    const { owner, otherOwner, booking } = await fixture()
    await expect(
      approveProviderBooking(
        otherOwner,
        booking.id,
        { expectedVersion: 1 },
        `provider-idor-${randomUUID()}`,
        context("idor"),
      ),
    ).rejects.toMatchObject({ code: "BOOKING_NOT_FOUND" })

    await expect(
      approveProviderBooking(
        owner,
        booking.id,
        { expectedVersion: 2 },
        `provider-stale-${randomUUID()}`,
        context("stale"),
      ),
    ).rejects.toMatchObject({ code: "BOOKING_VERSION_CONFLICT" })
  })

  it("revalidates operational eligibility before approval while still allowing rejection", async () => {
    const { owner, branch, booking, hold } = await fixture()
    await prisma.branch.update({ where: { id: branch.id }, data: { active: false } })

    await expect(
      approveProviderBooking(
        owner,
        booking.id,
        { expectedVersion: 1 },
        `provider-ineligible-${randomUUID()}`,
        context("ineligible"),
      ),
    ).rejects.toMatchObject({ code: "BOOKING_APPROVAL_ELIGIBILITY_FAILED" })

    const rejected = await rejectProviderBooking(
      owner,
      booking.id,
      {
        expectedVersion: 1,
        reasonCode: "BRANCH_UNAVAILABLE",
        reason: "شعبه در این بازه امکان ارائه خدمت ندارد.",
      },
      `provider-ineligible-reject-${randomUUID()}`,
      context("ineligible-reject"),
    )
    expect(rejected.booking.status).toBe("REJECTED")

    const allocation = await prisma.bookingHold.findUniqueOrThrow({ where: { id: hold.id } })
    expect(allocation.status).toBe("RELEASED")
  })

  it("expires a late provider command and releases the allocation", async () => {
    const { owner, booking, hold } = await fixture({ deadlineOffsetMinute: -1 })
    await expect(
      approveProviderBooking(
        owner,
        booking.id,
        { expectedVersion: 1 },
        `provider-late-${randomUUID()}`,
        context("late"),
      ),
    ).rejects.toMatchObject({ code: "APPROVAL_DEADLINE_EXPIRED" })

    const persisted = await prisma.booking.findUniqueOrThrow({ where: { id: booking.id } })
    expect(persisted.status).toBe("EXPIRED")
    expect(persisted.version).toBe(2)
    const allocation = await prisma.bookingHold.findUniqueOrThrow({ where: { id: hold.id } })
    expect(allocation.status).toBe("RELEASED")
  })

  it("allows only one concurrent provider decision", async () => {
    const { owner, booking } = await fixture()
    const results = await Promise.allSettled([
      approveProviderBooking(
        owner,
        booking.id,
        { expectedVersion: 1 },
        `provider-race-approve-${randomUUID()}`,
        context("race-approve"),
      ),
      rejectProviderBooking(
        owner,
        booking.id,
        {
          expectedVersion: 1,
          reasonCode: "OTHER",
          reason: "به دلیل تغییر ناگهانی ظرفیت، امکان پذیرش وجود ندارد.",
        },
        `provider-race-reject-${randomUUID()}`,
        context("race-reject"),
      ),
    ])
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1)
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1)
    const rejection = results.find((result) => result.status === "rejected") as PromiseRejectedResult
    expect(rejection.reason).toMatchObject({
      code: expect.stringMatching(
        /BOOKING_NOT_AWAITING_PROVIDER_APPROVAL|BOOKING_CONCURRENCY_RETRY|BOOKING_VERSION_CONFLICT/,
      ),
    })
  })

  it("expires overdue manual approvals through the scheduled worker module", async () => {
    const { booking, hold } = await fixture({ deadlineOffsetMinute: -2 })
    const result = await expireProviderApprovals({
      prisma,
      jobId: `integration-${randomUUID()}`,
      now: new Date(),
      limit: 50,
      bookingIds: [booking.id],
    })
    expect(result.expiredCount).toBe(1)

    const persisted = await prisma.booking.findUniqueOrThrow({ where: { id: booking.id } })
    expect(persisted.status).toBe("EXPIRED")
    const allocation = await prisma.bookingHold.findUniqueOrThrow({ where: { id: hold.id } })
    expect(allocation.status).toBe("RELEASED")
    expect(
      await prisma.bookingTransition.count({
        where: { bookingId: booking.id, reasonCode: "APPROVAL_DEADLINE_EXPIRED" },
      }),
    ).toBe(1)
  })
})
