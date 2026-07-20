import { randomUUID } from "node:crypto"
import { z } from "zod"

import { AuthError } from "@/lib/auth/errors"
import type { RequestContext, SessionPrincipal } from "@/lib/auth/types"
import { normalizeIranMobile, normalizePersianText, normalizeSearchText } from "@/lib/localization/normalize-fa"
import { appealProviderDocument } from "@/lib/provider/appeals"
import { assertProviderPublicAndBookable, assertRecentProviderReviewStepUp } from "@/lib/provider/policy"
import { providerRepository } from "@/lib/provider/repository"
import { providerModes, type ReviewAction } from "@/lib/provider/types"
import { validatePrivateDocument } from "@/lib/storage/file-validation"
import { malwareScanner } from "@/lib/storage/malware-scan"
import { objectStorage } from "@/lib/storage/object-storage"

const providerModeSchema = z.enum(providerModes)
const reviewActionSchema = z.enum(["APPROVE", "REJECT", "REQUEST_CORRECTION"])
const documentTypeSchema = z.enum([
  "NATIONAL_CARD",
  "BUSINESS_LICENSE",
  "PROFESSIONAL_CERTIFICATE",
  "ADDRESS_PROOF",
  "OTHER",
])

const createProviderSchema = z.object({
  mode: providerModeSchema,
  nameFa: z.string().trim().min(2).max(180),
  legalName: z.string().trim().min(2).max(220),
  publicPhone: z.string().trim().optional(),
  privatePhone: z.string().trim().min(10).max(20),
  description: z.string().trim().max(4000).optional(),
})

const documentMetadataSchema = z.object({
  documentType: documentTypeSchema,
  expiresAt: z.string().datetime().optional(),
})

const reviewSchema = z.object({
  action: reviewActionSchema,
  reason: z.string().trim().max(2000).optional(),
}).superRefine((input, context) => {
  if (input.action !== "APPROVE" && (!input.reason || input.reason.length < 5)) {
    context.addIssue({ code: "custom", path: ["reason"], message: "Reason is required for rejection or correction" })
  }
})

const appealSchema = z.object({ reason: z.string().trim().min(10).max(2000) })

export async function createProviderApplication(
  principal: SessionPrincipal,
  rawInput: unknown,
  context: RequestContext,
) {
  const input = createProviderSchema.parse(rawInput)
  const nameFa = normalizePersianText(input.nameFa)
  const legalName = normalizePersianText(input.legalName)
  const publicPhone = input.publicPhone ? normalizeIranMobile(input.publicPhone) : null
  const privatePhone = normalizeIranMobile(input.privatePhone)

  return providerRepository.createProvider({
    principal,
    mode: input.mode,
    nameFa,
    normalizedName: normalizeSearchText(nameFa),
    legalName,
    publicPhone,
    privatePhone,
    description: input.description ? normalizePersianText(input.description) : null,
    slug: `provider-${randomUUID()}`,
    context,
  })
}

export async function listMyProviderApplications(principal: SessionPrincipal) {
  return providerRepository.ownedProviders(principal.userId)
}

export async function getMyProviderApplication(principal: SessionPrincipal, providerId: string) {
  const provider = await providerRepository.ownedProvider(principal.userId, z.string().uuid().parse(providerId))
  if (!provider) throw new AuthError("PROVIDER_NOT_FOUND", "پرونده ارائه‌دهنده یافت نشد.", 404)
  return provider
}

export async function uploadProviderDocument(
  principal: SessionPrincipal,
  providerId: string,
  rawMetadata: unknown,
  file: { bytes: Uint8Array; mimeType: string; originalFileName: string },
  context: RequestContext,
) {
  const validatedProviderId = z.string().uuid().parse(providerId)
  const owned = await providerRepository.ownedProvider(principal.userId, validatedProviderId)
  if (!owned) throw new AuthError("PROVIDER_NOT_FOUND", "پرونده ارائه‌دهنده یافت نشد.", 404)
  const metadata = documentMetadataSchema.parse(rawMetadata)
  const validated = validatePrivateDocument(file)
  const scan = await malwareScanner().scan(validated)
  const storage = objectStorage()
  const documentId = randomUUID()
  const fileAssetId = randomUUID()
  const objectKey = `providers/${validatedProviderId}/documents/${documentId}/${validated.safeFileName}`

  await storage.putPrivate({ objectKey, bytes: validated.bytes, mimeType: validated.mimeType })
  try {
    const created = await providerRepository.createDocument({
      principal,
      providerId: validatedProviderId,
      fileAsset: {
        id: fileAssetId,
        objectKey,
        originalFileName: validated.safeFileName,
        mimeType: validated.mimeType,
        sizeBytes: BigInt(validated.sizeBytes),
        contentHash: validated.contentHash,
        scanStatus: scan.status,
        visibility: scan.status === "CLEAN" ? "PRIVATE" : "QUARANTINED",
        metadata: {
          storageProvider: storage.key,
          malwareProvider: scan.providerKey,
          malwareReasonCode: scan.reasonCode ?? null,
        },
      },
      documentId,
      documentType: metadata.documentType,
      expiresAt: metadata.expiresAt ? new Date(metadata.expiresAt) : null,
      context,
    })
    if (!created) {
      await storage.deletePrivate(objectKey)
      throw new AuthError("PROVIDER_NOT_FOUND", "پرونده ارائه‌دهنده یافت نشد.", 404)
    }
    return created.document
  } catch (error) {
    await storage.deletePrivate(objectKey).catch(() => undefined)
    throw error
  }
}

export async function submitProviderApplication(
  principal: SessionPrincipal,
  providerId: string,
  context: RequestContext,
) {
  try {
    const result = await providerRepository.submitForReview(principal, z.string().uuid().parse(providerId), context)
    if (!result) throw new AuthError("PROVIDER_NOT_FOUND", "پرونده ارائه‌دهنده یافت نشد.", 404)
    return result
  } catch (error) {
    if (error instanceof Error && error.message === "PROVIDER_DOCUMENT_REQUIRED") {
      throw new AuthError("PROVIDER_DOCUMENT_REQUIRED", "حداقل یک مدرک سالم باید ارسال شود.", 409)
    }
    throw error
  }
}

export async function reviewProviderDocument(
  principal: SessionPrincipal,
  documentId: string,
  rawInput: unknown,
  context: RequestContext,
) {
  assertRecentProviderReviewStepUp(principal)
  const input = reviewSchema.parse(rawInput)
  const result = await providerRepository.reviewDocument({
    principal,
    documentId: z.string().uuid().parse(documentId),
    action: input.action as ReviewAction,
    reason: input.reason,
    context,
  })
  if (!result) throw new AuthError("DOCUMENT_NOT_FOUND", "مدرک یافت نشد.", 404)
  return result
}

export async function reviewProviderApplication(
  principal: SessionPrincipal,
  providerId: string,
  rawInput: unknown,
  context: RequestContext,
) {
  assertRecentProviderReviewStepUp(principal)
  const input = reviewSchema.parse(rawInput)
  try {
    const result = await providerRepository.reviewProvider({
      principal,
      providerId: z.string().uuid().parse(providerId),
      action: input.action as ReviewAction,
      reason: input.reason,
      context,
    })
    if (!result) throw new AuthError("PROVIDER_NOT_FOUND", "پرونده ارائه‌دهنده یافت نشد.", 404)
    return result
  } catch (error) {
    if (error instanceof Error && error.message === "PROVIDER_DOCUMENTS_NOT_APPROVED") {
      throw new AuthError("PROVIDER_DOCUMENTS_NOT_APPROVED", "همه مدارک باید تأییدشده و معتبر باشند.", 409)
    }
    throw error
  }
}

export async function appealProviderApplication(
  principal: SessionPrincipal,
  providerId: string,
  rawInput: unknown,
  context: RequestContext,
) {
  const input = appealSchema.parse(rawInput)
  const result = await providerRepository.appealProvider(principal, z.string().uuid().parse(providerId), input.reason, context)
  if (!result) throw new AuthError("PROVIDER_NOT_APPEALABLE", "این پرونده قابل اعتراض نیست.", 409)
  return result
}

export async function appealDocument(
  principal: SessionPrincipal,
  documentId: string,
  rawInput: unknown,
  context: RequestContext,
) {
  const input = appealSchema.parse(rawInput)
  return appealProviderDocument(principal, z.string().uuid().parse(documentId), input.reason, context)
}

export async function readPrivateProviderDocument(
  principal: SessionPrincipal,
  documentId: string,
  reason: string | null,
  context: RequestContext,
) {
  const record = await providerRepository.documentWithFile(z.string().uuid().parse(documentId))
  if (!record) throw new AuthError("DOCUMENT_NOT_FOUND", "مدرک یافت نشد.", 404)

  const isOwner = record.document.ownerUserId === principal.userId
  if (!isOwner) assertRecentProviderReviewStepUp(principal)
  const accessReason = isOwner
    ? "مشاهده مدرک توسط مالک پرونده"
    : z.string().trim().min(10).max(500).parse(reason)

  const object = await objectStorage().getPrivate(record.file.objectKey)
  await providerRepository.transaction((tx) => providerRepository.auditDocumentAccess(tx, {
    actorUserId: principal.userId,
    documentId: record.document.id,
    providerId: record.document.providerId,
    reason: accessReason,
    correlationId: context.correlationId,
  }))

  return { ...object, fileName: record.file.originalFileName || "document" }
}

export async function assertProviderCanReceiveBooking(providerId: string) {
  const provider = await providerRepository.ownedProvider("00000000-0000-0000-0000-000000000000", providerId)
  if (provider) {
    assertProviderPublicAndBookable(provider.provider)
    return provider.provider
  }
  const databaseProvider = await import("@/lib/infrastructure/prisma").then(({ prisma }) => prisma.providerOrganization.findUnique({ where: { id: providerId } }))
  if (!databaseProvider) throw new AuthError("PROVIDER_NOT_FOUND", "ارائه‌دهنده یافت نشد.", 404)
  assertProviderPublicAndBookable(databaseProvider)
  return databaseProvider
}
