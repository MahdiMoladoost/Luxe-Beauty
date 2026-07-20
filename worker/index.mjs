import { Worker } from "bullmq"
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

const worker = new Worker(
  queueName,
  async (job) => {
    switch (job.name) {
      case "system.health":
        return {
          ok: true,
          processedAt: new Date().toISOString(),
        }
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
}))
