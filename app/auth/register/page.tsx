"use client"

import { type FormEvent, useState } from "react"
import Link from "next/link"
import { Phone, UserRound } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type ApiPayload<T> = { ok: true; data: T } | { ok: false; error: { message: string } }
type OtpChallenge = { challengeId: string; mobileMasked: string; developmentCode?: string }

async function request<T>(url: string, method: "POST" | "PATCH", body: unknown): Promise<T> {
  const response = await fetch(url, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) })
  const payload = await response.json() as ApiPayload<T>
  if (!payload.ok) throw new Error(payload.error.message)
  return payload.data
}

export default function RegisterPage() {
  const [mobile, setMobile] = useState("")
  const [challenge, setChallenge] = useState<OtpChallenge | null>(null)
  const [code, setCode] = useState("")
  const [verified, setVerified] = useState(false)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function sendOtp(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError("")
    try { setChallenge(await request<OtpChallenge>("/api/auth/otp/request", "POST", { mobile })) }
    catch (reason) { setError(reason instanceof Error ? reason.message : "ارسال کد انجام نشد.") }
    finally { setLoading(false) }
  }

  async function verifyOtp(event: FormEvent) {
    event.preventDefault()
    if (!challenge) return
    setLoading(true)
    setError("")
    try {
      await request("/api/auth/otp/verify", "POST", { mobile, challengeId: challenge.challengeId, code })
      setVerified(true)
    } catch (reason) { setError(reason instanceof Error ? reason.message : "کد تأیید معتبر نیست.") }
    finally { setLoading(false) }
  }

  async function completeProfile(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError("")
    try {
      await request("/api/auth/me", "PATCH", { firstName, lastName })
      window.location.assign("/dashboard")
    } catch (reason) { setError(reason instanceof Error ? reason.message : "تکمیل پروفایل انجام نشد.") }
    finally { setLoading(false) }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12" dir="rtl">
      <section className="w-full max-w-md rounded-2xl border bg-background p-6 shadow-sm md:p-8">
        <Link href="/" className="text-xl font-bold">لوکس بیوتی</Link>
        <h1 className="mt-8 text-3xl font-bold">ساخت حساب مشتری</h1>
        <p className="mt-2 text-sm text-muted-foreground">شماره موبایل تأیید می‌شود و سپس نام واقعی حساب تکمیل خواهد شد.</p>
        {error && <p role="alert" className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

        {!challenge && !verified && (
          <form onSubmit={sendOtp} className="mt-6 space-y-4">
            <div className="space-y-2"><Label htmlFor="mobile">شماره موبایل</Label><div className="relative"><Phone className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" /><Input id="mobile" value={mobile} onChange={(event) => setMobile(event.target.value)} className="pr-10" dir="ltr" inputMode="tel" autoComplete="tel" required /></div></div>
            <Button className="w-full" disabled={loading}>{loading ? "در حال ارسال..." : "دریافت کد تأیید"}</Button>
          </form>
        )}

        {challenge && !verified && (
          <form onSubmit={verifyOtp} className="mt-6 space-y-4">
            <p className="text-sm text-muted-foreground">کد برای {challenge.mobileMasked} ارسال شد.</p>
            {challenge.developmentCode && <p className="rounded-lg border border-dashed p-3 text-sm">کد Mock توسعه: <b dir="ltr">{challenge.developmentCode}</b></p>}
            <div className="space-y-2"><Label htmlFor="code">کد شش‌رقمی</Label><Input id="code" value={code} onChange={(event) => setCode(event.target.value)} dir="ltr" inputMode="numeric" autoComplete="one-time-code" maxLength={6} className="text-center text-lg tracking-[0.35em]" required /></div>
            <Button className="w-full" disabled={loading}>{loading ? "در حال بررسی..." : "تأیید شماره"}</Button>
            <Button type="button" variant="ghost" className="w-full" onClick={() => setChallenge(null)}>تغییر شماره</Button>
          </form>
        )}

        {verified && (
          <form onSubmit={completeProfile} className="mt-6 space-y-4">
            <div className="rounded-lg bg-muted p-3 text-sm">شماره موبایل تأیید شد. اطلاعات پروفایل را تکمیل کنید.</div>
            <div className="space-y-2"><Label htmlFor="first-name">نام</Label><div className="relative"><UserRound className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" /><Input id="first-name" value={firstName} onChange={(event) => setFirstName(event.target.value)} className="pr-10" autoComplete="given-name" required /></div></div>
            <div className="space-y-2"><Label htmlFor="last-name">نام خانوادگی</Label><Input id="last-name" value={lastName} onChange={(event) => setLastName(event.target.value)} autoComplete="family-name" required /></div>
            <Button className="w-full" disabled={loading}>{loading ? "در حال ذخیره..." : "تکمیل ثبت‌نام"}</Button>
          </form>
        )}

        <p className="mt-8 text-center text-sm text-muted-foreground">حساب دارید؟ <Link href="/auth/login" className="font-medium text-primary hover:underline">ورود</Link></p>
      </section>
    </main>
  )
}
