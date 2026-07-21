import { randomInt, randomUUID } from "node:crypto"
import { afterEach, describe, expect, it } from "vitest"

import type { RequestContext, SessionPrincipal } from "@/lib/auth/types"
import { createBookingHold, getOwnedBookingHold, releaseOwnedBookingHold } from "@/lib/booking/hold-service"
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

function context(label: string): RequestContext {
  return {
    correlationId: `hold-${label}-${randomUUID()}`,
    ipAddress: "127.0.7.10",
    userAgent: "vitest-booking-hold",
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

async function fixture() {
  const admin = await principal(["content.manage"])
  const owner = await principal(["provider.manage"])
  const firstCustomer = await principal()
  const secondCustomer = await principal()
  const suffix = randomUUID().slice(0, 8)

  const province = await prisma.province.create({
    data: { nameFa: `استان ${suffix}`, normalizedName: `hold-province-${suffix}`, slug: `hold-province-${suffix}` },
  })
  provinceIds.add(province.id)
  const city = await prisma.city.create({
    data: {
      provinceId: province.id,
      nameFa: `شهر ${suffix}`,
      normalizedName: `hold-city-${suffix}`,
      slug: `hold-city-${suffix}`,
    },
  })
  cityIds.add(city.id)

  const provider = await prisma.providerOrganization.create({
    data: {
      ownerUserId: owner.userId,
      type: "SINGLE_SALON",
      status: "APPROVED",
      nameFa: "سالن Hold آزمایشی",
      normalizedName: `hold-provider-${suffix}`,
      slug: `hold-provider-${suffix}`,
      verificationAt: new Date(),
      bookingEnabled: true,
    },
  })
  providerIds.add(provider.id)
  const branch = await prisma.branch.create({
    data: {
      organizationId: provider.id,
      cityId: city.id,
      nameFa: "شعبه Hold",
      slug: `hold-branch-${suffix}`,
      active: true,
      addressVerified: true,
    },
  })
  branchIds.add(branch.id)

  const category = await createCatalogCategory(
    admin,
    { nameFa: "دسته Hold", slug: `hold-category-${suffix}` },
    context("category"),
  )
  categoryIds.add(category.id)
  const service = await createCatalogStandardService(
    admin,
    { categoryId: category.id, titleFa: "خدمت Hold", slug: `hold-service-${suffix}` },
    context("service"),
  )
  serviceIds.add(service.id)

  const offering = await createOwnedOffering(
    owner,
    provider.id,
    {
      branchId: branch.id,
      standardServiceId: service.id,
      titleFa: "خدمت Hold قابل رزرو",
      priceModel: "FIXED",
      priceMinToman: "500000",
      priceMaxToman: null,
      baseDurationMinute: 60,
      preparationMinute: 0,
      cleanupMinute: 0,
      bufferBeforeMinute: 0,
      bufferAfterMinute: 0,
      audienceRules: { audience: "ALL" },
      bookingPolicy: { approval: "INSTANT" },
      active: true,
      published: true,
    },
    context("offering"),
  )
  if (!offering) throw new Error("Offering was not created")
  offeringIds.add(offering.id)

  const quote = await quotePublicOffering(null, offering.id, { quantity: 1 })
  quoteIds.add(quote.id)
  const startsAt = new Date(Date.now() + 2 * 60 * 60 * 1000)
  startsAt.setUTCSeconds(0, 0)
  await prisma.scheduleException.create({
    data: {
      ownerType: "BRANCH",
      ownerId: branch.id,
      kind: "AVAILABLE",
      startsAt: new Date(startsAt.getTime() - 30 * 60 * 1000),
      endsAt: new Date(startsAt.getTime() + 3 * 60 * 60 * 1000),
      createdBy: owner.userId,
      reason: "بازه تست Hold",
    },
  })

  return { firstCustomer, secondCustomer, quote, startsAt }
}

afterEach(async () => {
  if (branchIds.size > 0) {
    await prisma.scheduleException.deleteMany({ where: { ownerId: { in: [...branchIds] } } })
    await prisma.weeklyScheduleRule.deleteMany({ where: { ownerId: { in: [...branchIds] } } })
  }
  if (userIds.size > 0) {
    await prisma.idempotencyRecord.deleteMany({
      where: { scope: { in: [...userIds].map((id) => `booking-hold:create:${id}`) } },
    })
  }
  if (offeringIds.size > 0) {
    await prisma.outboxEvent.deleteMany({ where: { aggregateType: "BookingHold" } })
    await prisma.bookingHold.deleteMany({ where: { offeringId: { in: [...offeringIds] } } })
  }
  if (quoteIds.size > 0) await prisma.serviceQuote.deleteMany({ where: { id: { in: [...quoteIds] } } })
  if (offeringIds.size > 0) await prisma.serviceOffering.deleteMany({ where: { id: { in: [...offeringIds] } } })
  if (serviceIds.size > 0) await prisma.standardService.deleteMany({ where: { id: { in: [...serviceIds] } } })
  if (categoryIds.size > 0) await prisma.serviceCategory.deleteMany({ where: { id: { in: [...categoryIds] } } })
  if (branchIds.size > 0) await prisma.branch.deleteMany({ where: { id: { in: [...branchIds] } } })
  if (providerIds.size > 0) {
    await prisma.auditLog.deleteMany({ where: { scopeId: { in: [...providerIds] } } })
    await prisma.providerOrganization.deleteMany({ where: { id: { in: [...providerIds] } } })
  }
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
  ]) set.clear()
})

describe("transactional booking holds", () => {
  it("replays the same idempotent request and rejects a changed payload", async () => {
    const { firstCustomer, secondCustomer, quote, startsAt } = await fixture()
    const key = `hold-${randomUUID()}`
    const first = await createBookingHold(
      firstCustomer,
      { quoteId: quote.id, startsAt: startsAt.toISOString() },
      key,
      context("create"),
    )
    const replay = await createBookingHold(
      firstCustomer,
      { quoteId: quote.id, startsAt: startsAt.toISOString() },
      key,
      context("replay"),
    )
    expect(replay.replayed).toBe(true)
    expect(replay.hold.id).toBe(first.hold.id)

    await expect(
      createBookingHold(
        firstCustomer,
        { quoteId: quote.id, startsAt: new Date(startsAt.getTime() + 60_000).toISOString() },
        key,
        context("changed-replay"),
      ),
    ).rejects.toMatchObject({ code: "IDEMPOTENCY_CONFLICT" })

    await expect(getOwnedBookingHold(secondCustomer, first.hold.id)).rejects.toMatchObject({
      code: "BOOKING_HOLD_NOT_FOUND",
    })
  })

  it("allows only one concurrent hold for a resource slot and releases it explicitly", async () => {
    const { firstCustomer, secondCustomer, quote, startsAt } = await fixture()
    const results = await Promise.allSettled([
      createBookingHold(
        firstCustomer,
        { quoteId: quote.id, startsAt: startsAt.toISOString() },
        `hold-${randomUUID()}`,
        context("race-one"),
      ),
      createBookingHold(
        secondCustomer,
        { quoteId: quote.id, startsAt: startsAt.toISOString() },
        `hold-${randomUUID()}`,
        context("race-two"),
      ),
    ])
    const fulfilled = results.filter((result) => result.status === "fulfilled")
    const rejected = results.filter((result) => result.status === "rejected")
    expect(fulfilled).toHaveLength(1)
    expect(rejected).toHaveLength(1)
    expect((rejected[0] as PromiseRejectedResult).reason).toMatchObject({
      code: expect.stringMatching(/SLOT_NOT_AVAILABLE|BOOKING_CONCURRENCY_RETRY/),
    })

    const winner = (fulfilled[0] as PromiseFulfilledResult<Awaited<ReturnType<typeof createBookingHold>>>).value
    const winnerPrincipal = winner.hold.customerUserId === firstCustomer.userId ? firstCustomer : secondCustomer
    const loserPrincipal = winnerPrincipal.userId === firstCustomer.userId ? secondCustomer : firstCustomer
    const released = await releaseOwnedBookingHold(winnerPrincipal, winner.hold.id, context("release"))
    expect(released.hold.status).toBe("RELEASED")

    const replacement = await createBookingHold(
      loserPrincipal,
      { quoteId: quote.id, startsAt: startsAt.toISOString() },
      `hold-${randomUUID()}`,
      context("replacement"),
    )
    expect(replacement.hold.status).toBe("ACTIVE")
  })

  it("marks an elapsed hold expired when the owner reads it", async () => {
    const { firstCustomer, quote, startsAt } = await fixture()
    const created = await createBookingHold(
      firstCustomer,
      { quoteId: quote.id, startsAt: startsAt.toISOString() },
      `hold-${randomUUID()}`,
      context("expiry-create"),
    )
    await prisma.bookingHold.update({
      where: { id: created.hold.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    })
    const expired = await getOwnedBookingHold(firstCustomer, created.hold.id)
    expect(expired.status).toBe("EXPIRED")
  })
})
