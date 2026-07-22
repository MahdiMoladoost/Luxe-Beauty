import { redirect } from "next/navigation"

import { CustomerPanelShell } from "@/components/customer-panel/customer-panel-shell"
import { requirePrincipalFromServerCookies } from "@/lib/auth/session-cookie"
import type { SessionPrincipal } from "@/lib/auth/types"
import { customerPanelBootstrap } from "@/lib/customer-panel/service"

export const dynamic = "force-dynamic"

export default async function CustomerDashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  let principal: SessionPrincipal
  try {
    principal = await requirePrincipalFromServerCookies()
  } catch {
    redirect("/auth/login?next=/dashboard")
  }

  if (principal.mustChangePassword) redirect("/auth/change-password")

  const { account } = await customerPanelBootstrap(principal)
  return <CustomerPanelShell account={account}>{children}</CustomerPanelShell>
}
