import { redirect } from "next/navigation"

export default async function DashboardSectionRoute({
  params,
}: {
  params: Promise<{ section: string }>
}) {
  const { section } = await params
  redirect(`/dashboard?section=${encodeURIComponent(section)}`)
}
