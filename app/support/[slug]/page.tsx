import { redirect } from "next/navigation"

export default async function SupportRoute({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  redirect(`/contact?topic=${encodeURIComponent(slug)}`)
}
