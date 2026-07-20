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

type SessionDevice = {
  id: string
  authMethod: string
  userAgentSummary: string | null
  twoFactorVerifiedAt: string | null
  createdAt: string
  lastSeenAt: string
  expiresAt: string
  idleExpiresAt: string
  current: boolean
}

type ApiPayload<T> = { ok: true; data: T } | { ok: false; error: { message: string } }

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: "no-store", ...init })
  const payload = await response.json() as ApiPayload<T>
  if (!payload.ok) throw new Error(payload.error.message)
  return payload.data
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

export default function SecurityPage() {
  const [account, setAccount] = useState<Account | null>(null)
  const [sessions, setSessions] = useState<SessionDevice[]>([])
  const [error, setError] = useState("")
  const [busySessionId, setBusySessionId] = useState<string | null>(null)
  const [loggingOutAll, setLoggingOutAll] = useState(false)

  useEffect(() => {
    let active = true

    void Promise.all([
      api<Account>("/api/auth/me"),
      api<SessionDevice[]>("/api/auth/sessions"),
    ])
      .then(([accountData, sessionData]) => {
        if (!active) return
        setAccount(accountData)
        setSessions(sessionData)
      })
      .catch((reason: unknown) => {
        if (!active) return
        setError(reason instanceof Error ? reason.message : "دریافت اطلاعات امنیتی انجام نشد.")
      })

    return () => {
      active = false
    }
  }, [])

  async function revokeSession(session: SessionDevice) {
    setBusySessionId(session.id)
    setError("")
    try {
      const result = await api<{ currentSessionRevoked: boolean }>(`/api/auth/sessions/${session.id}`, {
        method: "DELETE",
      })
      if (result.currentSessionRevoked) {
        window.location.assign("/auth/login?session=revoked")
        return
      }
      setSessions((current) => current.filter((item) => item.id !== session.id))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "خروج دستگاه انجام نشد.")
    } finally {
      setBusySessionId(null)
    }
  }

  async function logoutAll() {
    setLoggingOutAll(true)
    setError("")
    try {
      await api<{ revokedSessions: number }>("/api/auth/logout-all", { method: "POST" })
      window.location.assign("/auth/login?logout=all")
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "خروج از دستگاه‌ها انجام نشد.")
      setLoggingOutAll(false)
    }
  }

  return (
    <main className="mx-auto max-w-4xl p-4 py-10 md:p-8" dir="rtl">
      <div className="rounded-2xl border bg-background p-6 shadow-sm">
        <h1 className="text-3xl font-bold">امنیت حساب</h1>
        <p className="mt-2 text-muted-foreground">نشست‌های فعال، وضعیت هویت و روش‌های ورود حساب خود را مدیریت کنید.</p>
        {error && <p role="alert" className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

        {!account ? <p className="mt-8 text-sm text-muted-foreground">در حال دریافت اطلاعات...</p> : (
          <dl className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-muted p-4"><dt className="text-sm text-muted-foreground">شماره موبایل</dt><dd className="mt-1 font-medium" dir="ltr">{account.mobileNormalized}</dd></div>
            <div className="rounded-xl bg-muted p-4"><dt className="text-sm text-muted-foreground">وضعیت احراز هویت</dt><dd className="mt-1 font-medium">{account.identityStatus}</dd></div>
            <div className="rounded-xl bg-muted p-4 sm:col-span-2"><dt className="text-sm text-muted-foreground">نقش‌ها</dt><dd className="mt-1 font-medium">{account.roles.join("، ") || "بدون نقش"}</dd></div>
          </dl>
        )}

        <section className="mt-8">
          <div className="flex items-center justify-between gap-4">
            <div><h2 className="text-xl font-bold">دستگاه‌ها و نشست‌ها</h2><p className="mt-1 text-sm text-muted-foreground">فقط نشست‌های فعال نمایش داده می‌شوند.</p></div>
            <Button variant="destructive" onClick={logoutAll} disabled={loggingOutAll}>{loggingOutAll ? "در حال خروج..." : "خروج از همه"}</Button>
          </div>
          <div className="mt-4 space-y-3">
            {sessions.length === 0 && <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">نشست فعالی یافت نشد.</p>}
            {sessions.map((session) => (
              <article key={session.id} className="flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{session.userAgentSummary || "دستگاه ناشناس"}</h3>{session.current && <span className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">همین دستگاه</span>}</div>
                  <p className="mt-2 text-xs text-muted-foreground">روش ورود: <span dir="ltr">{session.authMethod}</span> · آخرین فعالیت: {formatDate(session.lastSeenAt)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">انقضای نشست: {formatDate(session.expiresAt)}</p>
                </div>
                <Button variant="outline" onClick={() => revokeSession(session)} disabled={busySessionId === session.id}>{busySessionId === session.id ? "در حال خروج..." : "خروج این دستگاه"}</Button>
              </article>
            ))}
          </div>
        </section>

        <div className="mt-8"><Button asChild variant="outline"><Link href="/auth/change-password">تغییر رمز عبور</Link></Button></div>
      </div>
    </main>
  )
}
