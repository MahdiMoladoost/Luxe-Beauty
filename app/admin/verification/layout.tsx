import { redirect } from "next/navigation"

import { assertPermission } from "@/lib/auth/rbac"
import { requirePrincipalFromServerCookies } from "@/lib/auth/session-cookie"

export const dynamic = "force-dynamic"

export default async function VerificationLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  try {
    const principal = await requirePrincipalFromServerCookies()
    assertPermission(principal, "identity.review")
  } catch {
    redirect("/admin")
  }
  return children
}
