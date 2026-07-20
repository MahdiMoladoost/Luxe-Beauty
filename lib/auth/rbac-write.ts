import { Prisma } from "@prisma/client"

import { AuthError } from "@/lib/auth/errors"
import type { RequestContext, SessionPrincipal } from "@/lib/auth/types"
import { prisma } from "@/lib/infrastructure/prisma"

export type CustomPermissionInput = {
  key: string
  description?: string
}

export type CustomRoleInput = {
  key: string
  nameFa: string
  description?: string
  permissionKeys: string[]
}

export async function createAuditedPermission(
  principal: SessionPrincipal,
  input: CustomPermissionInput,
  context: RequestContext,
) {
  return prisma.$transaction(async (tx) => {
    const permission = await tx.permission.create({
      data: {
        key: input.key,
        description: input.description ?? null,
      },
    })

    await tx.auditLog.create({
      data: {
        actorUserId: principal.userId,
        action: "rbac.permission.created",
        resourceType: "Permission",
        resourceId: permission.id,
        scopeType: "PLATFORM",
        correlationId: context.correlationId,
        metadata: {
          permissionKey: permission.key,
        } as Prisma.InputJsonValue,
      },
    })

    return permission
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
}

export async function createAuditedRole(
  principal: SessionPrincipal,
  input: CustomRoleInput,
  context: RequestContext,
) {
  return prisma.$transaction(async (tx) => {
    const uniquePermissionKeys = [...new Set(input.permissionKeys)]
    const permissions = await tx.permission.findMany({
      where: { key: { in: uniquePermissionKeys } },
      select: { id: true, key: true },
    })

    if (permissions.length !== uniquePermissionKeys.length) {
      const found = new Set(permissions.map((permission) => permission.key))
      throw new AuthError("UNKNOWN_PERMISSION", "یک یا چند مجوز انتخاب‌شده وجود ندارد.", 400, {
        unknownPermissionKeys: uniquePermissionKeys.filter((key) => !found.has(key)),
      })
    }

    const role = await tx.role.create({
      data: {
        key: input.key,
        nameFa: input.nameFa,
        description: input.description ?? null,
        system: false,
        permissions: {
          create: permissions.map((permission) => ({ permissionId: permission.id })),
        },
      },
      select: {
        id: true,
        key: true,
        nameFa: true,
        description: true,
        system: true,
      },
    })

    await tx.auditLog.create({
      data: {
        actorUserId: principal.userId,
        action: "rbac.role.created",
        resourceType: "Role",
        resourceId: role.id,
        scopeType: "PLATFORM",
        correlationId: context.correlationId,
        metadata: {
          roleKey: role.key,
          permissionKeys: uniquePermissionKeys,
        } as Prisma.InputJsonValue,
      },
    })

    return role
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
}
