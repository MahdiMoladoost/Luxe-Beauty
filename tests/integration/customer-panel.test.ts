import { randomInt, randomUUID } from "node:crypto"
import { afterEach, describe, expect, it } from "vitest"

import type { RequestContext, SessionPrincipal } from "@/lib/auth/types"
import {
  createOwnedBookingRecipient,
  deleteOwnedBookingRecipient,
  listOwnedBookingRecipients,
  updateOwnedBookingRecipient,
} from "@/lib/booking/recipient-service"
import { updateCustomerAccount } from "@/lib/customer-panel/account"
import {
  customerBookingDetail,
  customerBookings,
  customerDashboard,
  customerPanelBootstrap,
} from "@/lib/customer-panel/service"
import { prisma } from "@/lib/infrastructure/prisma"

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

function context(): RequestContext {
  return {
    correlationId: `customer-panel-${randomUUID()}`,
    ipAddress: "127.0.0.1",
    userAgent: "vitest",
  }
}

async function principal(): Promise<SessionPrincipal> {
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
    roleKeys: ["customer"],
    permissions: [],
  }
}

async function fixture() {
  const customer = await principal()
  const otherCustomer = await principal()
  const owner = await principal()
  const suffix = randomUUID().slice(0, 8)
  const now = new Date()

  const province = await prisma.province.create({
    data: {
      nameFa: `استان مشتری ${suffix}`,
      normalizedName: `customer-province-${suffix}`,
      slug: `customer-province-${suffix}`,
    },
  })
  provinceIds.add(province.id)
  const city = await prisma.city.create({
    data: {
      provinceId: province.id,
      nameFa: `شهر مشتری ${suffix}`,
      normalizedName: `customer-city-${suffix}`,
      slug: `customer-city-${suffix}`,
    },
  })
  cityIds.add(city.id)
  const provider = await prisma.providerOrganization.create({
    data: {
      ownerUserId: owner.userId,
      type: "SINGLE_SALON",
      status: "APPROVED",
      nameFa: `سالن مشتری ${suffix}`,
      normalizedName: `customer-provider-${suffix}`,
      slug: `customer-provider-${suffix}`,
      verificationAt: now,
      bookingEnabled: true,
    },
  })
  providerIds.add(provider.id)
  const branch = await prisma.branch.create({
    data: {
      organizationId: provider.id,
      cityId: city.id,
      nameFa: `شعبه مشتری ${suffix}`,
      slug: `customer-branch-${suffix}`,
      active: true,
      addressVerified: true,
    },
  })
  branchIds.add(branch.id)
  const category = await prisma.serviceCategory.create({
    data: {
      nameFa: `دسته مشتری ${suffix}`,
      normalizedName: `customer-category-${suffix}`,
      slug: `customer-category-${suffix}`,
      active: true,
    },
  })
  categoryIds.add(category.id)
  const service = await prisma.standardService.create({
    data: {
      categoryId: category.id,
      titleFa: `خدمت مشتری ${suffix}`,
      normalizedTitle: `customer-service-${suffix}`,
      slug: `customer-service-${suffix}`,
      active: true,
    },
  })
  serviceIds.add(service.id)
  const offering = await prisma.serviceOffering.create({
    data: {
      providerId: provider.id,
      branchId: branch.id,
      standardServiceId: service.id,
      titleFa: `خدمت رزروی مشتری ${suffix}`,
      priceModel: "FIXED",
      priceMinToman: 320000n,
      baseDurationMinute: 45,
      audienceRules: { audience: "ALL" },
      bookingPolicy: { approval: "MANUAL", payment: "NONE" },
      active: true,
      published: true,
    },
  })
  offeringIds.add(offering.id)
  const recipient = await prisma.serviceRecipient.create({
    data: {
      customerUserId: customer.userId,
      firstName: "مشتری",
      lastName: `آزمایشی ${suffix}`,
      relationLabel: "خودم",
    },
  })
  recipientIds.add(recipient.id)
  const startsAt = new Date(now.getTime() + 48 * 60 * 60 * 1000)
  const endsAt = new Date(startsAt.getTime() + 45 * 60 * 1000)
  const booking = await prisma.booking.create({
    data: {
      customerUserId: customer.userId,
      recipientId: recipient.id,
      providerId: provider.id,
      branchId: branch.id,
      status: "AWAITING_PROVIDER_APPROVAL",
      currency: "TOMAN",
      subtotalToman: 320000n,
      totalToman: 320000n,
      priceSnapshot: { schemaVersion: 1 },
      policySnapshot: { schemaVersion: 1 },
      idempotencyKey: `customer-panel-booking-${randomUUID()}`,
      approvalDeadlineAt: new Date(now.getTime() + 30 * 60 * 1000),
      items: {
        create: {
          offeringId: offering.id,
          startsAt,
          endsAt,
          occupiedFrom: startsAt,
          occupiedUntil: endsAt,
          unitPriceToman: 320000n,
          quantity: 1,
          priceSnapshot: { schemaVersion: 1 },
          durationSnapshot: { schemaVersion: 1, durationMinute: 45 },
        },
      },
      transitions: {
        create: {
          fromStatus: "HOLDING_SLOT",
          toStatus: "AWAITING_PROVIDER_APPROVAL",
          actorUserId: customer.userId,
          correlationId: `customer-panel-fixture-${randomUUID()}`,
        },
      },
    },
  })
  bookingIds.add(booking.id)

  return { customer, otherCustomer, provider, recipient, booking }
}

afterEach(async () => {
  if (bookingIds.size) await prisma.booking.deleteMany({ where: { id: { in: [...bookingIds] } } })
  if (recipientIds.size) await prisma.serviceRecipient.deleteMany({ where: { id: { in: [...recipientIds] } } })
  if (offeringIds.size) await prisma.serviceOffering.deleteMany({ where: { id: { in: [...offeringIds] } } })
  if (serviceIds.size) await prisma.standardService.deleteMany({ where: { id: { in: [...serviceIds] } } })
  if (categoryIds.size) await prisma.serviceCategory.deleteMany({ where: { id: { in: [...categoryIds] } } })
  if (branchIds.size) await prisma.branch.deleteMany({ where: { id: { in: [...branchIds] } } })
  if (providerIds.size) await prisma.providerOrganization.deleteMany({ where: { id: { in: [...providerIds] } } })
  if (cityIds.size) await prisma.city.deleteMany({ where: { id: { in: [...cityIds] } } })
  if (provinceIds.size) await prisma.province.deleteMany({ where: { id: { in: [...provinceIds] } } })
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
  ]) set.clear()
})

describe("customer panel data", () => {
  it("returns live dashboard, booking filters and owner-only detail", async () => {
    const { customer, otherCustomer, provider, booking } = await fixture()

    const bootstrap = await customerPanelBootstrap(customer)
    expect(bootstrap.account.id).toBe(customer.userId)

    const dashboard = await customerDashboard(customer)
    expect(dashboard.counts.bookingTotal).toBe(1)
    expect(dashboard.counts.upcoming).toBe(1)
    expect(dashboard.counts.awaitingProvider).toBe(1)
    expect(dashboard.counts.recipientTotal).toBe(1)
    expect(dashboard.recentBookings[0].provider.nameFa).toBe(provider.nameFa)
    expect(dashboard.recentBookings[0].totalToman).toBe("320000")

    const list = await customerBookings(customer, {
      scope: "upcoming",
      status: "AWAITING_PROVIDER_APPROVAL",
      query: "سالن مشتری",
      page: "1",
      pageSize: "15",
    })
    expect(list.pagination.total).toBe(1)
    expect(list.items[0].id).toBe(booking.id)

    const detail = await customerBookingDetail(customer, booking.id)
    expect(detail.id).toBe(booking.id)
    expect(detail.items[0].offering.titleFa).toContain("خدمت رزروی")

    await expect(customerBookingDetail(otherCustomer, booking.id)).rejects.toMatchObject({
      code: "BOOKING_NOT_FOUND",
    })
  })

  it("updates account with versioning and completes recipient CRUD", async () => {
    const customer = await principal()

    const profile = await updateCustomerAccount(
      customer,
      {
        expectedUpdatedAt: null,
        firstName: "نگار",
        lastName: "محمدی",
        birthDate: "1994-05-18",
      },
      context(),
    )
    expect(profile.firstName).toBe("نگار")
    expect(profile.birthDate).toBe("1994-05-18")

    await expect(
      updateCustomerAccount(
        customer,
        {
          expectedUpdatedAt: null,
          firstName: "نگار",
          lastName: "احمدی",
          birthDate: null,
        },
        context(),
      ),
    ).rejects.toMatchObject({ code: "VERSION_CONFLICT" })

    const recipient = await createOwnedBookingRecipient(
      customer,
      {
        firstName: "مهسا",
        lastName: "محمدی",
        birthDate: "2001-02-03",
        genderCode: "FEMALE",
        relationLabel: "خواهر",
        contactMobile: "09121234567",
      },
      context(),
    )
    recipientIds.add(recipient!.id)

    const updated = await updateOwnedBookingRecipient(
      customer,
      recipient!.id,
      {
        expectedUpdatedAt: recipient!.updatedAt.toISOString(),
        relationLabel: "عضو خانواده",
      },
      context(),
    )
    expect(updated?.relationLabel).toBe("عضو خانواده")

    await deleteOwnedBookingRecipient(
      customer,
      recipient!.id,
      updated!.updatedAt.toISOString(),
      context(),
    )
    expect(await listOwnedBookingRecipients(customer)).toHaveLength(0)
  })
})
