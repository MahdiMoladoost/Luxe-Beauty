import { redirect } from "next/navigation"

import { requirePrincipalFromServerCookies } from "@/lib/auth/session-cookie"

export const dynamic = "force-dynamic"

export default async function CustomerDashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  try {
    await requirePrincipalFromServerCookies()
  } catch {
    redirect("/auth/login?next=/dashboard")
  }

  return children
}
