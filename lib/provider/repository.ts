import { Prisma, type PrismaClient } from "@prisma/client"

import { authRepository } from "@/lib/auth/repository"
import type { RequestContext, SessionPrincipal } from "@/lib/auth/types"
import { prisma } from "@/lib/infrastructure/prisma"
import type { ProviderMode, ReviewAction } from "@/lib/provider/types"
import { providerTypeForMode, roleForProviderMode } from "@/lib/provider/types"

type DbClient = PrismaClient | Prisma.TransactionClient

export class ProviderRepository {
  constructor(private readonly database: PrismaClient = prisma) {}

  transaction<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.database.$transaction(operation, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
  }

  async createProvider(input: {
    principal: SessionPrincipal
    mode: ProviderMode
    nameFa: string
    normalizedName: string
    legalName: string
    publicPhone?: string | null
    privatePhone: string
    description?: string | null
    slug: string
    context: RequestContext
  }) {
    return this.transaction(async (tx) => {
      const provider = await tx.providerOrganization.create({
        data: {
          ownerUserId: input.principal.userId,
          type: providerTypeForMode(input.mode),
          status: "DRAFT",
          nameFa: input.nameFa,
          normalizedName: input.normalizedName,
          slug: input.slug,
          bookingEnabled: false,
        },
      })

      await tx.providerApplication.create({
        data: {
          providerId: provider.id,
          ownerUserId: input.principal.userId,
          providerMode: input.mode,
          legalName: input.legalName,
          publicPhone: input.publicPhone ?? null,
          privatePhone: input.privatePhone,
          description: input.description ?? null,
          status: "DRAFT",
        },
      })

      await authRepository.ensureUserRole(tx, input.principal.userId, roleForProviderMode(input.mode))
      await tx.auditLog.create({
        data: {
          actorUserId: input.principal.userId,
          action: "provider.onboarding.created",
          resourceType: "ProviderOrganization",
          resourceId: provider.id,
          scopeType: "PROVIDER",
          scopeId: provider.id,
          correlationId: input.context.correlationId,
          metadata: { providerMode: input.mode } as Prisma.InputJsonValue,
        },
      })

      return provider
    })
  }

  async ownedProvider(userId: string, providerId: string) {
    const provider = await this.database.providerOrganization.findFirst({
      where: { id: providerId, ownerUserId: userId, deletedAt: null },
    })
    if (!provider) return null
    const application = await this.database.providerApplication.findUnique({ where: { providerId } })
    const documents = await this.database.providerDocument.findMany({
      where: { providerId },
      orderBy: { createdAt: "desc" },
    })
    return { provider, application, documents }
  }

  async ownedProviders(userId: string) {
    const providers = await this.database.providerOrganization.findMany({
      where: { ownerUserId: userId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    })
    const applications = await this.database.providerApplication.findMany({
      where: { ownerUserId: userId },
    })
    const applicationByProvider = new Map(applications.map((application) => [application.providerId, application]))
    return providers.map((provider) => ({ provider, application: applicationByProvider.get(provider.id) ?? null }))
  }

  async createDocument(input: {
    principal: SessionPrincipal
    providerId: string
    fileAsset: {
      id: string
      objectKey: string
      originalFileName: string
      mimeType: string
      sizeBytes: bigint
      contentHash: string
      scanStatus: "CLEAN" | "REJECTED" | "FAILED"
      visibility: "PRIVATE" | "QUARANTINED"
      metadata: Prisma.InputJsonValue
    }
    documentId: string
    documentType: string
    expiresAt?: Date | null
    context: RequestContext
  }) {
    return this.transaction(async (tx) => {
      const provider = await tx.providerOrganization.findFirst({
        where: { id: input.providerId, ownerUserId: input.principal.userId, deletedAt: null },
        select: { id: true },
      })
      if (!provider) return null

      const file = await tx.fileAsset.create({
        data: {
          id: input.fileAsset.id,
          ownerUserId: input.principal.userId,
          providerId: input.providerId,
          namespace: "provider-private-documents",
          objectKey: input.fileAsset.objectKey,
          visibility: input.fileAsset.visibility,
          originalFileName: input.fileAsset.originalFileName,
          mimeType: input.fileAsset.mimeType,
          sizeBytes: input.fileAsset.sizeBytes,
          contentHash: input.fileAsset.contentHash,
          scanStatus: input.fileAsset.scanStatus,
          metadata: input.fileAsset.metadata,
        },
      })

      const document = await tx.providerDocument.create({
        data: {
          id: input.documentId,
          providerId: input.providerId,
          ownerUserId: input.principal.userId,
          fileAssetId: file.id,
          documentType: input.documentType,
          expiresAt: input.expiresAt ?? null,
          status: input.fileAsset.scanStatus === "CLEAN" ? "PENDING_REVIEW" : "REJECTED",
          reviewReason: input.fileAsset.scanStatus === "CLEAN" ? null : "FILE_SCAN_REJECTED",
        },
      })

      await tx.auditLog.create({
        data: {
          actorUserId: input.principal.userId,
          action: "provider.document.uploaded",
          resourceType: "ProviderDocument",
          resourceId: document.id,
          scopeType: "PROVIDER",
          scopeId: input.providerId,
          correlationId: input.context.correlationId,
          metadata: {
            documentType: input.documentType,
            mimeType: input.fileAsset.mimeType,
            sizeBytes: input.fileAsset.sizeBytes.toString(),
            contentHash: input.fileAsset.contentHash,
            scanStatus: input.fileAsset.scanStatus,
          } as Prisma.InputJsonValue,
        },
      })

      return { document, file }
    })
  }

  async submitForReview(principal: SessionPrincipal, providerId: string, context: RequestContext) {
    return this.transaction(async (tx) => {
      const provider = await tx.providerOrganization.findFirst({
        where: { id: providerId, ownerUserId: principal.userId, deletedAt: null },
      })
      if (!provider) return null
      const application = await tx.providerApplication.findUnique({ where: { providerId } })
      const documentCount = await tx.providerDocument.count({
        where: { providerId, status: { in: ["PENDING_REVIEW", "APPROVED"] } },
      })
      if (!application || documentCount === 0) throw new Error("PROVIDER_DOCUMENT_REQUIRED")

      const now = new Date()
      await tx.providerOrganization.update({
        where: { id: providerId },
        data: { status: "PENDING_REVIEW", bookingEnabled: false },
      })
      const updated = await tx.providerApplication.update({
        where: { providerId },
        data: { status: "PENDING_REVIEW", submittedAt: now, reviewReason: null },
      })
      await tx.auditLog.create({
        data: {
          actorUserId: principal.userId,
          action: "provider.onboarding.submitted",
          resourceType: "ProviderOrganization",
          resourceId: providerId,
          scopeType: "PROVIDER",
          scopeId: providerId,
          correlationId: context.correlationId,
        },
      })
      return updated
    })
  }

  async reviewDocument(input: {
    principal: SessionPrincipal
    documentId: string
    action: ReviewAction
    reason?: string | null
    context: RequestContext
  }) {
    return this.transaction(async (tx) => {
      const document = await tx.providerDocument.findUnique({ where: { id: input.documentId } })
      if (!document) return null
      const status = input.action === "APPROVE" ? "APPROVED" : input.action === "REJECT" ? "REJECTED" : "NEEDS_CORRECTION"
      const now = new Date()
      const updated = await tx.providerDocument.update({
        where: { id: input.documentId },
        data: {
          status,
          reviewReason: input.reason ?? null,
          reviewedAt: now,
          reviewedByUserId: input.principal.userId,
          appealStatus: null,
          appealReason: null,
          appealedAt: null,
        },
      })
      await tx.auditLog.create({
        data: {
          actorUserId: input.principal.userId,
          action: `provider.document.${status.toLowerCase()}`,
          resourceType: "ProviderDocument",
          resourceId: updated.id,
          scopeType: "PROVIDER",
          scopeId: updated.providerId,
          reason: input.reason ?? null,
          correlationId: input.context.correlationId,
        },
      })
      return updated
    })
  }

  async reviewProvider(input: {
    principal: SessionPrincipal
    providerId: string
    action: ReviewAction
    reason?: string | null
    context: RequestContext
  }) {
    return this.transaction(async (tx) => {
      const provider = await tx.providerOrganization.findUnique({ where: { id: input.providerId } })
      const application = await tx.providerApplication.findUnique({ where: { providerId: input.providerId } })
      if (!provider || !application) return null

      const documents = await tx.providerDocument.findMany({ where: { providerId: input.providerId } })
      const now = new Date()
      if (input.action === "APPROVE") {
        if (documents.length === 0 || documents.some((document) => document.status !== "APPROVED" || (document.expiresAt && document.expiresAt <= now))) {
          throw new Error("PROVIDER_DOCUMENTS_NOT_APPROVED")
        }
      }

      const status = input.action === "APPROVE" ? "APPROVED" : input.action === "REJECT" ? "REJECTED" : "NEEDS_CORRECTION"
      const updatedProvider = await tx.providerOrganization.update({
        where: { id: input.providerId },
        data: {
          status,
          bookingEnabled: status === "APPROVED",
          verificationAt: status === "APPROVED" ? now : null,
        },
      })
      await tx.providerApplication.update({
        where: { providerId: input.providerId },
        data: {
          status,
          reviewedAt: now,
          reviewedByUserId: input.principal.userId,
          reviewReason: input.reason ?? null,
          appealStatus: null,
          appealReason: null,
          appealedAt: null,
        },
      })
      await tx.auditLog.create({
        data: {
          actorUserId: input.principal.userId,
          action: `provider.onboarding.${status.toLowerCase()}`,
          resourceType: "ProviderOrganization",
          resourceId: input.providerId,
          scopeType: "PROVIDER",
          scopeId: input.providerId,
          reason: input.reason ?? null,
          correlationId: input.context.correlationId,
        },
      })
      return updatedProvider
    })
  }

  async appealProvider(principal: SessionPrincipal, providerId: string, reason: string, context: RequestContext) {
    return this.transaction(async (tx) => {
      const provider = await tx.providerOrganization.findFirst({
        where: { id: providerId, ownerUserId: principal.userId, status: "REJECTED" },
      })
      if (!provider) return null
      await tx.providerOrganization.update({ where: { id: providerId }, data: { status: "PENDING_REVIEW", bookingEnabled: false } })
      const application = await tx.providerApplication.update({
        where: { providerId },
        data: { status: "APPEALED", appealStatus: "PENDING", appealReason: reason, appealedAt: new Date() },
      })
      await tx.auditLog.create({
        data: {
          actorUserId: principal.userId,
          action: "provider.onboarding.appealed",
          resourceType: "ProviderOrganization",
          resourceId: providerId,
          scopeType: "PROVIDER",
          scopeId: providerId,
          reason,
          correlationId: context.correlationId,
        },
      })
      return application
    })
  }

  async documentWithFile(documentId: string) {
    const document = await this.database.providerDocument.findUnique({ where: { id: documentId } })
    if (!document) return null
    const file = await this.database.fileAsset.findUnique({ where: { id: document.fileAssetId } })
    return file ? { document, file } : null
  }

  async auditDocumentAccess(db: DbClient, input: {
    actorUserId: string
    documentId: string
    providerId: string
    reason: string
    correlationId: string
  }): Promise<void> {
    await db.auditLog.create({
      data: {
        actorUserId: input.actorUserId,
        action: "provider.document.private-read",
        resourceType: "ProviderDocument",
        resourceId: input.documentId,
        scopeType: "PROVIDER",
        scopeId: input.providerId,
        reason: input.reason,
        correlationId: input.correlationId,
      },
    })
  }
}

export const providerRepository = new ProviderRepository()
