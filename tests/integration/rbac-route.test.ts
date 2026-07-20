import { randomInt } from "node:crypto"
import { afterAll, describe, expect, it } from "vitest"
import { NextRequest } from "next/server"

import { GET as listRolesRoute } from "@/app/api/admin/rbac/roles/route"
import { authConfig } from "@/lib/auth/config"
import { requestCustomerOtp, verifyCustomerOtp } from "@/lib/auth/service"
import { prisma } from "@/lib/infrastructure/prisma"

const mobiles: string[] = []

afterAll(async () => {
  for (const mobile of mobiles) {
    const user = await prisma.user.findUnique({ where: { mobileNormalized: mobile }, select: { id: true } })
    if (user) {
      await prisma.session.deleteMany({ where: { userId: user.id } })
      await prisma.userRole.deleteMany({ where: { userId: user.id } })
      await prisma.auditLog.deleteMany({ where: { actorUserId: user.id } })
      await prisma.$executeRaw`DELETE FROM "OtpChallenge" WHERE "mobileNormalized" = ${mobile}`
      await prisma.user.delete({ where: { id: user.id } })
    }
  }
})

describe("protected RBAC API routes", () => {
  it("returns forbidden for an authenticated customer without role.read", async () => {
    const mobile = `098${randomInt(10_000_000, 99_999_999)}`
    mobiles.push(mobile)
    const challenge = await requestCustomerOtp(mobile, {
      correlationId: `rbac-route-${Date.now()}`,
      ipAddress: "127.0.0.230",
      userAgent: "vitest-rbac-route",
    })
    const session = await verifyCustomerOtp({
      mobile,
      challengeId: challenge.challengeId,
      code: challenge.developmentCode,
    }, {
      correlationId: `rbac-route-verify-${Date.now()}`,
      ipAddress: "127.0.0.230",
      userAgent: "vitest-rbac-route",
    })

    const request = new NextRequest("http://localhost:5000/api/admin/rbac/roles", {
      headers: { cookie: `${authConfig.sessionCookieName}=${session.token}` },
    })
    const response = await listRolesRoute(request)
    expect(response.status).toBe(403)
  })

  it("returns unauthenticated without a session cookie", async () => {
    const response = await listRolesRoute(new NextRequest("http://localhost:5000/api/admin/rbac/roles"))
    expect(response.status).toBe(401)
  })
})
