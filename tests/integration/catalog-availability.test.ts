import { randomInt, randomUUID } from "node:crypto"
import { afterEach, describe, expect, it } from "vitest"

import type { RequestContext, SessionPrincipal } from "@/lib/auth/types"
import {
  getOwnedSchedule,
  previewOfferingAvailability,
  replaceOwnedSchedule,
} from "@/lib/availability/service"
import { localDateTimeToUtc } from "@/lib/availability/time"
import {
  createCatalogCategory,
  createCatalogStandardService,
  createOwnedOffering,
  listOwnedOfferings,
  quotePublicOffering,
} from "@/lib/catalog/service"
import { prisma } from "@/lib/infrastructure/prisma"

const userIds = new Set<string>()
const providerIds = new Set<string>()
const branchIds = new Set<string>()
const offeringIds = new Set<string>()
const serviceIds = new Set<string>()
const categoryIds = new Set<string>()
const cityIds = new Set<string>()
const provinceIds = new Set<string>()

function context(label: string): RequestContext {
  return {
    correlationId: `catalog-${label}-${randomUUID()}`,
    ipAddress: "127.0.6.10",
    userAgent: "vitest-catalog-availability",
  }
}

async function principal(permissions: string[] = []): Promise<SessionPrincipal> {
  const mobile = `092${randomInt(10_000_000, 99_999_999)}`
  const user = await prisma.user.create({ data: { mobileNormalized: mobile, status: "ACTIVE" } })
  userIds.add(user.id)
  return {
    sessionId: randomUUID(),
    userId: user.id,
    mobileNormalized: mobile,
    userStatus: "ACTIVE",
    identityStatus: "VERIFIED",
    authMethod: "PASSWORD_2FA",
    twoFactorVerifiedAt: new Date(),
    mustChangePassword: false,
    roleKeys: permissions.includes("content.manage") ? ["content_manager"] : ["salon_manager"],
    permissions,
  }
}

async function geography() {
  const suffix = randomUUID().slice(0, 8)
  const province = await prisma.province.create({
    data: { nameFa: `استان ${suffix}`, normalizedName: `province-${suffix}`, slug: `province-${suffix}` },
  })
  provinceIds.add(province.id)
  const city = await prisma.city.create({
    data: {
      provinceId: province.id,
      nameFa: `شهر ${suffix}`,
      normalizedName: `city-${suffix}`,
      slug: `city-${suffix}`,
    },
  })
  cityIds.add(city.id)
  return city
}

afterEach(async () => {
  if (branchIds.size > 0) {
    await prisma.scheduleException.deleteMany({ where: { ownerId: { in: [...branchIds] } } })
    await prisma.weeklyScheduleRule.deleteMany({ where: { ownerId: { in: [...branchIds] } } })
  }
  if (offeringIds.size > 0) {
    await prisma.serviceQuote.deleteMany({ where: { offeringId: { in: [...offeringIds] } } })
    await prisma.serviceOffering.deleteMany({ where: { id: { in: [...offeringIds] } } })
  }
  if (serviceIds.size > 0) {
    await prisma.standardService.deleteMany({ where: { id: { in: [...serviceIds] } } })
  }
  if (categoryIds.size > 0) {
    await prisma.serviceCategory.deleteMany({ where: { id: { in: [...categoryIds] } } })
  }
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

  userIds.clear()
  providerIds.clear()
  branchIds.clear()
  offeringIds.clear()
  serviceIds.clear()
  categoryIds.clear()
  cityIds.clear()
  provinceIds.clear()
})

describe("catalog, quote and availability integration", () => {
  it("publishes an owned offering, persists a quote and returns schedule-derived slots", async () => {
    const admin = await principal(["content.manage"])
    const owner = await principal(["provider.manage"])
    const other = await principal(["provider.manage"])
    const city = await geography()

    const provider = await prisma.providerOrganization.create({
      data: {
        ownerUserId: owner.userId,
        type: "SINGLE_SALON",
        status: "APPROVED",
        nameFa: "سالن کاتالوگ آزمایشی",
        normalizedName: `provider-${randomUUID()}`,
        slug: `provider-${randomUUID()}`,
        verificationAt: new Date(),
        bookingEnabled: true,
      },
    })
    providerIds.add(provider.id)
    const branch = await prisma.branch.create({
      data: {
        organizationId: provider.id,
        cityId: city.id,
        nameFa: "شعبه مرکزی",
        slug: `branch-${randomUUID()}`,
        active: true,
        addressVerified: true,
      },
    })
    branchIds.add(branch.id)

    const category = await createCatalogCategory(
      admin,
      { nameFa: "خدمات تست", slug: `test-category-${randomUUID()}` },
      context("category"),
    )
    categoryIds.add(category.id)
    const standardService = await createCatalogStandardService(
      admin,
      {
        categoryId: category.id,
        titleFa: "خدمت تست",
        slug: `test-service-${randomUUID()}`,
        description: "خدمت استاندارد برای تست یکپارچه",
      },
      context("service"),
    )
    serviceIds.add(standardService.id)

    const offering = await createOwnedOffering(
      owner,
      provider.id,
      {
        branchId: branch.id,
        standardServiceId: standardService.id,
        titleFa: "خدمت قابل رزرو",
        priceModel: "FIXED",
        priceMinToman: "650000",
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
    if (!offering) throw new Error("Offering DTO was unexpectedly null")
    offeringIds.add(offering.id)

    await expect(listOwnedOfferings(other, provider.id)).rejects.toMatchObject({
      code: "OFFERING_NOT_FOUND",
    })

    const quote = await quotePublicOffering(null, offering.id, { quantity: 2 })
    expect(quote.totalToman).toBe("1300000")
    expect(quote.finalPrice).toBe(true)
    const storedQuote = await prisma.serviceQuote.findUniqueOrThrow({ where: { id: quote.id } })
    expect(storedQuote.offeringId).toBe(offering.id)
    expect(storedQuote.snapshot).toMatchObject({ schemaVersion: 1 })

    const firstSchedule = await replaceOwnedSchedule(
      owner,
      {
        ownerType: "BRANCH",
        ownerId: branch.id,
        expectedUpdatedAt: null,
        rules: [
          {
            dayOfWeek: 1,
            startMinute: 9 * 60,
            endMinute: 12 * 60,
            timezone: "Asia/Tehran",
            active: true,
          },
        ],
      },
      context("schedule"),
    )
    expect(firstSchedule.updatedAt).toBeInstanceOf(Date)

    await expect(
      replaceOwnedSchedule(
        owner,
        {
          ownerType: "BRANCH",
          ownerId: branch.id,
          expectedUpdatedAt: null,
          rules: [],
        },
        context("stale-schedule"),
      ),
    ).rejects.toMatchObject({ code: "VERSION_CONFLICT" })

    await expect(
      getOwnedSchedule(other, { ownerType: "BRANCH", ownerId: branch.id }),
    ).rejects.toMatchObject({ code: "SCHEDULE_OWNER_NOT_FOUND" })

    const from = localDateTimeToUtc(
      { year: 2030, month: 1, day: 7, hour: 0, minute: 0 },
      "Asia/Tehran",
    )
    const to = localDateTimeToUtc(
      { year: 2030, month: 1, day: 8, hour: 0, minute: 0 },
      "Asia/Tehran",
    )
    const availability = await previewOfferingAvailability(offering.id, {
      from: from.toISOString(),
      to: to.toISOString(),
      stepMinute: 30,
      limit: 10,
    })
    expect(availability.slots.length).toBeGreaterThan(0)
    expect(availability.slots[0].startsAt.toISOString()).toBe("2030-01-07T05:30:00.000Z")
  })
})
