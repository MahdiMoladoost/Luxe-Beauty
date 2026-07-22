"use client"

import { FormEvent, useCallback, useEffect, useState } from "react"
import {
  AlertCircle,
  CalendarDays,
  Check,
  Fingerprint,
  Loader2,
  Phone,
  RefreshCw,
  Save,
  UserRound,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type Account = {
  id: string
  mobileNormalized: string
  status: string
  identityStatus: string
  locale: string
  createdAt: string
  updatedAt: string
  profile: {
    id: string
    firstName: string | null
    lastName: string | null
    birthDate: string | null
    createdAt: string
    updatedAt: string
  } | null
}

type ApiEnvelope<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } }

const identityLabels: Record<string, string> = {
  UNVERIFIED: "احراز هویت نشده",
  PENDING: "در انتظار بررسی",
  VERIFIED: "احراز هویت‌شده",
  REJECTED: "ردشده",
  UNAVAILABLE: "در دسترس نیست",
}

const accountLabels: Record<string, string> = {
  PENDING: "در انتظار فعال‌سازی",
  ACTIVE: "فعال",
  SUSPENDED: "تعلیق‌شده",
  DELETION_REQUESTED: "درخواست حذف",
  DELETED: "حذف‌شده",
}

async function apiRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: "same-origin",
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  })
  const payload = (await response.json()) as ApiEnvelope<T>
  if (!payload.ok) {
    const error = new Error(payload.error.message) as Error & { code?: string }
    error.code = payload.error.code
    throw error
  }
  return payload.data
}

export function AccountManager() {
  const [account, setAccount] = useState<Account | null>(null)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [birthDate, setBirthDate] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiRequest<{ account: Account }>("/api/v1/customer-panel/account")
      setAccount(data.account)
      setFirstName(data.account.profile?.firstName ?? "")
      setLastName(data.account.profile?.lastName ?? "")
      setBirthDate(data.account.profile?.birthDate ?? "")
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "دریافت اطلاعات حساب ناموفق بود.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!account) return
    if (firstName.trim().length < 2 || lastName.trim().length < 2) {
      setError("نام و نام خانوادگی باید حداقل دو کاراکتر باشند.")
      return
    }

    setSaving(true)
    setError(null)
    setNotice(null)
    try {
      await apiRequest("/api/v1/customer-panel/account", {
        method: "PATCH",
        body: JSON.stringify({
          expectedUpdatedAt: account.profile?.updatedAt ?? null,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          birthDate: birthDate || null,
        }),
      })
      setNotice("اطلاعات حساب با موفقیت ذخیره شد.")
      await load()
    } catch (saveError) {
      const typed = saveError as Error & { code?: string }
      setError(typed.message || "ذخیره اطلاعات حساب ناموفق بود.")
      if (typed.code === "VERSION_CONFLICT") await load()
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="grid gap-4 lg:grid-cols-[1fr_360px]"><div className="h-96 animate-pulse rounded-[28px] bg-stone-200/70" /><div className="h-72 animate-pulse rounded-[28px] bg-stone-200/70" /></div>
  }

  if (!account || error && !account) {
    return <div className="rounded-[26px] border border-rose-200 bg-rose-50 p-8 text-center"><AlertCircle className="mx-auto size-10 text-rose-500" /><p className="mt-4 font-bold text-rose-900">بارگیری حساب ناموفق بود</p><p className="mt-2 text-sm text-rose-700">{error}</p><Button type="button" variant="outline" className="mt-5" onClick={() => void load()}>تلاش دوباره</Button></div>
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <form onSubmit={submit} className="rounded-[28px] border border-[#5b4033]/10 bg-white p-5 shadow-[0_18px_55px_rgba(66,43,32,0.06)] sm:p-6">
        <div className="flex flex-col justify-between gap-3 border-b border-[#5b4033]/10 pb-5 sm:flex-row sm:items-center">
          <div><h2 className="text-xl font-black text-[#34231d]">اطلاعات شخصی</h2><p className="mt-1 text-sm text-[#806e64]">نام و تاریخ تولد ثبت‌شده در حساب</p></div>
          <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={saving}><RefreshCw className={cn("size-4", loading && "animate-spin")} />بازنشانی</Button>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <label className="block"><span className="mb-2 block text-sm font-semibold text-[#4b372e]">نام</span><div className="relative"><UserRound className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#9b887e]" /><Input value={firstName} onChange={(event) => setFirstName(event.target.value)} className="pr-10" minLength={2} maxLength={100} required /></div></label>
          <label className="block"><span className="mb-2 block text-sm font-semibold text-[#4b372e]">نام خانوادگی</span><Input value={lastName} onChange={(event) => setLastName(event.target.value)} minLength={2} maxLength={100} required /></label>
          <label className="block"><span className="mb-2 block text-sm font-semibold text-[#4b372e]">تاریخ تولد</span><div className="relative"><CalendarDays className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#9b887e]" /><Input type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} className="pr-10" /></div></label>
          <label className="block"><span className="mb-2 block text-sm font-semibold text-[#4b372e]">شماره موبایل</span><div className="relative"><Phone className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#9b887e]" /><Input dir="ltr" value={account.mobileNormalized} className="pr-10 text-right" disabled /></div><span className="mt-2 block text-xs text-[#8b796f]">تغییر موبایل به گردش تأیید OTP جداگانه نیاز دارد و از این فرم انجام نمی‌شود.</span></label>
        </div>

        {notice ? <div role="status" className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"><Check className="size-5" />{notice}</div> : null}
        {error ? <div role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</div> : null}

        <div className="mt-6 flex justify-end"><Button type="submit" disabled={saving} className="bg-[#3a251e] text-white hover:bg-[#4a3027]">{saving ? <><Loader2 className="animate-spin" />در حال ذخیره</> : <><Save className="size-4" />ذخیره تغییرات</>}</Button></div>
      </form>

      <aside className="space-y-4">
        <div className="rounded-[28px] border border-[#5b4033]/10 bg-white p-5 shadow-[0_18px_55px_rgba(66,43,32,0.05)]">
          <div className="flex items-center gap-3"><div className="flex size-11 items-center justify-center rounded-2xl bg-[#3a251e] text-[#e8c58d]"><Fingerprint className="size-5" /></div><div><p className="font-black text-[#3d2a22]">وضعیت هویت</p><p className="mt-1 text-xs text-[#806e64]">وضعیت ثبت‌شده در سامانه</p></div></div>
          <Badge variant="outline" className={cn("mt-5", account.identityStatus === "VERIFIED" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700")}>{identityLabels[account.identityStatus] ?? account.identityStatus}</Badge>
          <p className="mt-4 text-sm leading-7 text-[#746157]">ثبت نوبت جدید به احراز هویت تأییدشده نیاز دارد. این صفحه هیچ کد ملی یا داده حساس هویتی را نمایش نمی‌دهد.</p>
        </div>
        <div className="rounded-[28px] border border-[#5b4033]/10 bg-white p-5 shadow-[0_18px_55px_rgba(66,43,32,0.05)]"><p className="text-sm font-semibold text-[#6f5c52]">وضعیت حساب</p><p className="mt-2 text-lg font-black text-[#3d2a22]">{accountLabels[account.status] ?? account.status}</p><p className="mt-3 text-xs leading-6 text-[#8b796f]">عضویت از {new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(new Date(account.createdAt))}</p></div>
      </aside>
    </div>
  )
}
