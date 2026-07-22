import { redirect } from "next/navigation"

import { ProviderPanelShell } from "@/components/provider-panel/provider-panel-shell"
import { assertPermission } from "@/lib/auth/rbac"
import { panelPermissionMatrix } from "@/lib/auth/protected-routes"
import { requirePrincipalFromServerCookies } from "@/lib/auth/session-cookie"
import type { SessionPrincipal } from "@/lib/auth/types"
import { providerPanelBootstrap } from "@/lib/provider-panel/service"

export const dynamic = "force-dynamic"

export default async function ProviderDashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  let principal: SessionPrincipal
  try {
    principal = await requirePrincipalFromServerCookies()
  } catch {
    redirect("/auth/login?next=/salon-dashboard")
  }

  if (principal.mustChangePassword) redirect("/auth/change-password")

  try {
    assertPermission(principal, panelPermissionMatrix["/salon-dashboard"])
  } catch {
    redirect("/auth/login?error=forbidden")
  }

  const bootstrap = await providerPanelBootstrap(principal)
  const providers = bootstrap.providers.map((provider) => ({
    ...provider,
    verificationAt: provider.verificationAt?.toISOString() ?? null,
    updatedAt: provider.updatedAt.toISOString(),
  }))

  return <ProviderPanelShell providers={providers}>{children}</ProviderPanelShell>
}
