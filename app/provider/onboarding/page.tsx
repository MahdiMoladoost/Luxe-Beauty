"use client"

import { type FormEvent, useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type ProviderMode = "SINGLE_SALON" | "MULTI_BRANCH_GROUP" | "AFFILIATED_PROFESSIONAL" | "INDEPENDENT_PROFESSIONAL" | "HOME_SERVICE_PROFESSIONAL" | "HOME_STUDIO_PROFESSIONAL" | "HYBRID_PROFESSIONAL"
type Provider = { id: string; nameFa: string; status: string; bookingEnabled: boolean; type: string }
type Application = { providerId: string; providerMode: ProviderMode; legalName: string; status: string; reviewReason: string | null; appealStatus: string | null }
type DocumentRow = { id: string; documentType: string; status: string; reviewReason: string | null; expiresAt: string | null }
type ProviderListItem = { provider: Provider; application: Application | null }
type ProviderDetail = { provider: Provider; application: Application | null; documents: DocumentRow[] }
type ApiPayload<T> = { ok: true; data: T } | { ok: false; error: { message: string } }

async function jsonApi<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: "no-store", ...init })
  const payload = await response.json() as ApiPayload<T>
  if (!payload.ok) throw new Error(payload.error.message)
  return payload.data
}

const modeLabels: Record<ProviderMode, string> = {
  SINGLE_SALON: "سالن تک‌شعبه",
  MULTI_BRANCH_GROUP: "مجموعه چندشعبه‌ای",
  AFFILIATED_PROFESSIONAL: "متخصص وابسته",
  INDEPENDENT_PROFESSIONAL: "متخصص مستقل",
  HOME_SERVICE_PROFESSIONAL: "متخصص خدمات در منزل",
  HOME_STUDIO_PROFESSIONAL: "متخصص خانگی",
  HYBRID_PROFESSIONAL: "متخصص ترکیبی",
}

export default function ProviderOnboardingPage() {
  const [items, setItems] = useState<ProviderListItem[]>([])
  const [detail, setDetail] = useState<ProviderDetail | null>(null)
  const [mode, setMode] = useState<ProviderMode>("SINGLE_SALON")
  const [nameFa, setNameFa] = useState("")
  const [legalName, setLegalName] = useState("")
  const [privatePhone, setPrivatePhone] = useState("")
  const [publicPhone, setPublicPhone] = useState("")
  const [documentType, setDocumentType] = useState("BUSINESS_LICENSE")
  const [expiresAt, setExpiresAt] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [appealReason, setAppealReason] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function refreshList() {
    const next = await jsonApi<ProviderListItem[]>("/api/v1/providers/me")
    setItems(next)
    if (!detail && next[0]) await loadDetail(next[0].provider.id)
  }

  async function loadDetail(providerId: string) {
    setDetail(await jsonApi<ProviderDetail>(`/api/v1/providers/${providerId}`))
  }

  useEffect(() => {
    let active = true
    void jsonApi<ProviderListItem[]>("/api/v1/providers/me")
      .then(async (next) => {
        if (!active) return
        setItems(next)
        if (next[0]) {
          const nextDetail = await jsonApi<ProviderDetail>(`/api/v1/providers/${next[0].provider.id}`)
          if (active) setDetail(nextDetail)
        }
      })
      .catch((reason: unknown) => active && setError(reason instanceof Error ? reason.message : "دریافت پرونده‌ها انجام نشد."))
    return () => { active = false }
  }, [])

  async function createProvider(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError("")
    try {
      const provider = await jsonApi<Provider>("/api/v1/providers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode, nameFa, legalName, privatePhone, publicPhone: publicPhone || undefined }),
      })
      setNameFa("")
      setLegalName("")
      await refreshList()
      await loadDetail(provider.id)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ایجاد پرونده انجام نشد.")
    } finally {
      setLoading(false)
    }
  }

  async function upload(event: FormEvent) {
    event.preventDefault()
    if (!detail || !file) return
    setLoading(true)
    setError("")
    try {
      const form = new FormData()
      form.set("file", file)
      form.set("documentType", documentType)
      if (expiresAt) form.set("expiresAt", new Date(expiresAt).toISOString())
      await jsonApi(`/api/v1/providers/${detail.provider.id}/documents`, { method: "POST", body: form })
      setFile(null)
      await loadDetail(detail.provider.id)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ارسال مدرک انجام نشد.")
    } finally {
      setLoading(false)
    }
  }

  async function submitForReview() {
    if (!detail) return
    setLoading(true)
    setError("")
    try {
      await jsonApi(`/api/v1/providers/${detail.provider.id}/submit`, { method: "POST" })
      await refreshList()
      await loadDetail(detail.provider.id)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ارسال برای بررسی انجام نشد.")
    } finally {
      setLoading(false)
    }
  }

  async function appeal() {
    if (!detail) return
    setLoading(true)
    setError("")
    try {
      await jsonApi(`/api/v1/providers/${detail.provider.id}/appeal`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reason: appealReason }),
      })
      setAppealReason("")
      await refreshList()
      await loadDetail(detail.provider.id)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ثبت اعتراض انجام نشد.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-6xl p-4 py-10 md:p-8" dir="rtl">
      <h1 className="text-3xl font-bold">ثبت و احراز ارائه‌دهنده</h1>
      <p className="mt-2 text-muted-foreground">تا تأیید نهایی، پرونده نمایش عمومی و دریافت رزرو ندارد.</p>
      {error && <p role="alert" className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-6">
          <form onSubmit={createProvider} className="rounded-2xl border bg-background p-5">
            <h2 className="text-xl font-bold">پرونده جدید</h2>
            <div className="mt-4 space-y-3">
              <div className="space-y-2"><Label htmlFor="provider-mode">نوع ارائه‌دهنده</Label><select id="provider-mode" value={mode} onChange={(event) => setMode(event.target.value as ProviderMode)} className="h-10 w-full rounded-md border bg-background px-3">{Object.entries(modeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
              <div className="space-y-2"><Label htmlFor="provider-name">نام نمایشی</Label><Input id="provider-name" value={nameFa} onChange={(event) => setNameFa(event.target.value)} required /></div>
              <div className="space-y-2"><Label htmlFor="legal-name">نام قانونی</Label><Input id="legal-name" value={legalName} onChange={(event) => setLegalName(event.target.value)} required /></div>
              <div className="space-y-2"><Label htmlFor="private-phone">شماره تماس خصوصی</Label><Input id="private-phone" value={privatePhone} onChange={(event) => setPrivatePhone(event.target.value)} dir="ltr" required /></div>
              <div className="space-y-2"><Label htmlFor="public-phone">شماره عمومی اختیاری</Label><Input id="public-phone" value={publicPhone} onChange={(event) => setPublicPhone(event.target.value)} dir="ltr" /></div>
              <Button disabled={loading}>ایجاد پرونده</Button>
            </div>
          </form>

          <section className="rounded-2xl border bg-background p-5">
            <h2 className="text-xl font-bold">پرونده‌های من</h2>
            <div className="mt-4 space-y-2">{items.map((item) => <button key={item.provider.id} type="button" onClick={() => loadDetail(item.provider.id)} className="flex w-full items-center justify-between rounded-xl border p-3 text-right"><span>{item.provider.nameFa}</span><span className="text-xs text-muted-foreground" dir="ltr">{item.application?.status || item.provider.status}</span></button>)}</div>
          </section>
        </div>

        <section className="rounded-2xl border bg-background p-5">
          {!detail ? <p className="text-muted-foreground">یک پرونده ایجاد یا انتخاب کنید.</p> : <>
            <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-2xl font-bold">{detail.provider.nameFa}</h2><p className="mt-1 text-sm text-muted-foreground">{modeLabels[detail.application?.providerMode || "SINGLE_SALON"]}</p></div><div className="rounded-full bg-muted px-3 py-1 text-sm" dir="ltr">{detail.application?.status || detail.provider.status}</div></div>
            {detail.application?.reviewReason && <p className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm">دلیل بررسی: {detail.application.reviewReason}</p>}

            <form onSubmit={upload} className="mt-8 rounded-xl border p-4">
              <h3 className="font-bold">ارسال مدرک خصوصی</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="document-type">نوع مدرک</Label><select id="document-type" value={documentType} onChange={(event) => setDocumentType(event.target.value)} className="h-10 w-full rounded-md border bg-background px-3"><option value="BUSINESS_LICENSE">مجوز فعالیت</option><option value="PROFESSIONAL_CERTIFICATE">مدرک تخصصی</option><option value="NATIONAL_CARD">کارت ملی</option><option value="ADDRESS_PROOF">مدرک آدرس</option><option value="OTHER">سایر</option></select></div>
                <div className="space-y-2"><Label htmlFor="expires-at">تاریخ انقضا اختیاری</Label><Input id="expires-at" type="date" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} /></div>
                <div className="space-y-2 sm:col-span-2"><Label htmlFor="document-file">PDF/JPEG/PNG تا ۱۰MB</Label><Input id="document-file" type="file" accept="application/pdf,image/jpeg,image/png" onChange={(event) => setFile(event.target.files?.[0] || null)} required /></div>
              </div>
              <Button className="mt-4" disabled={loading || !file}>ارسال مدرک</Button>
            </form>

            <div className="mt-6 space-y-3"><h3 className="font-bold">مدارک</h3>{detail.documents.length === 0 && <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">مدرکی ارسال نشده است.</p>}{detail.documents.map((document) => <article key={document.id} className="rounded-xl border p-4"><div className="flex justify-between gap-3"><span>{document.documentType}</span><span className="text-xs" dir="ltr">{document.status}</span></div>{document.reviewReason && <p className="mt-2 text-sm text-muted-foreground">{document.reviewReason}</p>}<a href={`/api/v1/provider-documents/${document.id}/content`} className="mt-3 inline-block text-sm text-primary hover:underline">دریافت فایل خصوصی</a></article>)}</div>

            <div className="mt-8 flex flex-wrap gap-3"><Button onClick={submitForReview} disabled={loading || detail.application?.status === "APPROVED"}>ارسال پرونده برای بررسی</Button>{detail.application?.status === "REJECTED" && <><Input value={appealReason} onChange={(event) => setAppealReason(event.target.value)} placeholder="دلیل اعتراض" className="max-w-sm" /><Button variant="outline" onClick={appeal} disabled={loading || appealReason.length < 10}>ثبت اعتراض</Button></>}</div>
          </>}
        </section>
      </div>
    </main>
  )
}
