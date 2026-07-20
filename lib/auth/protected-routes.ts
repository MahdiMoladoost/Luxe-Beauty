export const panelPermissionMatrix = {
  "/admin": "platform.access",
  "/admin/roles": "role.read",
  "/admin/verification": "identity.review",
  "/salon-dashboard": "provider.panel.access",
} as const

export const rbacApiPermissionMatrix = {
  "GET /api/admin/rbac/roles": "role.read",
  "POST /api/admin/rbac/roles": "role.manage",
  "GET /api/admin/rbac/permissions": "permission.read",
  "POST /api/admin/rbac/permissions": "permission.manage",
} as const

export const verificationApiPermissionMatrix = {
  "GET /api/v1/admin/providers/review-queue": "identity.review",
  "POST /api/v1/admin/providers/{providerId}/review": "identity.review",
  "POST /api/v1/admin/provider-documents/{documentId}/review": "identity.review",
  "GET /api/v1/provider-documents/{documentId}/content (reviewer)": "identity.review",
  "GET /api/v1/admin/identity/users/{userId}": "identity.sensitive-read",
} as const

export type ProtectedPanelPath = keyof typeof panelPermissionMatrix
export type ProtectedRbacRoute = keyof typeof rbacApiPermissionMatrix
export type ProtectedVerificationRoute = keyof typeof verificationApiPermissionMatrix
