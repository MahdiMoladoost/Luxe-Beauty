import { Prisma } from "@prisma/client"

import { AuthError } from "@/lib/auth/errors"
import type { RequestContext, SessionPrincipal } from "@/lib/auth/types"
import { prisma } from "@/lib/infrastructure/prisma"

export async function appealProviderDocument(
  principal: SessionPrincipal,
  documentId: string,
  reason: string,
  context: RequestContext,
) {
  return prisma.$transaction(async (tx) => {
    const document = await tx.providerDocument.findFirst({
      where: { id: documentId, ownerUserId: principal.userId, status: "REJECTED" },
    })
    if (!document) throw new AuthError("DOCUMENT_NOT_APPEALABLE", "این مدرک قابل اعتراض نیست.", 409)

    const updated = await tx.providerDocument.update({
      where: { id: documentId },
      data: {
        status: "APPEALED",
        appealStatus: "PENDING",
        appealReason: reason,
        appealedAt: new Date(),
      },
    })
    await tx.auditLog.create({
      data: {
        actorUserId: principal.userId,
        action: "provider.document.appealed",
        resourceType: "ProviderDocument",
        resourceId: documentId,
        scopeType: "PROVIDER",
        scopeId: document.providerId,
        reason,
        correlationId: context.correlationId,
        metadata: { previousStatus: document.status } as Prisma.InputJsonValue,
      },
    })
    return updated
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
}
