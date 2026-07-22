import { randomInt, randomUUID } from "node:crypto"
import { afterEach, describe, expect, it } from "vitest"

import type { SessionPrincipal } from "@/lib/auth/types"
import { prisma } from "@/lib/infrastructure/prisma"
import {
  providerBookingDetails,
  providerBookings,
  providerDashboard,
  providerPanelBootstrap,
} from "@/lib/provider-panel/service"

const userIds = new Set<string>()
const providerIds = new Set<string>()
const branchIds = new Set<string>()
const provinceIds = new Set<string>()
const cityIds = new Set<string>()
const categoryIds = new Set<string>()
const serviceIds = new Set<string>()
const offeringIds = new Set<string>()
const recipientIds = new Set<string>()
const bookingIds = new Set<string>()

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

async function fixture() {
  const owner = await principal("provider_owner")
  const otherOwner = await principal("provider_owner")
  const customer = await principal("customer")
  const suffix = randomUUID().slice(0, 8)
  const now = new Date()

  const province = await prisma.province.create({
    data: {
      nameFa: `استان پنل ${suffix}`,
      normalizedName: `panel-province-${suffix}`,
      slug: `panel-province-${suffix}`,
    },
  })
  provinceIds.add(province.id)
  const city = await prisma.city.create({
    data: {
      provinceId: province.id,
      nameFa: `شهر پنل ${suffix}`,
      normalizedName: `panel-city-${suffix}`,
      slug: `panel-city-${suffix}`,
    },
  })
  cityIds.add(city.id)
  const provider = await prisma.providerOrganization.create({
    data: {
      ownerUserId: owner.userId,
      type: "SINGLE_SALON",
      status: "APPROVED",
      nameFa: `سالن پنل ${suffix}`,
      normalizedName: `panel-provider-${suffix}`,
      slug: `panel-provider-${suffix}`,
      verificationAt: now,
      bookingEnabled: true,
    },
  })
  providerIds.add(provider.id)
  const branch = await prisma.branch.create({
    data: {
      organizationId: provider.id,
      cityId: city.id,
      nameFa: `شعبه پنل ${suffix}`,
      slug: `panel-branch-${suffix}`,
      active: true,
      addressVerified: true,
    },
  })
  branchIds.add(branch.id)
  const category = await prisma.serviceCategory.create({
    data: {
      nameFa: `دسته پنل ${suffix}`,
      normalizedName: `panel-category-${suffix}`,
      slug: `panel-category-${suffix}`,
      active: true,
    },
  })
  categoryIds.add(category.id)
  const service = await prisma.standardService.create({
    data: {
      categoryId: category.id,
      titleFa: `خدمت پنل ${suffix}`,
      normalizedTitle: `panel-service-${suffix}`,
      slug: `panel-service-${suffix}`,
      active: true,
    },
  })
  serviceIds.add(service.id)
  const offering = await prisma.serviceOffering.create({
    data: {
      providerId: provider.id,
      branchId: branch.id,
      standardServiceId: service.id,
      titleFa: `خدمت قابل رزرو ${suffix}`,
      priceModel: "FIXED",
      priceMinToman: 450000n,
      priceMaxToman: null,
      baseDurationMinute: 60,
      audienceRules: { audience: "ALL" },
      bookingPolicy: { approval: "INSTANT", payment: "NONE" },
      active: true,
      published: true,
      version: 1,
    },
  })
  offeringIds.add(offering.id)
  const recipient = await prisma.serviceRecipient.create({
    data: {
      customerUserId: customer.userId,
      firstName: "کاربر",
      lastName: `پنل ${suffix}`,
      relationLabel: "خودم",
    },
  })
  recipientIds.add(recipient.id)
  const startsAt = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000)
  const booking = await prisma.booking.create({
    data: {
      customerUserId: customer.userId,
      recipientId: recipient.id,
      providerId: provider.id,
      branchId: branch.id,
      status: "CONFIRMED",
      currency: "TOMAN",
      subtotalToman: 450000n,
      discountToman: 0n,
      travelFeeToman: 0n,
      platformFeeToman: 0n,
      totalToman: 450000n,
      priceSnapshot: { schemaVersion: 1 },
      policySnapshot: { schemaVersion: 1 },
      questionnaireSnapshot: { schemaVersion: 1, answers: {} },
      legalAcceptanceSnapshot: { schemaVersion: 1 },
      idempotencyKey: `panel-booking-${randomUUID()}`,
      version: 1,
      items: {
        create: {
          offeringId: offering.id,
          startsAt,
          endsAt,
          occupiedFrom: startsAt,
          occupiedUntil: endsAt,
          unitPriceToman: 450000n,
          quantity: 1,
          priceSnapshot: { schemaVersion: 1 },
          durationSnapshot: { schemaVersion: 1, durationMinute: 60 },
        },
      },
      transitions: {
        create: {
          fromStatus: "HOLDING_SLOT",
          toStatus: "CONFIRMED",
          actorUserId: customer.userId,
          reasonCode: "INSTANT_APPROVAL_POLICY",
          correlationId: `panel-fixture-${randomUUID()}`,
        },
      },
    },
  })
  bookingIds.add(booking.id)

  return { owner, otherOwner, provider, branch, offering, booking }
}

afterEach(async () => {
  if (bookingIds.size) await prisma.booking.deleteMany({ where: { id: { in: [...bookingIds] } } })
  if (recipientIds.size) {
    await prisma.serviceRecipient.deleteMany({ where: { id: { in: [...recipientIds] } } })
  }
  if (offeringIds.size) {
    await prisma.serviceOffering.deleteMany({ where: { id: { in: [...offeringIds] } } })
  }
  if (serviceIds.size) {
    await prisma.standardService.deleteMany({ where: { id: { in: [...serviceIds] } } })
  }
  if (categoryIds.size) {
    await prisma.serviceCategory.deleteMany({ where: { id: { in: [...categoryIds] } } })
  }
  if (branchIds.size) await prisma.branch.deleteMany({ where: { id: { in: [...branchIds] } } })
  if (providerIds.size) {
    await prisma.providerOrganization.deleteMany({ where: { id: { in: [...providerIds] } } })
  }
  if (cityIds.size) await prisma.city.deleteMany({ where: { id: { in: [...cityIds] } } })
  if (provinceIds.size) {
    await prisma.province.deleteMany({ where: { id: { in: [...provinceIds] } } })
  }
  if (userIds.size) await prisma.user.deleteMany({ where: { id: { in: [...userIds] } } })

  for (const set of [
    userIds,
    providerIds,
    branchIds,
    provinceIds,
    cityIds,
    categoryIds,
    serviceIds,
    offeringIds,
    recipientIds,
    bookingIds,
  ]) {
    set.clear()
  }
})

describe("provider panel data", () => {
  it("returns only the owner provider and real dashboard counts", async () => {
    const { owner, provider } = await fixture()
    const bootstrap = await providerPanelBootstrap(owner, provider.id)
    expect(bootstrap.selectedProvider?.id).toBe(provider.id)
    expect(bootstrap.providers).toHaveLength(1)

    const dashboard = await providerDashboard(owner, provider.id)
    expect(dashboard.counts.branchTotal).toBe(1)
    expect(dashboard.counts.activeBranches).toBe(1)
    expect(dashboard.counts.offeringTotal).toBe(1)
    expect(dashboard.counts.publishedOfferings).toBe(1)
    expect(dashboard.counts.totalBookings).toBe(1)
    expect(dashboard.recentBookings).toHaveLength(1)
    expect(dashboard.recentBookings[0].totalToman).toBe("450000")
  })

  it("filters bookings and hides cross-provider data", async () => {
    const { owner, otherOwner, provider, booking } = await fixture()
    const result = await providerBookings(owner, {
      providerId: provider.id,
      status: "CONFIRMED",
      query: "کاربر",
      page: "1",
      pageSize: "15",
      sort: "appointment",
    })
    expect(result.pagination.total).toBe(1)
    expect(result.items[0].id).toBe(booking.id)

    const detail = await providerBookingDetails(owner, provider.id, booking.id)
    expect(detail.id).toBe(booking.id)
    expect(detail.recipient.firstName).toBe("کاربر")

    await expect(providerPanelBootstrap(otherOwner, provider.id)).rejects.toMatchObject({
      code: "PROVIDER_NOT_FOUND",
    })
    await expect(providerBookingDetails(otherOwner, provider.id, booking.id)).rejects.toMatchObject({
      code: "PROVIDER_NOT_FOUND",
    })
  })
})
