"use client"

import { type FormEvent, useState } from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type ApiPayload<T> = { ok: true; data: T } | { ok: false; error: { message: string } }
type OtpChallenge = { challengeId: string; mobileMasked: string; developmentCode?: string }

async function post<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
  const payload = await response.json() as ApiPayload<T>
  if (!payload.ok) throw new Error(payload.error.message)
  return payload.data
}

export default function ForgotPasswordPage() {
  const [mobile, setMobile] = useState("")
  const [challenge, setChallenge] = useState<OtpChallenge | null>(null)
  const [code, setCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  async function requestReset(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError("")
    setMessage("")
    try {
      const result = await post<{ accepted: true; challenge?: OtpChallenge }>("/api/auth/password/request-reset", { mobile })
      if (result.challenge) setChallenge(result.challenge)
      else setMessage("اگر برای این شماره حساب مدیریتی یا ارائه‌دهنده وجود داشته باشد، کد بازیابی ارسال می‌شود.")
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "درخواست بازیابی انجام نشد.")
    } finally {
      setLoading(false)
    }
  }

  async function resetPassword(event: FormEvent) {
    event.preventDefault()
    if (!challenge) return
    setLoading(true)
    setError("")
    try {
      await post("/api/auth/password/reset", {
        challengeId: challenge.challengeId,
        code,
        newPassword,
      })
      setMessage("رمز عبور تغییر کرد. اکنون می‌توانید وارد شوید.")
      setChallenge(null)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "تغییر رمز انجام نشد.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12" dir="rtl">
      <section className="w-full max-w-md rounded-2xl border bg-background p-6 shadow-sm md:p-8">
        <Link href="/" className="text-xl font-bold">لوکس بیوتی</Link>
        <h1 className="mt-8 text-3xl font-bold">بازیابی رمز عبور</h1>
        <p className="mt-2 text-sm text-muted-foreground">این مسیر فقط برای مدیران و ارائه‌دهندگانی است که با موبایل و رمز وارد می‌شوند.</p>

        {error && <p role="alert" className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        {message && <p className="mt-4 rounded-lg bg-muted p-3 text-sm">{message}</p>}

        {!challenge ? (
          <form onSubmit={requestReset} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mobile">شماره موبایل</Label>
              <Input id="mobile" value={mobile} onChange={(event) => setMobile(event.target.value)} dir="ltr" inputMode="tel" autoComplete="username" required />
            </div>
            <Button className="w-full" disabled={loading}>{loading ? "در حال ارسال..." : "ارسال کد بازیابی"}</Button>
          </form>
        ) : (
          <form onSubmit={resetPassword} className="mt-6 space-y-4">
            <p className="text-sm text-muted-foreground">کد برای {challenge.mobileMasked} ارسال شد.</p>
            {challenge.developmentCode && <p className="rounded-lg border border-dashed p-3 text-sm">کد Mock توسعه: <b dir="ltr">{challenge.developmentCode}</b></p>}
            <div className="space-y-2">
              <Label htmlFor="code">کد شش‌رقمی</Label>
              <Input id="code" value={code} onChange={(event) => setCode(event.target.value)} dir="ltr" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">رمز جدید</Label>
              <Input id="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} type="password" dir="ltr" autoComplete="new-password" minLength={12} required />
              <p className="text-xs text-muted-foreground">حداقل ۱۲ کاراکتر و شامل حرف و عدد.</p>
            </div>
            <Button className="w-full" disabled={loading}>{loading ? "در حال تغییر..." : "تغییر رمز"}</Button>
          </form>
        )}

        <Link href="/auth/login" className="mt-6 block text-center text-sm text-primary hover:underline">بازگشت به ورود</Link>
      </section>
    </main>
  )
}
