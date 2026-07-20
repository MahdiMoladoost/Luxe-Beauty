import { redirect } from "next/navigation"

import { assertPermission } from "@/lib/auth/rbac"
import { requirePrincipalFromServerCookies } from "@/lib/auth/session-cookie"
import { panelPermissionMatrix } from "@/lib/auth/protected-routes"

export const dynamic = "force-dynamic"

export default async function AdminRolesLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  try {
    const principal = await requirePrincipalFromServerCookies()
    assertPermission(principal, panelPermissionMatrix["/admin/roles"])
  } catch {
    redirect("/admin")
  }

  return children
}
