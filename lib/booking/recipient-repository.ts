import { Prisma, type PrismaClient } from "@prisma/client"

import type { RequestContext, SessionPrincipal } from "@/lib/auth/types"
import { prisma } from "@/lib/infrastructure/prisma"

export class BookingRecipientRepository {
  constructor(private readonly database: PrismaClient = prisma) {}

  listOwned(customerUserId: string) {
    return this.database.serviceRecipient.findMany({
      where: { customerUserId, deletedAt: null },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    })
  }

  owned(customerUserId: string, recipientId: string) {
    return this.database.serviceRecipient.findFirst({
      where: { id: recipientId, customerUserId, deletedAt: null },
    })
  }

  create(input: {
    principal: SessionPrincipal
    firstName: string
    lastName: string
    birthDate: Date | null
    genderCode: string | null
    relationLabel: string | null
    contactMobile: string | null
    accessibilityNeeds: string | null
    context: RequestContext
  }) {
    return this.database.$transaction(
      async (tx) => {
        const recipient = await tx.serviceRecipient.create({
          data: {
            customerUserId: input.principal.userId,
            firstName: input.firstName,
            lastName: input.lastName,
            birthDate: input.birthDate,
            genderCode: input.genderCode,
            relationLabel: input.relationLabel,
            contactMobile: input.contactMobile,
            accessibilityNeeds: input.accessibilityNeeds,
          },
        })
        await tx.auditLog.create({
          data: {
            actorUserId: input.principal.userId,
            action: "booking.recipient.created",
            resourceType: "ServiceRecipient",
            resourceId: recipient.id,
            scopeType: "CUSTOMER",
            scopeId: input.principal.userId,
            correlationId: input.context.correlationId,
            metadata: {
              hasBirthDate: recipient.birthDate !== null,
              genderCode: recipient.genderCode,
              relationLabel: recipient.relationLabel,
              hasContactMobile: recipient.contactMobile !== null,
              hasAccessibilityNeeds: recipient.accessibilityNeeds !== null,
            } as Prisma.InputJsonValue,
          },
        })
        return recipient
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    )
  }

  update(input: {
    principal: SessionPrincipal
    recipientId: string
    expectedUpdatedAt: Date
    changes: {
      firstName?: string
      lastName?: string
      birthDate?: Date | null
      genderCode?: string | null
      relationLabel?: string | null
      contactMobile?: string | null
      accessibilityNeeds?: string | null
    }
    context: RequestContext
  }) {
    return this.database.$transaction(
      async (tx) => {
        const current = await tx.serviceRecipient.findFirst({
          where: {
            id: input.recipientId,
            customerUserId: input.principal.userId,
            deletedAt: null,
          },
        })
        if (!current) return { kind: "NOT_FOUND" as const }
        if (current.updatedAt.getTime() !== input.expectedUpdatedAt.getTime()) {
          return { kind: "VERSION_CONFLICT" as const }
        }

        const recipient = await tx.serviceRecipient.update({
          where: { id: current.id },
          data: input.changes,
        })
        await tx.auditLog.create({
          data: {
            actorUserId: input.principal.userId,
            action: "booking.recipient.updated",
            resourceType: "ServiceRecipient",
            resourceId: recipient.id,
            scopeType: "CUSTOMER",
            scopeId: input.principal.userId,
            correlationId: input.context.correlationId,
            metadata: {
              changedFields: Object.keys(input.changes),
              previousUpdatedAt: current.updatedAt.toISOString(),
            } as Prisma.InputJsonValue,
          },
        })
        return { kind: "UPDATED" as const, recipient }
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    )
  }

  softDelete(input: {
    principal: SessionPrincipal
    recipientId: string
    expectedUpdatedAt: Date
    context: RequestContext
  }) {
    return this.database.$transaction(
      async (tx) => {
        const current = await tx.serviceRecipient.findFirst({
          where: {
            id: input.recipientId,
            customerUserId: input.principal.userId,
            deletedAt: null,
          },
        })
        if (!current) return { kind: "NOT_FOUND" as const }
        if (current.updatedAt.getTime() !== input.expectedUpdatedAt.getTime()) {
          return { kind: "VERSION_CONFLICT" as const }
        }

        const deletedAt = new Date()
        await tx.serviceRecipient.update({
          where: { id: current.id },
          data: { deletedAt },
        })
        await tx.auditLog.create({
          data: {
            actorUserId: input.principal.userId,
            action: "booking.recipient.deleted",
            resourceType: "ServiceRecipient",
            resourceId: current.id,
            scopeType: "CUSTOMER",
            scopeId: input.principal.userId,
            correlationId: input.context.correlationId,
            metadata: { deletedAt: deletedAt.toISOString() } as Prisma.InputJsonValue,
          },
        })
        return { kind: "DELETED" as const }
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    )
  }
}

export const bookingRecipientRepository = new BookingRecipientRepository()
