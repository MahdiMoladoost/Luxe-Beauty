import { NextResponse } from "next/server"
import { prisma } from "@/lib/infrastructure/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`

    return NextResponse.json(
      {
        status: "ready",
        service: "luxe-beauty-web",
        dependencies: {
          database: "ready",
        },
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    )
  } catch {
    return NextResponse.json(
      {
        status: "not_ready",
        service: "luxe-beauty-web",
        dependencies: {
          database: "unavailable",
        },
        timestamp: new Date().toISOString(),
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    )
  }
}
