export const panelPermissionMatrix = {
  "/admin": "platform.access",
  "/admin/roles": "role.read",
  "/salon-dashboard": "provider.panel.access",
} as const

export const rbacApiPermissionMatrix = {
  "GET /api/admin/rbac/roles": "role.read",
  "POST /api/admin/rbac/roles": "role.manage",
  "GET /api/admin/rbac/permissions": "permission.read",
  "POST /api/admin/rbac/permissions": "permission.manage",
} as const

export type ProtectedPanelPath = keyof typeof panelPermissionMatrix
export type ProtectedRbacRoute = keyof typeof rbacApiPermissionMatrix
