import { Prisma, PrismaClient } from "@prisma/client"
import { Queue, Worker } from "bullmq"
import IORedis from "ioredis"

const redisUrl = process.env.REDIS_URL
if (!redisUrl) {
  throw new Error("REDIS_URL is required for the worker")
}

const queuePrefix = process.env.QUEUE_PREFIX || "luxe-beauty"
const queueName = `${queuePrefix}:jobs`
const concurrency = Number.parseInt(process.env.WORKER_CONCURRENCY || "4", 10)

if (!Number.isSafeInteger(concurrency) || concurrency < 1) {
  throw new Error("WORKER_CONCURRENCY must be a positive integer")
}

const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
})
const queue = new Queue(queueName, { connection, prefix: queuePrefix })
const prisma = new PrismaClient()

async function expireBookingHolds(job) {
  const now = new Date()
  const candidates = await prisma.bookingHold.findMany({
    where: { status: "ACTIVE", expiresAt: { lte: now } },
    select: { id: true, providerId: true, resourceType: true, resourceId: true, expiresAt: true },
    orderBy: { expiresAt: "asc" },
    take: 500,
  })
  let expiredCount = 0
  for (const candidate of candidates) {
    const correlationId = `worker:booking-hold-expiry:${job.id}:${candidate.id}`
    const changed = await prisma.$transaction(async (tx) => {
      const update = await tx.bookingHold.updateMany({
        where: { id: candidate.id, status: "ACTIVE", expiresAt: { lte: now } },
        data: { status: "EXPIRED" },
      })
      if (update.count !== 1) return false
      await tx.auditLog.create({
        data: {
          actorUserId: null,
          action: "booking.hold.expired",
          resourceType: "BookingHold",
          resourceId: candidate.id,
          scopeType: "PROVIDER",
          scopeId: candidate.providerId,
          correlationId,
          metadata: {
            source: "scheduled-worker",
            resourceType: candidate.resourceType,
            resourceId: candidate.resourceId,
            expiresAt: candidate.expiresAt.toISOString(),
          },
        },
      })
      await tx.outboxEvent.create({
        data: {
          aggregateType: "BookingHold",
          aggregateId: candidate.id,
          eventType: "booking.hold.expired",
          dedupeKey: `booking-hold-expired:${candidate.id}`,
          payload: {
            schemaVersion: 1,
            holdId: candidate.id,
            expiredAt: now.toISOString(),
          },
        },
      })
      return true
    }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted })
    if (changed) expiredCount += 1
  }
  return { expiredCount, checkedCount: candidates.length, processedAt: now.toISOString() }
}

const worker = new Worker(
  queueName,
  async (job) => {
    switch (job.name) {
      case "system.health":
        return {
          ok: true,
          processedAt: new Date().toISOString(),
        }
      case "booking.holds.expire":
        return expireBookingHolds(job)
      default:
        throw new Error(`Unsupported job type: ${job.name}`)
    }
  },
  {
    connection,
    concurrency,
    prefix: queuePrefix,
  },
)

await queue.upsertJobScheduler(
  "booking-hold-expiry",
  { every: 60_000 },
  {
    name: "booking.holds.expire",
    data: { schemaVersion: 1 },
    opts: {
      removeOnComplete: 100,
      removeOnFail: 500,
      attempts: 5,
      backoff: { type: "exponential", delay: 5_000 },
    },
  },
)

worker.on("completed", (job) => {
  console.info(JSON.stringify({
    level: "info",
    event: "worker.job.completed",
    jobId: job.id,
    jobName: job.name,
  }))
})

worker.on("failed", (job, error) => {
  console.error(JSON.stringify({
    level: "error",
    event: "worker.job.failed",
    jobId: job?.id,
    jobName: job?.name,
    errorName: error.name,
    errorMessage: error.message,
  }))
})

worker.on("error", (error) => {
  console.error(JSON.stringify({
    level: "error",
    event: "worker.error",
    errorName: error.name,
    errorMessage: error.message,
  }))
})

async function shutdown(signal) {
  console.info(JSON.stringify({ level: "info", event: "worker.shutdown", signal }))
  await worker.close()
  await queue.close()
  await prisma.$disconnect()
  await connection.quit()
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => {
    shutdown(signal)
      .then(() => process.exit(0))
      .catch((error) => {
        console.error(JSON.stringify({
          level: "error",
          event: "worker.shutdown.failed",
          errorName: error.name,
          errorMessage: error.message,
        }))
        process.exit(1)
      })
  })
}

console.info(JSON.stringify({
  level: "info",
  event: "worker.started",
  queueName,
  concurrency,
  schedulers: ["booking-hold-expiry"],
}))
