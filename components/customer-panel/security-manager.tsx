"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  Check,
  Laptop,
  Loader2,
  LogOut,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  TabletSmartphone,
  Trash2,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

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

type ApiEnvelope<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } }

async function apiRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: "same-origin",
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  })
  const payload = (await response.json()) as ApiEnvelope<T>
  if (!payload.ok) throw new Error(payload.error.message)
  return payload.data
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("fa-IR", {
    timeZone: "Asia/Tehran",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function deviceInfo(userAgent: string | null) {
  const value = userAgent ?? ""
  const mobile = /Mobile|Android|iPhone/i.test(value)
  const tablet = /iPad|Tablet/i.test(value)
  const browser = /Edg\//i.test(value)
    ? "Microsoft Edge"
    : /Firefox\//i.test(value)
      ? "Firefox"
      : /Chrome\//i.test(value)
        ? "Chrome"
        : /Safari\//i.test(value)
          ? "Safari"
          : "مرورگر ناشناس"
  const platform = /Windows/i.test(value)
    ? "Windows"
    : /Android/i.test(value)
      ? "Android"
      : /iPhone|iPad|Mac OS/i.test(value)
        ? "Apple"
        : /Linux/i.test(value)
          ? "Linux"
          : "دستگاه ناشناس"
  return {
    label: `${browser} روی ${platform}`,
    Icon: tablet ? TabletSmartphone : mobile ? Smartphone : Laptop,
  }
}

export function SecurityManager() {
  const router = useRouter()
  const [sessions, setSessions] = useState<SessionDevice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [revoking, setRevoking] = useState<SessionDevice | null>(null)
  const [logoutAllOpen, setLogoutAllOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setSessions(await apiRequest<SessionDevice[]>("/api/auth/sessions"))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "بارگیری نشست‌ها ناموفق بود.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  async function revokeSession() {
    if (!revoking) return
    setSaving(true)
    setActionError(null)
    try {
      const result = await apiRequest<{ currentSessionRevoked: boolean }>(
        `/api/auth/sessions/${revoking.id}`,
        { method: "DELETE" },
      )
      if (result.currentSessionRevoked) {
        router.replace("/auth/login")
        router.refresh()
        return
      }
      setRevoking(null)
      setNotice("نشست انتخاب‌شده با موفقیت بسته شد.")
      await load()
    } catch (revokeError) {
      setActionError(revokeError instanceof Error ? revokeError.message : "بستن نشست ناموفق بود.")
    } finally {
      setSaving(false)
    }
  }

  async function logoutAll() {
    setSaving(true)
    setActionError(null)
    try {
      await apiRequest<{ revokedSessions: number }>("/api/auth/logout-all", { method: "POST" })
      router.replace("/auth/login")
      router.refresh()
    } catch (logoutError) {
      setActionError(logoutError instanceof Error ? logoutError.message : "خروج از همه دستگاه‌ها ناموفق بود.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      {notice ? (
        <div role="status" className="flex items-start justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <span className="flex items-center gap-2"><Check className="size-5" />{notice}</span>
          <button type="button" onClick={() => setNotice(null)} className="font-black" aria-label="بستن پیام">×</button>
        </div>
      ) : null}

      <section className="rounded-[28px] border border-[#5b4033]/10 bg-white p-5 shadow-[0_18px_55px_rgba(66,43,32,0.06)] sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-black text-[#34231d]">نشست‌های فعال</h2>
            <p className="mt-1 text-sm leading-7 text-[#806e64]">دستگاه‌هایی که هنوز به حساب شما دسترسی دارند.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className={cn("size-4", loading && "animate-spin")} />تازه‌سازی</Button>
            <Button type="button" variant="destructive" onClick={() => { setLogoutAllOpen(true); setActionError(null) }} disabled={sessions.length === 0}><LogOut className="size-4" />خروج از همه دستگاه‌ها</Button>
          </div>
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-36 animate-pulse rounded-2xl bg-stone-200/70" />)}</div>
          ) : error ? (
            <div className="rounded-[26px] border border-rose-200 bg-rose-50 p-8 text-center"><AlertCircle className="mx-auto size-10 text-rose-500" /><p className="mt-4 font-bold text-rose-900">بارگیری نشست‌ها ناموفق بود</p><p className="mt-2 text-sm text-rose-700">{error}</p><Button type="button" variant="outline" className="mt-5" onClick={() => void load()}>تلاش دوباره</Button></div>
          ) : sessions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#5b4033]/20 p-8 text-center text-sm text-[#806e64]">نشست فعالی برای نمایش وجود ندارد.</div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => {
                const device = deviceInfo(session.userAgentSummary)
                const Icon = device.Icon
                return (
                  <article key={session.id} className="rounded-[22px] border border-[#5b4033]/10 bg-[#fcfaf7] p-4 sm:p-5">
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#3a251e] text-[#e8c58d]"><Icon className="size-5" /></div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2"><h3 className="font-black text-[#3d2a22]">{device.label}</h3>{session.current ? <Badge className="bg-emerald-700 text-white">دستگاه فعلی</Badge> : null}</div>
                          <div className="mt-2 grid gap-x-5 gap-y-1 text-xs text-[#806e64] sm:grid-cols-2"><span>آخرین فعالیت: {formatDateTime(session.lastSeenAt)}</span><span>شروع نشست: {formatDateTime(session.createdAt)}</span><span>انقضای مطلق: {formatDateTime(session.expiresAt)}</span><span>روش ورود: {session.authMethod === "OTP" ? "رمز یک‌بارمصرف" : session.authMethod}</span></div>
                        </div>
                      </div>
                      <Button type="button" variant="outline" className="text-rose-700" onClick={() => { setRevoking(session); setActionError(null) }}><Trash2 className="size-4" />{session.current ? "خروج از این دستگاه" : "بستن نشست"}</Button>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-5 text-emerald-900"><ShieldCheck className="size-7" /><h3 className="mt-4 font-black">نشست‌ها مالک‌محور هستند</h3><p className="mt-2 text-sm leading-7">شناسه نشست حساب دیگر قابل مشاهده یا ابطال نیست و درخواست متقاطع با Not Found پاسخ می‌گیرد.</p></div>
        <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-5 text-amber-900"><ShieldAlert className="size-7" /><h3 className="mt-4 font-black">دستگاه ناشناس دیدید؟</h3><p className="mt-2 text-sm leading-7">نشست را فوراً ببندید. خروج از همه دستگاه‌ها، نشست فعلی را هم باطل می‌کند و باید دوباره وارد شوید.</p></div>
      </section>

      <Dialog open={Boolean(revoking)} onOpenChange={(open) => { if (!open && !saving) setRevoking(null) }}>
        <DialogContent dir="rtl" className="sm:max-w-md">
          <DialogHeader className="text-right sm:text-right"><DialogTitle>{revoking?.current ? "خروج از دستگاه فعلی" : "بستن نشست دستگاه"}</DialogTitle><DialogDescription>دسترسی این نشست بلافاصله باطل می‌شود.</DialogDescription></DialogHeader>
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm leading-7 text-rose-900">{revoking?.current ? "پس از تأیید، به صفحه ورود منتقل می‌شوید." : "این دستگاه دیگر نمی‌تواند با نشست فعلی به حساب دسترسی داشته باشد."}</div>
          {actionError ? <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{actionError}</p> : null}
          <DialogFooter><Button type="button" variant="outline" onClick={() => setRevoking(null)} disabled={saving}>انصراف</Button><Button type="button" variant="destructive" onClick={() => void revokeSession()} disabled={saving}>{saving ? <><Loader2 className="animate-spin" />در حال بستن</> : "بستن نشست"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={logoutAllOpen} onOpenChange={(open) => { if (!open && !saving) setLogoutAllOpen(false) }}>
        <DialogContent dir="rtl" className="sm:max-w-md">
          <DialogHeader className="text-right sm:text-right"><DialogTitle>خروج از همه دستگاه‌ها</DialogTitle><DialogDescription>تمام نشست‌های فعال، از جمله دستگاه فعلی، باطل می‌شوند.</DialogDescription></DialogHeader>
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm leading-7 text-rose-900">این عملیات برای زمانی است که احتمال می‌دهید شخص دیگری به حساب دسترسی دارد. پس از انجام باید دوباره وارد شوید.</div>
          {actionError ? <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{actionError}</p> : null}
          <DialogFooter><Button type="button" variant="outline" onClick={() => setLogoutAllOpen(false)} disabled={saving}>انصراف</Button><Button type="button" variant="destructive" onClick={() => void logoutAll()} disabled={saving}>{saving ? <><Loader2 className="animate-spin" />در حال خروج</> : "خروج از همه دستگاه‌ها"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
