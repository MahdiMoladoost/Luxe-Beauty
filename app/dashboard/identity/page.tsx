"use client"

import { type FormEvent, useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type IdentityStatus = {
  status: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED" | "REQUIRES_REVIEW"
  providerMode: "mock" | "sandbox" | "production"
  submittedAt: string | null
  decidedAt: string | null
  reasonCode: string | null
}

type ApiPayload<T> = { ok: true; data: T } | { ok: false; error: { message: string } }

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: "no-store", ...init })
  const payload = await response.json() as ApiPayload<T>
  if (!payload.ok) throw new Error(payload.error.message)
  return payload.data
}

const statusLabels: Record<IdentityStatus["status"], string> = {
  UNVERIFIED: "ارسال نشده",
  PENDING: "در انتظار بررسی",
  VERIFIED: "تأیید شده",
  REJECTED: "رد شده",
  REQUIRES_REVIEW: "نیازمند بررسی دستی",
}

export default function IdentityPage() {
  const [status, setStatus] = useState<IdentityStatus | null>(null)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [nationalId, setNationalId] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    void api<IdentityStatus>("/api/v1/identity/status")
      .then((value) => active && setStatus(value))
      .catch((reason: unknown) => active && setError(reason instanceof Error ? reason.message : "دریافت وضعیت انجام نشد."))
    return () => { active = false }
  }, [])

  async function submit(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError("")
    try {
      const next = await api<IdentityStatus>("/api/v1/identity/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ firstName, lastName, nationalId }),
      })
      setStatus(next)
      setNationalId("")
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ارسال احراز هویت انجام نشد.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-4 py-10 md:p-8" dir="rtl">
      <section className="rounded-2xl border bg-background p-6 shadow-sm">
        <h1 className="text-3xl font-bold">احراز هویت مشتری</h1>
        <p className="mt-2 text-muted-foreground">نام، نام خانوادگی، شماره موبایل تأییدشده و کد ملی با Adapter سرویس هویت تطبیق داده می‌شوند.</p>

        <div className="mt-6 rounded-xl bg-muted p-4">
          <p className="text-sm text-muted-foreground">وضعیت فعلی</p>
          <p className="mt-1 text-lg font-semibold">{status ? statusLabels[status.status] : "در حال دریافت..."}</p>
          {status?.providerMode === "mock" && <p className="mt-2 text-xs text-muted-foreground">حالت توسعه Mock است و تأیید تولیدی محسوب نمی‌شود.</p>}
          {status?.reasonCode && <p className="mt-2 text-xs text-muted-foreground" dir="ltr">Reason: {status.reasonCode}</p>}
        </div>

        {error && <p role="alert" className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="identity-first-name">نام مطابق مدرک</Label><Input id="identity-first-name" value={firstName} onChange={(event) => setFirstName(event.target.value)} autoComplete="given-name" required /></div>
            <div className="space-y-2"><Label htmlFor="identity-last-name">نام خانوادگی مطابق مدرک</Label><Input id="identity-last-name" value={lastName} onChange={(event) => setLastName(event.target.value)} autoComplete="family-name" required /></div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="national-id">کد ملی</Label>
            <Input id="national-id" value={nationalId} onChange={(event) => setNationalId(event.target.value)} dir="ltr" inputMode="numeric" autoComplete="off" maxLength={10} required />
            <p className="text-xs text-muted-foreground">کد ملی در Log یا رابط عمومی نمایش داده نمی‌شود؛ یکتایی با HMAC و بازیابی کنترل‌شده با رمزنگاری انجام می‌شود.</p>
          </div>
          <Button disabled={loading || status?.status === "VERIFIED"}>{loading ? "در حال بررسی..." : status?.status === "VERIFIED" ? "احراز هویت تأیید شده" : "ارسال برای بررسی"}</Button>
        </form>
      </section>
    </main>
  )
}
