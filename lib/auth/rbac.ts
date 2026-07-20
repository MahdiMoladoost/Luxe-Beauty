import { z } from "zod"

import { AuthError } from "@/lib/auth/errors"
import { authRepository } from "@/lib/auth/repository"
import type { PermissionScope, SessionPrincipal } from "@/lib/auth/types"

export const permissionKeySchema = z
  .string()
  .trim()
  .min(3)
  .max(150)
  .regex(/^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*)+$/, "Permission key must use resource.action format")

export const roleKeySchema = z
  .string()
  .trim()
  .min(3)
  .max(100)
  .regex(/^[a-z][a-z0-9_]*$/, "Role key must be snake_case")

export function hasPermission(principal: SessionPrincipal, permission: string): boolean {
  return principal.permissions.includes(permission)
}

export function assertPermission(
  principal: SessionPrincipal,
  permission: string,
  scope: PermissionScope = { type: "PLATFORM" },
): void {
  if (!hasPermission(principal, permission)) {
    throw new AuthError("FORBIDDEN", "دسترسی لازم برای این عملیات وجود ندارد.", 403, {
      permission,
      scopeType: scope.type,
    })
  }

  if (principal.mustChangePassword && permission !== "security.change-own-password") {
    throw new AuthError(
      "PASSWORD_CHANGE_REQUIRED",
      "پیش از ادامه باید رمز عبور اولیه را تغییر دهید.",
      403,
    )
  }
}

const createRoleSchema = z.object({
  key: roleKeySchema,
  nameFa: z.string().trim().min(2).max(150),
  description: z.string().trim().max(1000).optional(),
  permissionKeys: z.array(permissionKeySchema).max(200).default([]),
})

const createPermissionSchema = z.object({
  key: permissionKeySchema,
  description: z.string().trim().max(1000).optional(),
})

export async function listRoles(principal: SessionPrincipal) {
  assertPermission(principal, "role.read")
  return authRepository.listRoles()
}

export async function createCustomRole(principal: SessionPrincipal, rawInput: unknown) {
  assertPermission(principal, "role.manage")
  const input = createRoleSchema.parse(rawInput)
  return authRepository.createCustomRole(input)
}

export async function listPermissions(principal: SessionPrincipal) {
  assertPermission(principal, "permission.read")
  return authRepository.listPermissions()
}

export async function createCustomPermission(principal: SessionPrincipal, rawInput: unknown) {
  assertPermission(principal, "permission.manage")
  const input = createPermissionSchema.parse(rawInput)
  return authRepository.createCustomPermission(input)
}
