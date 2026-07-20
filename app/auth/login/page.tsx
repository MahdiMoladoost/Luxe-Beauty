"use client"

import { type FormEvent, useState } from "react"
import Link from "next/link"
import { Eye, EyeOff, Lock, Phone, ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type ApiPayload<T> = { ok: true; data: T } | { ok: false; error: { message: string } }

type OtpChallenge = {
  challengeId: string
  mobileMasked: string
  developmentCode?: string
}

type Principal = {
  mustChangePassword: boolean
  roleKeys: string[]
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
  const payload = await response.json() as ApiPayload<T>
  if (!payload.ok) throw new Error(payload.error.message)
  return payload.data
}

function destination(principal?: Principal): string {
  if (principal?.mustChangePassword) return "/auth/change-password"
  const next = new URLSearchParams(window.location.search).get("next")
  if (next?.startsWith("/")) return next
  if (principal?.roleKeys.includes("customer") && principal.roleKeys.length === 1) return "/dashboard"
  return "/admin"
}

export default function LoginPage() {
  const [mode, setMode] = useState<"customer" | "staff">("customer")
  const [mobile, setMobile] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [challenge, setChallenge] = useState<OtpChallenge | null>(null)
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function requestCustomerOtp(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError("")
    try {
      setChallenge(await postJson<OtpChallenge>("/api/auth/otp/request", { mobile }))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ارسال کد انجام نشد.")
    } finally {
      setLoading(false)
    }
  }

  async function verifyCustomer(event: FormEvent) {
    event.preventDefault()
    if (!challenge) return
    setLoading(true)
    setError("")
    try {
      const result = await postJson<{ principal: Principal }>("/api/auth/otp/verify", {
        mobile,
        challengeId: challenge.challengeId,
        code,
      })
      window.location.assign(destination(result.principal))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ورود انجام نشد.")
    } finally {
      setLoading(false)
    }
  }

  async function loginStaff(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError("")
    try {
      const result = await postJson<
        | { requiresTwoFactor: true; challenge: OtpChallenge }
        | { requiresTwoFactor: false; principal: Principal }
      >("/api/auth/staff/login", { mobile, password })

      if (result.requiresTwoFactor) setChallenge(result.challenge)
      else window.location.assign(destination(result.principal))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ورود انجام نشد.")
    } finally {
      setLoading(false)
    }
  }

  async function verifyStaff(event: FormEvent) {
    event.preventDefault()
    if (!challenge) return
    setLoading(true)
    setError("")
    try {
      const result = await postJson<{ principal: Principal }>("/api/auth/staff/verify-2fa", {
        challengeId: challenge.challengeId,
        code,
      })
      window.location.assign(destination(result.principal))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "تأیید دومرحله‌ای انجام نشد.")
    } finally {
      setLoading(false)
    }
  }

  function switchMode(nextMode: "customer" | "staff") {
    setMode(nextMode)
    setChallenge(null)
    setCode("")
    setError("")
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12" dir="rtl">
      <section className="w-full max-w-md rounded-2xl border bg-background p-6 shadow-sm md:p-8">
        <Link href="/" className="text-xl font-bold">لوکس بیوتی</Link>
        <h1 className="mt-8 text-3xl font-bold">ورود امن</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          مشتریان با کد پیامکی و مدیران یا ارائه‌دهندگان با موبایل، رمز و تأیید دومرحله‌ای وارد می‌شوند.
        </p>

        <div className="mt-6 grid grid-cols-2 rounded-xl bg-muted p-1">
          <button type="button" className={`rounded-lg px-3 py-2 text-sm ${mode === "customer" ? "bg-background font-medium shadow-sm" : "text-muted-foreground"}`} onClick={() => switchMode("customer")}>مشتری</button>
          <button type="button" className={`rounded-lg px-3 py-2 text-sm ${mode === "staff" ? "bg-background font-medium shadow-sm" : "text-muted-foreground"}`} onClick={() => switchMode("staff")}>مدیر / ارائه‌دهنده</button>
        </div>

        {error && <p role="alert" className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

        {mode === "customer" && !challenge && (
          <form onSubmit={requestCustomerOtp} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customer-mobile">شماره موبایل</Label>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input id="customer-mobile" value={mobile} onChange={(event) => setMobile(event.target.value)} className="pr-10" dir="ltr" inputMode="tel" autoComplete="tel" required />
              </div>
            </div>
            <Button className="w-full" disabled={loading}>{loading ? "در حال ارسال..." : "دریافت کد تأیید"}</Button>
          </form>
        )}

        {mode === "customer" && challenge && (
          <form onSubmit={verifyCustomer} className="mt-6 space-y-4">
            <p className="text-sm text-muted-foreground">کد برای {challenge.mobileMasked} ارسال شد.</p>
            {challenge.developmentCode && <p className="rounded-lg border border-dashed p-3 text-sm">کد Mock توسعه: <b dir="ltr">{challenge.developmentCode}</b></p>}
            <div className="space-y-2">
              <Label htmlFor="customer-code">کد شش‌رقمی</Label>
              <Input id="customer-code" value={code} onChange={(event) => setCode(event.target.value)} dir="ltr" inputMode="numeric" autoComplete="one-time-code" maxLength={6} className="text-center text-lg tracking-[0.35em]" required />
            </div>
            <Button className="w-full" disabled={loading}>{loading ? "در حال بررسی..." : "ورود"}</Button>
            <Button type="button" variant="ghost" className="w-full" onClick={() => setChallenge(null)}>تغییر شماره</Button>
          </form>
        )}

        {mode === "staff" && !challenge && (
          <form onSubmit={loginStaff} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="staff-mobile">شماره موبایل</Label>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input id="staff-mobile" value={mobile} onChange={(event) => setMobile(event.target.value)} className="pr-10" dir="ltr" inputMode="tel" autoComplete="username" required />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="staff-password">رمز عبور</Label>
                <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline">بازیابی رمز</Link>
              </div>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input id="staff-password" value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? "text" : "password"} className="px-10" dir="ltr" autoComplete="current-password" required />
                <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label="نمایش رمز">
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <Button className="w-full" disabled={loading}>{loading ? "در حال بررسی..." : "ادامه ورود"}</Button>
          </form>
        )}

        {mode === "staff" && challenge && (
          <form onSubmit={verifyStaff} className="mt-6 space-y-4">
            <div className="flex items-center gap-2 rounded-lg bg-muted p-3 text-sm"><ShieldCheck className="h-5 w-5" />تأیید دومرحله‌ای برای {challenge.mobileMasked}</div>
            {challenge.developmentCode && <p className="rounded-lg border border-dashed p-3 text-sm">کد Mock توسعه: <b dir="ltr">{challenge.developmentCode}</b></p>}
            <Input value={code} onChange={(event) => setCode(event.target.value)} dir="ltr" inputMode="numeric" autoComplete="one-time-code" maxLength={6} className="text-center text-lg tracking-[0.35em]" required />
            <Button className="w-full" disabled={loading}>{loading ? "در حال تأیید..." : "تأیید و ورود"}</Button>
            <Button type="button" variant="ghost" className="w-full" onClick={() => setChallenge(null)}>بازگشت</Button>
          </form>
        )}

        <p className="mt-8 text-center text-sm text-muted-foreground">مشتری جدید هستید؟ <Link href="/auth/register" className="font-medium text-primary hover:underline">ثبت‌نام با موبایل</Link></p>
      </section>
    </main>
  )
}
