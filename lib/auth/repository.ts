import { Prisma, type PrismaClient } from "@prisma/client"

import { prisma } from "@/lib/infrastructure/prisma"
import type { AuthMethod, OtpPurpose, PermissionScope, SessionPrincipal } from "@/lib/auth/types"

type DbClient = PrismaClient | Prisma.TransactionClient

export type OtpChallengeRow = {
  id: string
  userId: string | null
  mobileNormalized: string
  purpose: OtpPurpose
  codeHash: string
  attemptCount: number
  maxAttempts: number
  expiresAt: Date
  resendAfter: Date
  consumedAt: Date | null
  invalidatedAt: Date | null
  createdAt: Date
}

export type CredentialRow = {
  userId: string
  passwordHash: string
  passwordAlgorithm: string
  mustChangePassword: boolean
  twoFactorRequired: boolean
  failedAttempts: number
  lockedUntil: Date | null
  mobileNormalized: string
  status: string
}

export type SessionRow = {
  id: string
  userId: string
  mobileNormalized: string
  status: string
  identityStatus: string
  authMethod: AuthMethod
  twoFactorVerifiedAt: Date | null
  expiresAt: Date
  idleExpiresAt: Date
  revokedAt: Date | null
}

type RateLimitRow = {
  keyHash: string
  action: string
  windowStartedAt: Date
  attemptCount: number
  blockedUntil: Date | null
}

export class AuthRepository {
  constructor(private readonly database: PrismaClient = prisma) {}

  transaction<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.database.$transaction(operation, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
  }

  async consumeRateLimit(
    db: DbClient,
    input: {
      keyHash: string
      action: string
      limit: number
      windowSeconds: number
      blockSeconds: number
      now: Date
    },
  ): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
    const rows = await db.$queryRaw<RateLimitRow[]>`
      SELECT "keyHash", "action", "windowStartedAt", "attemptCount", "blockedUntil"
      FROM "AuthRateLimit"
      WHERE "keyHash" = ${input.keyHash} AND "action" = ${input.action}
      FOR UPDATE
    `

    const current = rows[0]
    if (!current) {
      await db.$executeRaw`
        INSERT INTO "AuthRateLimit" (
          "keyHash", "action", "windowStartedAt", "attemptCount", "blockedUntil", "updatedAt"
        ) VALUES (
          ${input.keyHash}, ${input.action}, ${input.now}, 1, NULL, ${input.now}
        )
      `
      return { allowed: true, retryAfterSeconds: 0 }
    }

    if (current.blockedUntil && current.blockedUntil > input.now) {
      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, Math.ceil((current.blockedUntil.getTime() - input.now.getTime()) / 1000)),
      }
    }

    const windowEndsAt = new Date(current.windowStartedAt.getTime() + input.windowSeconds * 1000)
    if (windowEndsAt <= input.now) {
      await db.$executeRaw`
        UPDATE "AuthRateLimit"
        SET "windowStartedAt" = ${input.now}, "attemptCount" = 1, "blockedUntil" = NULL, "updatedAt" = ${input.now}
        WHERE "keyHash" = ${input.keyHash} AND "action" = ${input.action}
      `
      return { allowed: true, retryAfterSeconds: 0 }
    }

    const nextCount = current.attemptCount + 1
    if (nextCount > input.limit) {
      const blockedUntil = new Date(input.now.getTime() + input.blockSeconds * 1000)
      await db.$executeRaw`
        UPDATE "AuthRateLimit"
        SET "attemptCount" = ${nextCount}, "blockedUntil" = ${blockedUntil}, "updatedAt" = ${input.now}
        WHERE "keyHash" = ${input.keyHash} AND "action" = ${input.action}
      `
      return { allowed: false, retryAfterSeconds: input.blockSeconds }
    }

    await db.$executeRaw`
      UPDATE "AuthRateLimit"
      SET "attemptCount" = ${nextCount}, "updatedAt" = ${input.now}
      WHERE "keyHash" = ${input.keyHash} AND "action" = ${input.action}
    `
    return { allowed: true, retryAfterSeconds: 0 }
  }

  async latestActiveOtp(db: DbClient, mobile: string, purpose: OtpPurpose): Promise<OtpChallengeRow | null> {
    const rows = await db.$queryRaw<OtpChallengeRow[]>`
      SELECT
        "id", "userId", "mobileNormalized", "purpose", "codeHash", "attemptCount", "maxAttempts",
        "expiresAt", "resendAfter", "consumedAt", "invalidatedAt", "createdAt"
      FROM "OtpChallenge"
      WHERE "mobileNormalized" = ${mobile}
        AND "purpose" = ${purpose}
        AND "consumedAt" IS NULL
        AND "invalidatedAt" IS NULL
      ORDER BY "createdAt" DESC
      LIMIT 1
      FOR UPDATE
    `
    return rows[0] ?? null
  }

  async otpByIdForUpdate(db: DbClient, id: string, purpose: OtpPurpose): Promise<OtpChallengeRow | null> {
    const rows = await db.$queryRaw<OtpChallengeRow[]>`
      SELECT
        "id", "userId", "mobileNormalized", "purpose", "codeHash", "attemptCount", "maxAttempts",
        "expiresAt", "resendAfter", "consumedAt", "invalidatedAt", "createdAt"
      FROM "OtpChallenge"
      WHERE "id" = ${id}::uuid AND "purpose" = ${purpose}
      LIMIT 1
      FOR UPDATE
    `
    return rows[0] ?? null
  }

  async invalidateActiveOtp(db: DbClient, mobile: string, purpose: OtpPurpose, now: Date): Promise<void> {
    await db.$executeRaw`
      UPDATE "OtpChallenge"
      SET "invalidatedAt" = ${now}
      WHERE "mobileNormalized" = ${mobile}
        AND "purpose" = ${purpose}
        AND "consumedAt" IS NULL
        AND "invalidatedAt" IS NULL
    `
  }

  async createOtp(
    db: DbClient,
    input: {
      id: string
      userId?: string | null
      mobileNormalized: string
      purpose: OtpPurpose
      codeHash: string
      maxAttempts: number
      expiresAt: Date
      resendAfter: Date
      requestedIpHash?: string | null
      userAgentSummary?: string | null
      now: Date
    },
  ): Promise<void> {
    await db.$executeRaw`
      INSERT INTO "OtpChallenge" (
        "id", "userId", "mobileNormalized", "purpose", "codeHash", "attemptCount", "maxAttempts",
        "expiresAt", "resendAfter", "requestedIpHash", "userAgentSummary", "createdAt"
      ) VALUES (
        ${input.id}::uuid,
        ${input.userId ?? null}::uuid,
        ${input.mobileNormalized},
        ${input.purpose},
        ${input.codeHash},
        0,
        ${input.maxAttempts},
        ${input.expiresAt},
        ${input.resendAfter},
        ${input.requestedIpHash ?? null},
        ${input.userAgentSummary ?? null},
        ${input.now}
      )
    `
  }

  async invalidateOtpById(db: DbClient, id: string, now: Date): Promise<void> {
    await db.$executeRaw`
      UPDATE "OtpChallenge"
      SET "invalidatedAt" = ${now}
      WHERE "id" = ${id}::uuid AND "consumedAt" IS NULL
    `
  }

  async incrementOtpAttempt(db: DbClient, id: string): Promise<number> {
    const rows = await db.$queryRaw<Array<{ attemptCount: number }>>`
      UPDATE "OtpChallenge"
      SET "attemptCount" = "attemptCount" + 1
      WHERE "id" = ${id}::uuid
      RETURNING "attemptCount"
    `
    return rows[0]?.attemptCount ?? 0
  }

  async consumeOtp(db: DbClient, id: string, now: Date): Promise<void> {
    await db.$executeRaw`
      UPDATE "OtpChallenge"
      SET "consumedAt" = ${now}
      WHERE "id" = ${id}::uuid AND "consumedAt" IS NULL AND "invalidatedAt" IS NULL
    `
  }

  async upsertActiveUser(db: DbClient, mobileNormalized: string) {
    return db.user.upsert({
      where: { mobileNormalized },
      update: { status: "ACTIVE" },
      create: { mobileNormalized, status: "ACTIVE" },
    })
  }

  async ensureUserRole(db: DbClient, userId: string, roleKey: string): Promise<void> {
    const role = await db.role.findUnique({ where: { key: roleKey }, select: { id: true } })
    if (!role) throw new Error(`Required role is not seeded: ${roleKey}`)

    const existing = await db.userRole.findFirst({
      where: { userId, roleId: role.id, scopeType: "PLATFORM", scopeId: null, revokedAt: null },
      select: { id: true },
    })
    if (!existing) {
      await db.userRole.create({
        data: { userId, roleId: role.id, scopeType: "PLATFORM", scopeId: null },
      })
    }
  }

  async createSession(
    db: DbClient,
    input: {
      id: string
      userId: string
      tokenHash: string
      deviceIdHash?: string | null
      ipHash?: string | null
      userAgentSummary?: string | null
      authMethod: AuthMethod
      twoFactorVerifiedAt?: Date | null
      expiresAt: Date
      idleExpiresAt: Date
      now: Date
    },
  ): Promise<void> {
    await db.$executeRaw`
      INSERT INTO "Session" (
        "id", "userId", "tokenHash", "deviceIdHash", "ipHash", "userAgentSummary",
        "twoFactorVerifiedAt", "authMethod", "expiresAt", "idleExpiresAt", "lastSeenAt", "createdAt"
      ) VALUES (
        ${input.id}::uuid,
        ${input.userId}::uuid,
        ${input.tokenHash},
        ${input.deviceIdHash ?? null},
        ${input.ipHash ?? null},
        ${input.userAgentSummary ?? null},
        ${input.twoFactorVerifiedAt ?? null},
        ${input.authMethod},
        ${input.expiresAt},
        ${input.idleExpiresAt},
        ${input.now},
        ${input.now}
      )
    `
  }

  async sessionByTokenHash(tokenHash: string): Promise<SessionRow | null> {
    const rows = await this.database.$queryRaw<SessionRow[]>`
      SELECT
        s."id", s."userId", u."mobileNormalized", u."status", u."identityStatus",
        s."authMethod", s."twoFactorVerifiedAt", s."expiresAt", s."idleExpiresAt", s."revokedAt"
      FROM "Session" s
      INNER JOIN "User" u ON u."id" = s."userId"
      WHERE s."tokenHash" = ${tokenHash}
      LIMIT 1
    `
    return rows[0] ?? null
  }

  async touchSession(sessionId: string, idleExpiresAt: Date, now: Date): Promise<void> {
    await this.database.$executeRaw`
      UPDATE "Session"
      SET "lastSeenAt" = ${now}, "idleExpiresAt" = LEAST("expiresAt", ${idleExpiresAt})
      WHERE "id" = ${sessionId}::uuid AND "revokedAt" IS NULL
    `
  }

  async revokeSessionByHash(tokenHash: string, reason: string, now: Date): Promise<void> {
    await this.database.$executeRaw`
      UPDATE "Session"
      SET "revokedAt" = COALESCE("revokedAt", ${now}), "revocationReason" = ${reason}
      WHERE "tokenHash" = ${tokenHash}
    `
  }

  async revokeAllSessions(db: DbClient, userId: string, reason: string, now: Date): Promise<number> {
    return db.$executeRaw`
      UPDATE "Session"
      SET "revokedAt" = ${now}, "revocationReason" = ${reason}
      WHERE "userId" = ${userId}::uuid AND "revokedAt" IS NULL
    `
  }

  async credentialByMobile(mobileNormalized: string): Promise<CredentialRow | null> {
    const rows = await this.database.$queryRaw<CredentialRow[]>`
      SELECT
        c."userId", c."passwordHash", c."passwordAlgorithm", c."mustChangePassword",
        c."twoFactorRequired", c."failedAttempts", c."lockedUntil",
        u."mobileNormalized", u."status"
      FROM "LoginCredential" c
      INNER JOIN "User" u ON u."id" = c."userId"
      WHERE u."mobileNormalized" = ${mobileNormalized}
      LIMIT 1
    `
    return rows[0] ?? null
  }

  async credentialByUserId(db: DbClient, userId: string): Promise<CredentialRow | null> {
    const rows = await db.$queryRaw<CredentialRow[]>`
      SELECT
        c."userId", c."passwordHash", c."passwordAlgorithm", c."mustChangePassword",
        c."twoFactorRequired", c."failedAttempts", c."lockedUntil",
        u."mobileNormalized", u."status"
      FROM "LoginCredential" c
      INNER JOIN "User" u ON u."id" = c."userId"
      WHERE c."userId" = ${userId}::uuid
      LIMIT 1
      FOR UPDATE
    `
    return rows[0] ?? null
  }

  async registerFailedLogin(userId: string, failureLimit: number, lockedUntil: Date, now: Date): Promise<void> {
    await this.database.$executeRaw`
      UPDATE "LoginCredential"
      SET
        "failedAttempts" = "failedAttempts" + 1,
        "lockedUntil" = CASE WHEN "failedAttempts" + 1 >= ${failureLimit} THEN ${lockedUntil} ELSE "lockedUntil" END,
        "updatedAt" = ${now}
      WHERE "userId" = ${userId}::uuid
    `
  }

  async resetFailedLogin(db: DbClient, userId: string, now: Date): Promise<void> {
    await db.$executeRaw`
      UPDATE "LoginCredential"
      SET "failedAttempts" = 0, "lockedUntil" = NULL, "updatedAt" = ${now}
      WHERE "userId" = ${userId}::uuid
    `
  }

  async updatePassword(
    db: DbClient,
    userId: string,
    passwordHash: string,
    mustChangePassword: boolean,
    now: Date,
  ): Promise<void> {
    await db.$executeRaw`
      UPDATE "LoginCredential"
      SET
        "passwordHash" = ${passwordHash},
        "passwordAlgorithm" = 'scrypt-v1',
        "mustChangePassword" = ${mustChangePassword},
        "passwordChangedAt" = ${now},
        "failedAttempts" = 0,
        "lockedUntil" = NULL,
        "updatedAt" = ${now}
      WHERE "userId" = ${userId}::uuid
    `
  }

  async credentialExistsForMobile(mobileNormalized: string): Promise<{ userId: string } | null> {
    const rows = await this.database.$queryRaw<Array<{ userId: string }>>`
      SELECT c."userId"
      FROM "LoginCredential" c
      INNER JOIN "User" u ON u."id" = c."userId"
      WHERE u."mobileNormalized" = ${mobileNormalized}
      LIMIT 1
    `
    return rows[0] ?? null
  }

  async profileByUserId(userId: string) {
    return this.database.userProfile.findUnique({
      where: { userId },
      select: { firstName: true, lastName: true, birthDate: true, updatedAt: true },
    })
  }

  async updateProfile(
    db: DbClient,
    userId: string,
    input: { firstName: string; lastName: string; normalizedName: string },
  ) {
    return db.userProfile.upsert({
      where: { userId },
      update: input,
      create: { userId, ...input },
    })
  }

  async audit(
    db: DbClient,
    input: {
      actorUserId?: string | null
      action: string
      resourceType: string
      resourceId?: string | null
      scope?: PermissionScope
      reason?: string | null
      correlationId: string
      metadata?: Record<string, unknown>
    },
  ): Promise<void> {
    await db.auditLog.create({
      data: {
        actorUserId: input.actorUserId ?? null,
        action: input.action,
        resourceType: input.resourceType,
        resourceId: input.resourceId ?? null,
        scopeType: input.scope?.type ?? null,
        scopeId: input.scope?.id ?? null,
        reason: input.reason ?? null,
        correlationId: input.correlationId,
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
      },
    })
  }

  async principalAuthorization(userId: string): Promise<Pick<SessionPrincipal, "roleKeys" | "permissions" | "mustChangePassword">> {
    const assignments = await this.database.userRole.findMany({
      where: { userId, revokedAt: null },
      select: {
        role: {
          select: {
            key: true,
            permissions: { select: { permission: { select: { key: true } } } },
          },
        },
      },
    })

    const credential = await this.database.$queryRaw<Array<{ mustChangePassword: boolean }>>`
      SELECT "mustChangePassword" FROM "LoginCredential" WHERE "userId" = ${userId}::uuid LIMIT 1
    `

    const roleKeys = [...new Set(assignments.map((assignment) => assignment.role.key))]
    const permissions = [...new Set(assignments.flatMap((assignment) =>
      assignment.role.permissions.map((item) => item.permission.key),
    ))]

    return {
      roleKeys,
      permissions,
      mustChangePassword: credential[0]?.mustChangePassword ?? false,
    }
  }

  async listRoles() {
    return this.database.role.findMany({
      orderBy: [{ system: "desc" }, { nameFa: "asc" }],
      select: {
        id: true,
        key: true,
        nameFa: true,
        description: true,
        system: true,
        permissions: { select: { permission: { select: { id: true, key: true, description: true } } } },
      },
    })
  }

  async listPermissions() {
    return this.database.permission.findMany({ orderBy: { key: "asc" } })
  }

  async createCustomPermission(input: { key: string; description?: string | null }) {
    return this.database.permission.create({
      data: { key: input.key, description: input.description ?? null },
    })
  }

  async createCustomRole(input: {
    key: string
    nameFa: string
    description?: string | null
    permissionKeys: string[]
  }) {
    return this.database.$transaction(async (tx) => {
      const permissions = await tx.permission.findMany({
        where: { key: { in: input.permissionKeys } },
        select: { id: true, key: true },
      })
      if (permissions.length !== new Set(input.permissionKeys).size) {
        throw new Error("One or more permissions do not exist")
      }

      return tx.role.create({
        data: {
          key: input.key,
          nameFa: input.nameFa,
          description: input.description ?? null,
          system: false,
          permissions: { create: permissions.map((permission) => ({ permissionId: permission.id })) },
        },
        select: { id: true, key: true, nameFa: true, description: true, system: true },
      })
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
  }
}

export const authRepository = new AuthRepository()
