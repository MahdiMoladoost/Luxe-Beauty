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
}

export const bookingRecipientRepository = new BookingRecipientRepository()
