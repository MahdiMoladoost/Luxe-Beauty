import { randomInt, randomUUID } from "node:crypto"
import { afterEach, describe, expect, it } from "vitest"

import type { RequestContext, SessionPrincipal } from "@/lib/auth/types"
import { prisma } from "@/lib/infrastructure/prisma"
import {
  createOwnedBranch,
  deleteOwnedBranch,
  listOwnedBranches,
  updateOwnedBranch,
} from "@/lib/provider/branch-service"

const userIds = new Set<string>()
const providerIds = new Set<string>()
const provinceIds = new Set<string>()
const cityIds = new Set<string>()
const districtIds = new Set<string>()
const neighborhoodIds = new Set<string>()

function context(label: string): RequestContext {
  return {
    correlationId: `branch-${label}-${randomUUID()}`,
    ipAddress: "127.0.0.1",
    userAgent: "vitest-provider-branches",
  }
}

async function principal(label: string): Promise<SessionPrincipal> {
  const user = await prisma.user.create({
    data: {
      mobileNormalized: `091${randomInt(10_000_000, 99_999_999)}`,
      status: "ACTIVE",
    },
  })
  userIds.add(user.id)
  return {
    sessionId: `session-${label}-${user.id}`,
    userId: user.id,
    mobileNormalized: user.mobileNormalized,
    userStatus: user.status,
    identityStatus: user.identityStatus,
    authMethod: "OTP",
    twoFactorVerifiedAt: null,
    mustChangePassword: false,
    roleKeys: [],
    permissions: [],
  }
}

async function provider(owner: SessionPrincipal, approved: boolean, label: string) {
  const row = await prisma.providerOrganization.create({
    data: {
      ownerUserId: owner.userId,
      type: "SINGLE_SALON",
      status: approved ? "APPROVED" : "DRAFT",
      nameFa: `سالن ${label}`,
      normalizedName: `salon-${label}`,
      slug: `salon-${label}-${randomUUID()}`,
      verificationAt: approved ? new Date() : null,
      bookingEnabled: approved,
    },
  })
  providerIds.add(row.id)
  return row
}

async function geography(label: string) {
  const province = await prisma.province.create({
    data: {
      nameFa: `استان ${label}`,
      normalizedName: `province-${label}-${randomUUID()}`,
      slug: `province-${label}-${randomUUID()}`,
    },
  })
  provinceIds.add(province.id)
  const city = await prisma.city.create({
    data: {
      provinceId: province.id,
      nameFa: `شهر ${label}`,
      normalizedName: `city-${label}-${randomUUID()}`,
      slug: `city-${label}-${randomUUID()}`,
    },
  })
  cityIds.add(city.id)
  const district = await prisma.district.create({
    data: {
      cityId: city.id,
      nameFa: `منطقه ${label}`,
      normalizedName: `district-${label}-${randomUUID()}`,
      slug: `district-${label}-${randomUUID()}`,
    },
  })
  districtIds.add(district.id)
  const otherDistrict = await prisma.district.create({
    data: {
      cityId: city.id,
      nameFa: `منطقه دیگر ${label}`,
      normalizedName: `district-other-${label}-${randomUUID()}`,
      slug: `district-other-${label}-${randomUUID()}`,
    },
  })
  districtIds.add(otherDistrict.id)
  const neighborhood = await prisma.neighborhood.create({
    data: {
      cityId: city.id,
      districtId: district.id,
      nameFa: `محله ${label}`,
      normalizedName: `neighborhood-${label}-${randomUUID()}`,
      slug: `neighborhood-${label}-${randomUUID()}`,
    },
  })
  neighborhoodIds.add(neighborhood.id)
  return { province, city, district, otherDistrict, neighborhood }
}

afterEach(async () => {
  if (providerIds.size) {
    await prisma.branch.deleteMany({ where: { organizationId: { in: [...providerIds] } } })
    await prisma.auditLog.deleteMany({ where: { scopeId: { in: [...providerIds] } } })
    await prisma.providerOrganization.deleteMany({ where: { id: { in: [...providerIds] } } })
  }
  if (neighborhoodIds.size) {
    await prisma.neighborhood.deleteMany({ where: { id: { in: [...neighborhoodIds] } } })
  }
  if (districtIds.size) {
    await prisma.district.deleteMany({ where: { id: { in: [...districtIds] } } })
  }
  if (cityIds.size) {
    await prisma.city.deleteMany({ where: { id: { in: [...cityIds] } } })
  }
  if (provinceIds.size) {
    await prisma.province.deleteMany({ where: { id: { in: [...provinceIds] } } })
  }
  if (userIds.size) {
    await prisma.auditLog.deleteMany({ where: { actorUserId: { in: [...userIds] } } })
    await prisma.userRole.deleteMany({ where: { userId: { in: [...userIds] } } })
    await prisma.user.deleteMany({ where: { id: { in: [...userIds] } } })
  }
  providerIds.clear()
  userIds.clear()
  provinceIds.clear()
  cityIds.clear()
  districtIds.clear()
  neighborhoodIds.clear()
})

describe("provider branch integration", () => {
  it("creates inactive branches, enforces owner access and uses optimistic concurrency", async () => {
    const owner = await principal("owner")
    const outsider = await principal("outsider")
    const salon = await provider(owner, true, "approved")
    const location = await geography("primary")

    const created = await createOwnedBranch(
      owner,
      salon.id,
      {
        nameFa: "شعبه مرکزی",
        cityId: location.city.id,
        neighborhoodId: location.neighborhood.id,
        latitude: 35.75,
        longitude: 51.2,
      },
      context("create"),
    )
    expect(created.active).toBe(false)
    expect(created.location.district?.id).toBe(location.district.id)

    await expect(listOwnedBranches(outsider, salon.id)).rejects.toMatchObject({
      code: "PROVIDER_NOT_FOUND",
    })

    const activated = await updateOwnedBranch(
      owner,
      salon.id,
      created.id,
      { expectedUpdatedAt: created.updatedAt.toISOString(), active: true },
      context("activate"),
    )
    expect(activated.active).toBe(true)

    await expect(
      updateOwnedBranch(
        owner,
        salon.id,
        created.id,
        { expectedUpdatedAt: created.updatedAt.toISOString(), nameFa: "نام قدیمی" },
        context("stale-update"),
      ),
    ).rejects.toMatchObject({ code: "VERSION_CONFLICT" })

    const deleted = await deleteOwnedBranch(
      owner,
      salon.id,
      created.id,
      activated.updatedAt.toISOString(),
      context("delete"),
    )
    expect(deleted.id).toBe(created.id)
    const stored = await prisma.branch.findUniqueOrThrow({ where: { id: created.id } })
    expect(stored.active).toBe(false)
    expect(stored.deletedAt).toBeInstanceOf(Date)
  })

  it("rejects mismatched geography and activation before provider approval", async () => {
    const owner = await principal("draft-owner")
    const salon = await provider(owner, false, "draft")
    const location = await geography("draft")

    await expect(
      createOwnedBranch(
        owner,
        salon.id,
        {
          nameFa: "شعبه نامعتبر",
          cityId: location.city.id,
          districtId: location.otherDistrict.id,
          neighborhoodId: location.neighborhood.id,
        },
        context("invalid-hierarchy"),
      ),
    ).rejects.toMatchObject({ code: "LOCATION_HIERARCHY_MISMATCH" })

    const created = await createOwnedBranch(
      owner,
      salon.id,
      {
        nameFa: "شعبه پیش‌نویس",
        cityId: location.city.id,
        districtId: location.district.id,
      },
      context("draft-create"),
    )
    await expect(
      updateOwnedBranch(
        owner,
        salon.id,
        created.id,
        { expectedUpdatedAt: created.updatedAt.toISOString(), active: true },
        context("draft-activate"),
      ),
    ).rejects.toMatchObject({ code: "PROVIDER_NOT_APPROVED" })
  })
})
