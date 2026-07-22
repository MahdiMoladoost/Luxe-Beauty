import type { SessionPrincipal } from "@/lib/auth/types"
import { prisma } from "@/lib/infrastructure/prisma"

export async function providerPanelGeography(_principal: SessionPrincipal) {
  const provinces = await prisma.province.findMany({
    where: { active: true },
    select: {
      id: true,
      nameFa: true,
      cities: {
        where: { active: true },
        orderBy: { nameFa: "asc" },
        select: {
          id: true,
          nameFa: true,
          districts: {
            where: { active: true },
            orderBy: { nameFa: "asc" },
            select: { id: true, nameFa: true },
          },
          neighborhoods: {
            where: { active: true },
            orderBy: { nameFa: "asc" },
            select: { id: true, nameFa: true, districtId: true },
          },
        },
      },
    },
    orderBy: { nameFa: "asc" },
  })

  return { provinces }
}
