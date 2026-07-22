import { Prisma } from "@prisma/client"
import { z } from "zod"

import { AuthError } from "@/lib/auth/errors"
import type { RequestContext, SessionPrincipal } from "@/lib/auth/types"
import { prisma } from "@/lib/infrastructure/prisma"
import { normalizePersianText } from "@/lib/localization/normalize-fa"

const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (value) => {
      const parsed = new Date(`${value}T00:00:00.000Z`)
      return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
    },
    { message: "Birth date is invalid." },
  )
  .transform((value) => new Date(`${value}T00:00:00.000Z`))

const updateAccountSchema = z.object({
  expectedUpdatedAt: z.string().datetime({ offset: true }).nullable(),
  firstName: z.string().trim().min(2).max(100),
  lastName: z.string().trim().min(2).max(100),
  birthDate: dateOnlySchema.nullable().optional(),
})

function profileDto(profile: {
  id: string
  firstName: string | null
  lastName: string | null
  birthDate: Date | null
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: profile.id,
    firstName: profile.firstName,
    lastName: profile.lastName,
    birthDate: profile.birthDate?.toISOString().slice(0, 10) ?? null,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  }
}

export async function updateCustomerAccount(
  principal: SessionPrincipal,
  rawInput: unknown,
  context: RequestContext,
) {
  const input = updateAccountSchema.parse(rawInput)
  const firstName = normalizePersianText(input.firstName)
  const lastName = normalizePersianText(input.lastName)

  return prisma.$transaction(
    async (tx) => {
      const user = await tx.user.findFirst({
        where: { id: principal.userId, deletedAt: null },
        select: {
          id: true,
          profile: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              birthDate: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      })
      if (!user) throw new AuthError("ACCOUNT_NOT_FOUND", "حساب کاربری یافت نشد.", 404)

      const expected = input.expectedUpdatedAt ? new Date(input.expectedUpdatedAt) : null
      const current = user.profile?.updatedAt ?? null
      if (
        (current === null && expected !== null) ||
        (current !== null && (expected === null || current.getTime() !== expected.getTime()))
      ) {
        throw new AuthError(
          "VERSION_CONFLICT",
          "اطلاعات حساب هم‌زمان تغییر کرده است. صفحه را تازه‌سازی و دوباره تلاش کنید.",
          409,
        )
      }

      const profile = await tx.userProfile.upsert({
        where: { userId: principal.userId },
        update: {
          firstName,
          lastName,
          normalizedName: normalizePersianText(`${firstName} ${lastName}`),
          birthDate: input.birthDate ?? null,
        },
        create: {
          userId: principal.userId,
          firstName,
          lastName,
          normalizedName: normalizePersianText(`${firstName} ${lastName}`),
          birthDate: input.birthDate ?? null,
        },
      })

      await tx.auditLog.create({
        data: {
          actorUserId: principal.userId,
          action: "profile.updated",
          resourceType: "UserProfile",
          resourceId: profile.id,
          scopeType: "CUSTOMER",
          scopeId: principal.userId,
          correlationId: context.correlationId,
          metadata: {
            previousUpdatedAt: current?.toISOString() ?? null,
            hasBirthDate: profile.birthDate !== null,
          } as Prisma.InputJsonValue,
        },
      })

      return profileDto(profile)
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  )
}
