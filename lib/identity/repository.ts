import { Prisma, type PrismaClient } from "@prisma/client"

import { prisma } from "@/lib/infrastructure/prisma"
import type { IdentityDecisionStatus } from "@/lib/identity/types"

type DbClient = PrismaClient | Prisma.TransactionClient

export class IdentityRepository {
  constructor(private readonly database: PrismaClient = prisma) {}

  transaction<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.database.$transaction(operation, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    })
  }

  async userProfile(userId: string) {
    return this.database.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        mobileNormalized: true,
        identityStatus: true,
        profile: { select: { firstName: true, lastName: true } },
      },
    })
  }

  async latestAttempt(userId: string) {
    return this.database.identityVerificationAttempt.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        providerKey: true,
        submittedAt: true,
        decidedAt: true,
        decisionReasonCode: true,
      },
    })
  }

  async createSubmission(
    db: DbClient,
    input: {
      id: string
      userId: string
      providerKey: string
      nationalIdHmac: string
      encryptedNationalId: string
      encryptionKeyVersion: string
      mobileHmac: string
      nameFingerprint: string
      now: Date
      correlationId: string
    },
  ) {
    const duplicate = await db.sensitiveIdentity.findUnique({
      where: { nationalIdHmac: input.nationalIdHmac },
      select: { userId: true },
    })
    if (duplicate && duplicate.userId !== input.userId) {
      throw new Error("IDENTITY_ALREADY_USED")
    }

    await db.sensitiveIdentity.upsert({
      where: { userId: input.userId },
      update: {
        nationalIdHmac: input.nationalIdHmac,
        encryptedNationalId: input.encryptedNationalId,
        encryptionKeyVersion: input.encryptionKeyVersion,
        verifiedAt: null,
      },
      create: {
        userId: input.userId,
        nationalIdHmac: input.nationalIdHmac,
        encryptedNationalId: input.encryptedNationalId,
        encryptionKeyVersion: input.encryptionKeyVersion,
      },
    })

    const attempt = await db.identityVerificationAttempt.create({
      data: {
        id: input.id,
        userId: input.userId,
        providerKey: input.providerKey,
        status: "PENDING",
        nationalIdHmac: input.nationalIdHmac,
        mobileHmac: input.mobileHmac,
        nameFingerprint: input.nameFingerprint,
        submittedAt: input.now,
      },
    })

    await db.user.update({
      where: { id: input.userId },
      data: { identityStatus: "PENDING" },
    })

    await db.auditLog.create({
      data: {
        actorUserId: input.userId,
        action: "identity.verification.submitted",
        resourceType: "IdentityVerificationAttempt",
        resourceId: attempt.id,
        scopeType: "USER",
        scopeId: input.userId,
        correlationId: input.correlationId,
        metadata: {
          providerKey: input.providerKey,
          nationalIdFingerprint: input.nationalIdHmac.slice(0, 24),
        } as Prisma.InputJsonValue,
      },
    })

    return attempt
  }

  async finalizeDecision(
    db: DbClient,
    input: {
      attemptId: string
      userId: string
      status: IdentityDecisionStatus
      providerReference: string
      reasonCode?: string
      now: Date
      correlationId: string
    },
  ) {
    const userIdentityStatus = input.status === "VERIFIED"
      ? "VERIFIED"
      : input.status === "REJECTED"
        ? "REJECTED"
        : "PENDING"

    const attempt = await db.identityVerificationAttempt.update({
      where: { id: input.attemptId },
      data: {
        status: input.status,
        providerReference: input.providerReference,
        decisionReasonCode: input.reasonCode ?? null,
        decidedAt: input.now,
      },
    })

    await db.user.update({
      where: { id: input.userId },
      data: { identityStatus: userIdentityStatus },
    })

    await db.sensitiveIdentity.update({
      where: { userId: input.userId },
      data: { verifiedAt: input.status === "VERIFIED" ? input.now : null },
    })

    await db.auditLog.create({
      data: {
        actorUserId: input.userId,
        action: `identity.verification.${input.status.toLowerCase()}`,
        resourceType: "IdentityVerificationAttempt",
        resourceId: attempt.id,
        scopeType: "USER",
        scopeId: input.userId,
        correlationId: input.correlationId,
        metadata: {
          providerKey: attempt.providerKey,
          reasonCode: input.reasonCode ?? null,
        } as Prisma.InputJsonValue,
      },
    })

    return attempt
  }

  async sensitiveIdentity(userId: string) {
    return this.database.sensitiveIdentity.findUnique({
      where: { userId },
      select: {
        id: true,
        userId: true,
        encryptedNationalId: true,
        encryptionKeyVersion: true,
        verifiedAt: true,
      },
    })
  }

  async auditSensitiveRead(input: {
    actorUserId: string
    targetUserId: string
    resourceId: string
    reason: string
    correlationId: string
  }): Promise<void> {
    await this.database.auditLog.create({
      data: {
        actorUserId: input.actorUserId,
        action: "identity.sensitive-data.read",
        resourceType: "SensitiveIdentity",
        resourceId: input.resourceId,
        scopeType: "USER",
        scopeId: input.targetUserId,
        reason: input.reason,
        correlationId: input.correlationId,
      },
    })
  }
}

export const identityRepository = new IdentityRepository()
