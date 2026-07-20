import { randomInt } from "node:crypto"
import { afterEach, beforeAll, describe, expect, it } from "vitest"

import { requestCustomerOtp, updateOwnProfile, verifyCustomerOtp } from "@/lib/auth/service"
import type { RequestContext, SessionPrincipal } from "@/lib/auth/types"
import {
  appealProviderApplication,
  createProviderApplication,
  readPrivateProviderDocument,
  reviewProviderApplication,
  reviewProviderDocument,
  submitProviderApplication,
  uploadProviderDocument,
} from "@/lib/provider/service"
import { assertProviderPublicAndBookable } from "@/lib/provider/policy"
import { prisma } from "@/lib/infrastructure/prisma"

const createdUserIds = new Set<string>()
const createdProviderIds = new Set<string>()
const createdMobiles = new Set<string>()

function mobile(): string {
  const value = `093${randomInt(10_000_000, 99_999_999)}`
  createdMobiles.add(value)
  return value
}

function context(label: string): RequestContext {
  return {
    correlationId: `provider-${label}-${Date.now()}-${randomInt(1000, 9999)}`,
    ipAddress: `127.0.4.${randomInt(2, 240)}`,
    userAgent: "vitest-provider-onboarding",
  }
}

async function authenticatedCustomer(): Promise<SessionPrincipal> {
  const value = mobile()
  const challenge = await requestCustomerOtp(value, context("otp-request"))
  const session = await verifyCustomerOtp({
    mobile: value,
    challengeId: challenge.challengeId,
    code: challenge.developmentCode,
  }, context("otp-verify"))
  createdUserIds.add(session.principal.userId)
  await updateOwnProfile(session.principal, { firstName: "کاربر", lastName: "آزمایشی" }, context("profile"))
  return session.principal
}

async function reviewer(): Promise<SessionPrincipal> {
  const user = await prisma.user.create({ data: { mobileNormalized: mobile(), status: "ACTIVE" } })
  createdUserIds.add(user.id)
  return {
    sessionId: `reviewer-${user.id}`,
    userId: user.id,
    mobileNormalized: user.mobileNormalized,
    userStatus: "ACTIVE",
    identityStatus: "UNVERIFIED",
    authMethod: "PASSWORD_2FA",
    twoFactorVerifiedAt: new Date(),
    mustChangePassword: false,
    roleKeys: ["identity_specialist"],
    permissions: ["identity.review"],
  }
}

function pdfFile(): { bytes: Uint8Array; mimeType: string; originalFileName: string } {
  return {
    bytes: new TextEncoder().encode("%PDF-1.4\nLuxe provider test document"),
    mimeType: "application/pdf",
    originalFileName: "license.pdf",
  }
}

beforeAll(() => {
  process.env.AUTH_SECRET ||= "provider-auth-secret-123456789"
  process.env.PASSWORD_PEPPER ||= "provider-password-pepper-123456789"
  process.env.SMS_PROVIDER = "mock"
  process.env.STORAGE_PROVIDER = "memory"
  process.env.MALWARE_SCAN_PROVIDER = "mock"
  process.env.APP_ENV = "test"
})

afterEach(async () => {
  for (const providerId of createdProviderIds) {
    const fileAssets = await prisma.fileAsset.findMany({ where: { providerId }, select: { id: true } })
    await prisma.providerDocument.deleteMany({ where: { providerId } })
    await prisma.providerApplication.deleteMany({ where: { providerId } })
    await prisma.auditLog.deleteMany({ where: { scopeId: providerId } })
    await prisma.providerOrganization.deleteMany({ where: { id: providerId } })
    await prisma.fileAsset.deleteMany({ where: { id: { in: fileAssets.map((file) => file.id) } } })
  }
  for (const userId of createdUserIds) {
    await prisma.session.deleteMany({ where: { userId } })
    await prisma.userRole.deleteMany({ where: { userId } })
    await prisma.auditLog.deleteMany({ where: { actorUserId: userId } })
    await prisma.$executeRaw`DELETE FROM "OtpChallenge" WHERE "userId" = ${userId}::uuid`
    await prisma.user.deleteMany({ where: { id: userId } })
  }
  for (const value of createdMobiles) {
    await prisma.$executeRaw`DELETE FROM "OtpChallenge" WHERE "mobileNormalized" = ${value}`
  }
  createdProviderIds.clear()
  createdUserIds.clear()
  createdMobiles.clear()
})

describe("provider onboarding and verification", () => {
  it("creates, uploads, submits, reviews and enables a provider only after final approval", async () => {
    const owner = await authenticatedCustomer()
    const provider = await createProviderApplication(owner, {
      mode: "SINGLE_SALON",
      nameFa: "سالن آزمایشی",
      legalName: "سالن آزمایشی رسمی",
      privatePhone: owner.mobileNormalized,
      publicPhone: owner.mobileNormalized,
    }, context("create"))
    createdProviderIds.add(provider.id)

    const document = await uploadProviderDocument(owner, provider.id, {
      documentType: "BUSINESS_LICENSE",
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }, pdfFile(), context("upload"))
    await submitProviderApplication(owner, provider.id, context("submit"))

    const pending = await prisma.providerOrganization.findUniqueOrThrow({ where: { id: provider.id } })
    expect(() => assertProviderPublicAndBookable(pending)).toThrow()

    const admin = await reviewer()
    await reviewProviderDocument(admin, document.id, { action: "APPROVE" }, context("document-approve"))
    const approved = await reviewProviderApplication(admin, provider.id, { action: "APPROVE" }, context("provider-approve"))

    expect(approved.status).toBe("APPROVED")
    expect(approved.bookingEnabled).toBe(true)
    expect(() => assertProviderPublicAndBookable(approved)).not.toThrow()
  })

  it("requires approved, unexpired documents before provider approval", async () => {
    const owner = await authenticatedCustomer()
    const provider = await createProviderApplication(owner, {
      mode: "INDEPENDENT_PROFESSIONAL",
      nameFa: "متخصص آزمایشی",
      legalName: "متخصص آزمایشی",
      privatePhone: owner.mobileNormalized,
    }, context("create-expired"))
    createdProviderIds.add(provider.id)
    const document = await uploadProviderDocument(owner, provider.id, {
      documentType: "PROFESSIONAL_CERTIFICATE",
      expiresAt: new Date(Date.now() - 60_000).toISOString(),
    }, pdfFile(), context("upload-expired"))
    await submitProviderApplication(owner, provider.id, context("submit-expired"))
    const admin = await reviewer()
    await reviewProviderDocument(admin, document.id, { action: "APPROVE" }, context("approve-expired-document"))

    await expect(reviewProviderApplication(admin, provider.id, { action: "APPROVE" }, context("approve-expired-provider")))
      .rejects.toMatchObject({ code: "PROVIDER_DOCUMENTS_NOT_APPROVED" })
  })

  it("records rejection, correction and provider appeal while preserving booking lock", async () => {
    const owner = await authenticatedCustomer()
    const provider = await createProviderApplication(owner, {
      mode: "HOME_SERVICE_PROFESSIONAL",
      nameFa: "خدمات منزل آزمایشی",
      legalName: "خدمات منزل آزمایشی",
      privatePhone: owner.mobileNormalized,
    }, context("create-reject"))
    createdProviderIds.add(provider.id)
    const document = await uploadProviderDocument(owner, provider.id, { documentType: "ADDRESS_PROOF" }, pdfFile(), context("upload-reject"))
    await submitProviderApplication(owner, provider.id, context("submit-reject"))
    const admin = await reviewer()
    await reviewProviderDocument(admin, document.id, { action: "REQUEST_CORRECTION", reason: "تصویر مدرک خوانا نیست" }, context("doc-correction"))
    await reviewProviderApplication(admin, provider.id, { action: "REJECT", reason: "مدارک پرونده کافی نیست" }, context("provider-reject"))

    const appeal = await appealProviderApplication(owner, provider.id, { reason: "مدرک خواناتر آماده و قابل ارائه است" }, context("provider-appeal"))
    expect(appeal.status).toBe("APPEALED")
    const current = await prisma.providerOrganization.findUniqueOrThrow({ where: { id: provider.id } })
    expect(current.bookingEnabled).toBe(false)
  })

  it("prevents cross-owner access and audits private document reads", async () => {
    const owner = await authenticatedCustomer()
    const other = await authenticatedCustomer()
    const provider = await createProviderApplication(owner, {
      mode: "HYBRID_PROFESSIONAL",
      nameFa: "متخصص ترکیبی آزمایشی",
      legalName: "متخصص ترکیبی آزمایشی",
      privatePhone: owner.mobileNormalized,
    }, context("create-private"))
    createdProviderIds.add(provider.id)
    const document = await uploadProviderDocument(owner, provider.id, { documentType: "OTHER" }, pdfFile(), context("upload-private"))

    await expect(uploadProviderDocument(other, provider.id, { documentType: "OTHER" }, pdfFile(), context("idor-upload")))
      .rejects.toMatchObject({ code: "PROVIDER_NOT_FOUND" })
    await expect(readPrivateProviderDocument(other, document.id, null, context("idor-read")))
      .rejects.toMatchObject({ code: "FORBIDDEN" })

    const readContext = context("owner-read")
    const file = await readPrivateProviderDocument(owner, document.id, null, readContext)
    expect(new TextDecoder().decode(file.bytes)).toContain("Luxe provider")
    const audit = await prisma.auditLog.findFirstOrThrow({ where: { correlationId: readContext.correlationId } })
    expect(audit.action).toBe("provider.document.private-read")
  })
})
