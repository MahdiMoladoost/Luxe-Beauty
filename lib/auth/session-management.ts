import { Prisma } from "@prisma/client"
import { z } from "zod"

import { AuthError } from "@/lib/auth/errors"
import type { RequestContext, SessionPrincipal } from "@/lib/auth/types"
import { prisma } from "@/lib/infrastructure/prisma"

const sessionIdSchema = z.string().uuid()

type SessionDeviceRow = {
  id: string
  authMethod: string
  userAgentSummary: string | null
  twoFactorVerifiedAt: Date | null
  createdAt: Date
  lastSeenAt: Date
  expiresAt: Date
  idleExpiresAt: Date
}

export type SessionDevice = SessionDeviceRow & {
  current: boolean
}

export async function listOwnSessions(principal: SessionPrincipal): Promise<SessionDevice[]> {
  const now = new Date()
  const sessions = await prisma.$queryRaw<SessionDeviceRow[]>`
    SELECT
      "id", "authMethod", "userAgentSummary", "twoFactorVerifiedAt",
      "createdAt", "lastSeenAt", "expiresAt", "idleExpiresAt"
    FROM "Session"
    WHERE "userId" = ${principal.userId}::uuid
      AND "revokedAt" IS NULL
      AND "expiresAt" > ${now}
      AND "idleExpiresAt" > ${now}
    ORDER BY "lastSeenAt" DESC
  `

  return sessions.map((session) => ({
    ...session,
    current: session.id === principal.sessionId,
  }))
}

export async function revokeOwnSession(
  principal: SessionPrincipal,
  rawSessionId: unknown,
  context: RequestContext,
): Promise<{ currentSessionRevoked: boolean }> {
  const sessionId = sessionIdSchema.parse(rawSessionId)
  const now = new Date()

  return prisma.$transaction(async (tx) => {
    const sessions = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT "id"
      FROM "Session"
      WHERE "id" = ${sessionId}::uuid
        AND "userId" = ${principal.userId}::uuid
        AND "revokedAt" IS NULL
      LIMIT 1
      FOR UPDATE
    `

    if (!sessions[0]) {
      throw new AuthError("SESSION_NOT_FOUND", "نشست موردنظر پیدا نشد.", 404)
    }

    await tx.$executeRaw`
      UPDATE "Session"
      SET "revokedAt" = ${now}, "revocationReason" = 'USER_REVOKED_DEVICE'
      WHERE "id" = ${sessionId}::uuid
        AND "userId" = ${principal.userId}::uuid
        AND "revokedAt" IS NULL
    `

    await tx.auditLog.create({
      data: {
        actorUserId: principal.userId,
        action: "auth.session.revoked-device",
        resourceType: "Session",
        resourceId: sessionId,
        correlationId: context.correlationId,
        metadata: {
          currentSession: sessionId === principal.sessionId,
        } as Prisma.InputJsonValue,
      },
    })

    return { currentSessionRevoked: sessionId === principal.sessionId }
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
}
