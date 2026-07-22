import { Prisma } from "@prisma/client"

export async function expireProviderApprovals({
  prisma,
  jobId,
  now = new Date(),
  limit = 500,
  bookingIds,
}) {
  const candidates = await prisma.booking.findMany({
    where: {
      status: "AWAITING_PROVIDER_APPROVAL",
      approvalDeadlineAt: { lte: now },
      ...(Array.isArray(bookingIds) && bookingIds.length > 0
        ? { id: { in: bookingIds } }
        : {}),
    },
    select: {
      id: true,
      providerId: true,
      version: true,
      approvalDeadlineAt: true,
    },
    orderBy: [{ approvalDeadlineAt: "asc" }, { id: "asc" }],
    take: limit,
  })

  let expiredCount = 0
  let paymentBlockedCount = 0
  let missingAllocationCount = 0
  let skippedCount = 0

  for (const candidate of candidates) {
    const result = await prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`booking:${candidate.id}`}, 0))`

        const booking = await tx.booking.findUnique({
          where: { id: candidate.id },
          include: { payments: { select: { id: true } } },
        })
        if (
          !booking ||
          booking.status !== "AWAITING_PROVIDER_APPROVAL" ||
          !booking.approvalDeadlineAt ||
          booking.approvalDeadlineAt > now
        ) {
          return "SKIPPED"
        }
        if (booking.payments.length > 0) return "PAYMENT_BLOCKED"

        const allocation = await tx.bookingHold.findFirst({
          where: { consumedBookingId: booking.id },
        })
        if (!allocation || allocation.status !== "CONSUMED") {
          return "MISSING_ALLOCATION"
        }

        const changed = await tx.booking.updateMany({
          where: {
            id: booking.id,
            status: "AWAITING_PROVIDER_APPROVAL",
            version: booking.version,
            approvalDeadlineAt: { lte: now },
          },
          data: { status: "EXPIRED", version: { increment: 1 } },
        })
        if (changed.count !== 1) return "SKIPPED"

        const released = await tx.bookingHold.updateMany({
          where: {
            id: allocation.id,
            status: "CONSUMED",
            consumedBookingId: booking.id,
          },
          data: { status: "RELEASED", releasedAt: now },
        })
        if (released.count !== 1) {
          throw new Error("Booking allocation changed during scheduled approval expiry")
        }

        const correlationId = `worker:provider-approval-expiry:${jobId}:${booking.id}`
        await tx.bookingTransition.create({
          data: {
            bookingId: booking.id,
            fromStatus: "AWAITING_PROVIDER_APPROVAL",
            toStatus: "EXPIRED",
            actorUserId: null,
            reasonCode: "APPROVAL_DEADLINE_EXPIRED",
            correlationId,
            metadata: {
              source: "scheduled-worker",
              approvalDeadlineAt: booking.approvalDeadlineAt.toISOString(),
              allocationReleased: true,
            },
          },
        })
        await tx.auditLog.create({
          data: {
            actorUserId: null,
            action: "booking.provider-approval-expired",
            resourceType: "Booking",
            resourceId: booking.id,
            scopeType: "PROVIDER",
            scopeId: booking.providerId,
            correlationId,
            metadata: {
              source: "scheduled-worker",
              approvalDeadlineAt: booking.approvalDeadlineAt.toISOString(),
              allocationReleased: true,
            },
          },
        })
        await tx.outboxEvent.create({
          data: {
            aggregateType: "Booking",
            aggregateId: booking.id,
            eventType: "booking.provider-approval-expired",
            dedupeKey: `booking-provider-approval-expired:${booking.id}`,
            payload: {
              schemaVersion: 1,
              bookingId: booking.id,
              providerId: booking.providerId,
              status: "EXPIRED",
              expiredAt: now.toISOString(),
              approvalDeadlineAt: booking.approvalDeadlineAt.toISOString(),
            },
          },
        })
        return "EXPIRED"
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 10_000,
        timeout: 20_000,
      },
    )

    if (result === "EXPIRED") expiredCount += 1
    else if (result === "PAYMENT_BLOCKED") paymentBlockedCount += 1
    else if (result === "MISSING_ALLOCATION") missingAllocationCount += 1
    else skippedCount += 1
  }

  return {
    checkedCount: candidates.length,
    expiredCount,
    paymentBlockedCount,
    missingAllocationCount,
    skippedCount,
    processedAt: now.toISOString(),
  }
}
