import { randomInt, randomUUID } from "node:crypto"
import { afterEach, describe, expect, it } from "vitest"

import type { RequestContext, SessionPrincipal } from "@/lib/auth/types"
import { prisma } from "@/lib/infrastructure/prisma"
import {
  ensureOwnProfessionalProfile,
  requestProfessionalAffiliation,
  transitionProfessionalAffiliation,
} from "@/lib/provider/affiliation-service"

const userIds = new Set<string>()
const providerIds = new Set<string>()
const affiliationIds = new Set<string>()

function context(label: string): RequestContext {
  return {
    correlationId: `affiliation-${label}-${randomUUID()}`,
    ipAddress: "127.0.0.1",
    userAgent: "vitest-provider-affiliation",
  }
}

async function principal(label: string): Promise<SessionPrincipal> {
  const user = await prisma.user.create({
    data: {
      mobileNormalized: `092${randomInt(10_000_000, 99_999_999)}`,
      status: "ACTIVE",
      identityStatus: "VERIFIED",
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

async function approvedProvider(
  owner: SessionPrincipal,
  type: "SINGLE_SALON" | "INDEPENDENT_PROFESSIONAL",
  label: string,
) {
  const provider = await prisma.providerOrganization.create({
    data: {
      ownerUserId: owner.userId,
      type,
      status: "APPROVED",
      nameFa: `ارائه‌دهنده ${label}`,
      normalizedName: `provider-${label}`,
      slug: `provider-${label}-${randomUUID()}`,
      verificationAt: new Date(),
      bookingEnabled: true,
    },
  })
  providerIds.add(provider.id)
  return provider
}

afterEach(async () => {
  if (affiliationIds.size) {
    await prisma.professionalAffiliation.deleteMany({
      where: { id: { in: [...affiliationIds] } },
    })
  }
  if (userIds.size) {
    await prisma.professionalProfile.deleteMany({
      where: { userId: { in: [...userIds] } },
    })
  }
  if (providerIds.size) {
    await prisma.auditLog.deleteMany({
      where: { scopeId: { in: [...providerIds] } },
    })
    await prisma.providerOrganization.deleteMany({
      where: { id: { in: [...providerIds] } },
    })
  }
  if (userIds.size) {
    await prisma.auditLog.deleteMany({ where: { actorUserId: { in: [...userIds] } } })
    await prisma.userRole.deleteMany({ where: { userId: { in: [...userIds] } } })
    await prisma.session.deleteMany({ where: { userId: { in: [...userIds] } } })
    await prisma.user.deleteMany({ where: { id: { in: [...userIds] } } })
  }
  affiliationIds.clear()
  providerIds.clear()
  userIds.clear()
})

describe("professional affiliation integration", () => {
  it("requires professional acceptance and provider acceptance for termination", async () => {
    const salonOwner = await principal("salon-owner")
    const professionalOwner = await principal("professional")
    const salon = await approvedProvider(salonOwner, "SINGLE_SALON", "salon")
    await approvedProvider(professionalOwner, "INDEPENDENT_PROFESSIONAL", "professional")

    const professional = await ensureOwnProfessionalProfile(
      professionalOwner,
      { displayNameFa: "متخصص آزمایشی" },
      context("ensure-profile"),
    )
    const requested = await requestProfessionalAffiliation(
      salonOwner,
      {
        organizationId: salon.id,
        professionalProfileId: professional.id,
        permissions: { bookingRead: true },
      },
      context("request-by-provider"),
    )
    affiliationIds.add(requested.id)
    expect(requested.status).toBe("REQUESTED_BY_PROVIDER")

    await expect(
      transitionProfessionalAffiliation(
        salonOwner,
        requested.id,
        { action: "ACCEPT" },
        context("invalid-self-accept"),
      ),
    ).rejects.toMatchObject({ code: "AFFILIATION_COUNTERPART_REQUIRED" })

    const active = await transitionProfessionalAffiliation(
      professionalOwner,
      requested.id,
      { action: "ACCEPT" },
      context("professional-accept"),
    )
    expect(active.status).toBe("ACTIVE")
    expect(active.startsAt).toBeInstanceOf(Date)

    const termination = await transitionProfessionalAffiliation(
      professionalOwner,
      requested.id,
      { action: "REQUEST_TERMINATION" },
      context("professional-termination-request"),
    )
    expect(termination.status).toBe("TERMINATION_REQUESTED")

    const ended = await transitionProfessionalAffiliation(
      salonOwner,
      requested.id,
      { action: "ACCEPT_TERMINATION" },
      context("provider-termination-accept"),
    )
    expect(ended.status).toBe("ENDED")
    expect(ended.endsAt).toBeInstanceOf(Date)

    const audit = await prisma.auditLog.findMany({
      where: { resourceId: requested.id },
      orderBy: { createdAt: "asc" },
    })
    expect(audit.map((row) => row.action)).toEqual([
      "professional.affiliation.requested",
      "professional.affiliation.accept",
      "professional.affiliation.request_termination",
      "professional.affiliation.accept_termination",
    ])
  })

  it("allows a professional to request an affiliation and only the provider owner to respond", async () => {
    const salonOwner = await principal("salon-owner-two")
    const professionalOwner = await principal("professional-two")
    const outsider = await principal("outsider")
    const salon = await approvedProvider(salonOwner, "SINGLE_SALON", "salon-two")
    await approvedProvider(professionalOwner, "INDEPENDENT_PROFESSIONAL", "professional-two")

    await ensureOwnProfessionalProfile(
      professionalOwner,
      { displayNameFa: "متخصص دوم" },
      context("ensure-profile-two"),
    )
    const requested = await requestProfessionalAffiliation(
      professionalOwner,
      { organizationId: salon.id },
      context("request-by-professional"),
    )
    affiliationIds.add(requested.id)
    expect(requested.status).toBe("REQUESTED_BY_PROFESSIONAL")

    await expect(
      transitionProfessionalAffiliation(
        outsider,
        requested.id,
        { action: "REJECT" },
        context("outsider-reject"),
      ),
    ).rejects.toMatchObject({ code: "FORBIDDEN" })

    const rejected = await transitionProfessionalAffiliation(
      salonOwner,
      requested.id,
      { action: "REJECT" },
      context("provider-reject"),
    )
    expect(rejected.status).toBe("REJECTED")
  })
})
