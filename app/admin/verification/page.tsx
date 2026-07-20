"use client"

import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type QueueItem = {
  provider: { id: string; nameFa: string; status: string } | null
  application: { providerId: string; legalName: string; providerMode: string; status: string; appealReason: string | null }
  documents: Array<{ id: string; documentType: string; status: string; reviewReason: string | null; expiresAt: string | null }>
}
type ApiPayload<T> = { ok: true; data: T } | { ok: false; error: { message: string } }

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: "no-store", ...init })
  const payload = await response.json() as ApiPayload<T>
  if (!payload.ok) throw new Error(payload.error.message)
  return payload.data
}

export default function VerificationPage() {
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [reason, setReason] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function refresh() {
    setQueue(await api<QueueItem[]>("/api/v1/admin/providers/review-queue"))
  }

  useEffect(() => {
    let active = true
    void api<QueueItem[]>("/api/v1/admin/providers/review-queue")
      .then((items) => active && setQueue(items))
      .catch((cause: unknown) => active && setError(cause instanceof Error ? cause.message : "دریافت صف بررسی انجام نشد."))
    return () => { active = false }
  }, [])

  async function reviewDocument(documentId: string, action: "APPROVE" | "REJECT" | "REQUEST_CORRECTION") {
    setLoading(true)
    setError("")
    try {
      await api(`/api/v1/admin/provider-documents/${documentId}/review`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, reason: action === "APPROVE" ? undefined : reason }),
      })
      await refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "بررسی مدرک انجام نشد.")
    } finally {
      setLoading(false)
    }
  }

  async function reviewProvider(providerId: string, action: "APPROVE" | "REJECT" | "REQUEST_CORRECTION") {
    setLoading(true)
    setError("")
    try {
      await api(`/api/v1/admin/providers/${providerId}/review`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, reason: action === "APPROVE" ? undefined : reason }),
      })
      await refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "بررسی پرونده انجام نشد.")
    } finally {
      setLoading(false)
    }
  }

  async function downloadDocument(documentId: string) {
    setError("")
    try {
      const response = await fetch(`/api/v1/provider-documents/${documentId}/content`, {
        headers: { "x-access-reason": reason || "بررسی مدرک پرونده ارائه‌دهنده" },
      })
      if (!response.ok) {
        const payload = await response.json() as ApiPayload<never>
        throw new Error(payload.ok ? "دریافت فایل انجام نشد." : payload.error.message)
      }
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = "provider-document"
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "دریافت فایل انجام نشد.")
    }
  }

  return (
    <main className="mx-auto max-w-7xl p-4 py-10 md:p-8" dir="rtl">
      <h1 className="text-3xl font-bold">صف احراز ارائه‌دهندگان</h1>
      <p className="mt-2 text-muted-foreground">مشاهده فایل خصوصی و هر تصمیم در Audit ثبت می‌شود. تأیید نهایی فقط پس از تأیید همه مدارک معتبر ممکن است.</p>
      <Input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="دلیل مشاهده/رد/درخواست اصلاح" className="mt-6 max-w-xl" />
      {error && <p role="alert" className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      <div className="mt-8 space-y-6">{queue.length === 0 && <p className="rounded-xl border border-dashed p-6 text-muted-foreground">پرونده‌ای در صف نیست.</p>}{queue.map((item) => <section key={item.application.providerId} className="rounded-2xl border bg-background p-5"><div className="flex flex-wrap justify-between gap-4"><div><h2 className="text-xl font-bold">{item.provider?.nameFa || item.application.legalName}</h2><p className="mt-1 text-sm text-muted-foreground" dir="ltr">{item.application.providerMode} · {item.application.status}</p>{item.application.appealReason && <p className="mt-2 text-sm">اعتراض: {item.application.appealReason}</p>}</div><div className="flex flex-wrap gap-2"><Button onClick={() => reviewProvider(item.application.providerId, "APPROVE")} disabled={loading}>تأیید نهایی</Button><Button variant="outline" onClick={() => reviewProvider(item.application.providerId, "REQUEST_CORRECTION")} disabled={loading}>درخواست اصلاح</Button><Button variant="destructive" onClick={() => reviewProvider(item.application.providerId, "REJECT")} disabled={loading}>رد پرونده</Button></div></div><div className="mt-5 grid gap-3 md:grid-cols-2">{item.documents.map((documentRow) => <article key={documentRow.id} className="rounded-xl border p-4"><div className="flex justify-between gap-2"><span>{documentRow.documentType}</span><span className="text-xs" dir="ltr">{documentRow.status}</span></div>{documentRow.reviewReason && <p className="mt-2 text-sm text-muted-foreground">{documentRow.reviewReason}</p>}<div className="mt-4 flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => downloadDocument(documentRow.id)}>مشاهده خصوصی</Button><Button size="sm" onClick={() => reviewDocument(documentRow.id, "APPROVE")} disabled={loading}>تأیید</Button><Button size="sm" variant="outline" onClick={() => reviewDocument(documentRow.id, "REQUEST_CORRECTION")} disabled={loading}>اصلاح</Button><Button size="sm" variant="destructive" onClick={() => reviewDocument(documentRow.id, "REJECT")} disabled={loading}>رد</Button></div></article>)}</div></section>)}</div>
    </main>
  )
}
