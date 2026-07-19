"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, CheckCircle2, Loader2, Phone, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { isIranianMobile } from "@/lib/booking-engine"

type ApiResult<T> = { ok: true; data: T } | { ok: false; error: { message: string } }

export default function LoginPage() {
  const router = useRouter()
  const [mobile, setMobile] = useState("")
  const [code, setCode] = useState("")
  const [codeSent, setCodeSent] = useState(false)
  const [demoCode, setDemoCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function requestCode(event: React.FormEvent) {
    event.preventDefault()
    if (!isIranianMobile(mobile)) return setError("شماره موبایل باید با ۰۹ شروع شود و ۱۱ رقم باشد.")
    setLoading(true)
    setError("")
    try {
      const response = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request", mobile }),
      })
      const result = (await response.json()) as ApiResult<{ demoCode?: string }>
      if (!result.ok) throw new Error(result.error.message)
      setCodeSent(true)
      setDemoCode(result.data.demoCode ?? "")
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ارسال کد تایید ناموفق بود.")
    } finally {
      setLoading(false)
    }
  }

  async function verifyCode(event: React.FormEvent) {
    event.preventDefault()
    if (code.length < 5) return setError("کد تایید را کامل وارد کنید.")
    setLoading(true)
    setError("")
    try {
      const response = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", mobile, code }),
      })
      const result = (await response.json()) as ApiResult<{ verified: boolean }>
      if (!result.ok) throw new Error(result.error.message)
      router.replace("/dashboard")
      router.refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "تایید کد ناموفق بود.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      <main className="flex items-center justify-center px-4 py-12 md:px-8">
        <div className="w-full max-w-md">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-lg font-black text-primary-foreground">ل</div>
            <div><p className="text-xl font-black text-foreground">لوکس بیوتی</p><p className="text-xs text-muted-foreground">رزرو آنلاین زیبایی</p></div>
          </Link>

          <p className="mt-10 text-sm font-bold text-primary">ورود یا ثبت‌نام</p>
          <h1 className="mt-2 text-3xl font-black text-foreground">با شماره موبایل ادامه دهید</h1>
          <p className="mt-3 leading-7 text-muted-foreground">حساب جدید پس از اولین تایید شماره ایجاد می‌شود و نیازی به رمز عبور نیست.</p>

          {!codeSent ? (
            <form onSubmit={requestCode} className="mt-8 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="mobile">شماره موبایل</Label>
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input id="mobile" dir="ltr" inputMode="numeric" maxLength={11} value={mobile} onChange={(event) => setMobile(event.target.value)} placeholder="09123456789" className="h-12 pr-10 text-left" autoComplete="tel" />
                </div>
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={loading}>{loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}دریافت کد تایید<ArrowLeft className="mr-2 h-4 w-4" /></Button>
            </form>
          ) : (
            <form onSubmit={verifyCode} className="mt-8 space-y-5">
              <div className="rounded-2xl bg-secondary p-4 text-sm text-muted-foreground"><CheckCircle2 className="ml-2 inline h-5 w-5 text-emerald-600" />کد تایید برای <strong dir="ltr" className="text-foreground">{mobile}</strong> ارسال شد.</div>
              <div className="space-y-2">
                <Label htmlFor="otp">کد تایید</Label>
                <Input id="otp" dir="ltr" inputMode="numeric" maxLength={5} value={code} onChange={(event) => setCode(event.target.value)} placeholder="•••••" className="h-12 text-center text-xl tracking-[0.45em]" autoComplete="one-time-code" />
              </div>
              {demoCode && <div className="rounded-xl border border-dashed border-amber-500/50 bg-amber-500/5 p-3 text-center text-sm text-amber-800">کد محیط توسعه: <strong dir="ltr">{demoCode}</strong></div>}
              <Button type="submit" size="lg" className="w-full" disabled={loading}>{loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}تایید و ورود</Button>
              <button type="button" className="w-full text-sm font-bold text-primary" onClick={() => { setCodeSent(false); setCode(""); setDemoCode(""); setError("") }}>ویرایش شماره موبایل</button>
            </form>
          )}

          {error && <div role="alert" className="mt-5 rounded-xl bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}

          <p className="mt-7 text-center text-xs leading-6 text-muted-foreground">با ادامه، <Link href="/terms" className="font-bold text-primary">قوانین استفاده</Link> و <Link href="/privacy" className="font-bold text-primary">حریم خصوصی</Link> را می‌پذیرید.</p>
          <div className="mt-7 grid grid-cols-2 gap-3 border-t border-border pt-6"><Button variant="outline" asChild><Link href="/salon-dashboard">ورود سالن‌داران</Link></Button><Button variant="outline" asChild><Link href="/staff-dashboard">پنل آرایشگر</Link></Button></div>
        </div>
      </main>

      <aside className="hidden items-center justify-center bg-gradient-to-br from-primary/20 via-rose-500/10 to-secondary p-12 lg:flex">
        <div className="max-w-lg rounded-3xl border border-white/40 bg-background/65 p-8 backdrop-blur-xl">
          <ShieldCheck className="h-12 w-12 text-primary" />
          <h2 className="mt-6 text-4xl font-black leading-tight text-foreground">رزرو شفاف، بدون تماس و هماهنگی تکراری</h2>
          <p className="mt-5 text-lg leading-9 text-muted-foreground">خدمت، قیمت، متخصص و زمان آزاد را ببینید؛ بیعانه را امن پرداخت کنید و تایید نوبت را دریافت کنید.</p>
        </div>
      </aside>
    </div>
  )
}
