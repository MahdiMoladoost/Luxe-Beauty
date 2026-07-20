"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"

type Account = {
  mobileNormalized: string
  identityStatus: string
  roles: string[]
  mustChangePassword: boolean
}

type ApiPayload<T> = { ok: true; data: T } | { ok: false; error: { message: string } }

export default function SecurityPage() {
  const [account, setAccount] = useState<Account | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true
    fetch("/api/auth/me", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: ApiPayload<Account>) => {
        if (!active) return
        if (payload.ok) setAccount(payload.data)
        else setError(payload.error.message)
      })
      .catch(() => active && setError("دریافت اطلاعات امنیتی انجام نشد."))
    return () => { active = false }
  }, [])

  async function logoutAll() {
    setLoading(true)
    setError("")
    try {
      const response = await fetch("/api/auth/logout-all", { method: "POST" })
      const payload = await response.json() as ApiPayload<{ revokedSessions: number }>
      if (!payload.ok) throw new Error(payload.error.message)
      window.location.assign("/auth/login?logout=all")
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "خروج از دستگاه‌ها انجام نشد.")
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-4 py-10 md:p-8" dir="rtl">
      <div className="rounded-2xl border bg-background p-6 shadow-sm">
        <h1 className="text-3xl font-bold">امنیت حساب</h1>
        <p className="mt-2 text-muted-foreground">نشست‌ها، وضعیت هویت و روش‌های ورود حساب خود را مدیریت کنید.</p>
        {error && <p role="alert" className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        {!account ? <p className="mt-8 text-sm text-muted-foreground">در حال دریافت اطلاعات...</p> : (
          <dl className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-muted p-4"><dt className="text-sm text-muted-foreground">شماره موبایل</dt><dd className="mt-1 font-medium" dir="ltr">{account.mobileNormalized}</dd></div>
            <div className="rounded-xl bg-muted p-4"><dt className="text-sm text-muted-foreground">وضعیت احراز هویت</dt><dd className="mt-1 font-medium">{account.identityStatus}</dd></div>
            <div className="rounded-xl bg-muted p-4 sm:col-span-2"><dt className="text-sm text-muted-foreground">نقش‌ها</dt><dd className="mt-1 font-medium">{account.roles.join("، ") || "بدون نقش"}</dd></div>
          </dl>
        )}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="outline"><Link href="/auth/change-password">تغییر رمز عبور</Link></Button>
          <Button variant="destructive" onClick={logoutAll} disabled={loading}>{loading ? "در حال خروج..." : "خروج از همه دستگاه‌ها"}</Button>
        </div>
      </div>
    </main>
  )
}
