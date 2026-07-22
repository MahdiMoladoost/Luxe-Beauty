"use client"

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  CalendarClock,
  CalendarOff,
  CheckCircle2,
  Clock3,
  Loader2,
  Plus,
  RefreshCw,
  Save,
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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type Branch = {
  id: string
  nameFa: string
  active: boolean
  location: { city: { id: string; nameFa: string } }
}
type Rule = {
  id?: string
  dayOfWeek: number
  startMinute: number
  endMinute: number
  timezone: string
  active: boolean
}
type Exception = {
  id: string
  kind: "CLOSED" | "AVAILABLE"
  startsAt: string
  endsAt: string
  reason: string | null
  createdAt: string
}
type Schedule = {
  updatedAt: string | null
  rules: Rule[]
  exceptions: Exception[]
}
type ApiEnvelope<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } }

type ExceptionForm = {
  kind: "CLOSED" | "AVAILABLE"
  startsAt: string
  endsAt: string
  reason: string
}

const days = [
  { value: 6, label: "شنبه" },
  { value: 0, label: "یکشنبه" },
  { value: 1, label: "دوشنبه" },
  { value: 2, label: "سه‌شنبه" },
  { value: 3, label: "چهارشنبه" },
  { value: 4, label: "پنجشنبه" },
  { value: 5, label: "جمعه" },
]

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

function minuteToTime(minute: number) {
  const hour = Math.floor(minute / 60)
  const rest = minute % 60
  return `${String(hour).padStart(2, "0")}:${String(rest).padStart(2, "0")}`
}

function timeToMinute(value: string) {
  const [hour, minute] = value.split(":").map(Number)
  return hour * 60 + minute
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("fa-IR", {
    timeZone: "Asia/Tehran",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function localInputToIso(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) throw new Error("تاریخ و ساعت معتبر نیست.")
  return date.toISOString()
}

export function ScheduleManager({ providerId }: { providerId: string }) {
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedBranchId, setSelectedBranchId] = useState("")
  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [exceptionOpen, setExceptionOpen] = useState(false)
  const [exceptionForm, setExceptionForm] = useState<ExceptionForm>({ kind: "CLOSED", startsAt: "", endsAt: "", reason: "" })
  const [deletingException, setDeletingException] = useState<Exception | null>(null)

  const loadBranches = useCallback(async () => {
    const rows = await apiRequest<Branch[]>(`/api/v1/providers/${providerId}/branches`)
    setBranches(rows)
    setSelectedBranchId((current) => current || rows[0]?.id || "")
  }, [providerId])

  const loadSchedule = useCallback(async (branchId: string) => {
    if (!branchId) {
      setSchedule(null)
      setRules([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await apiRequest<Schedule>(
        `/api/v1/availability/schedules?ownerType=BRANCH&ownerId=${branchId}`,
      )
      setSchedule(data)
      setRules(data.rules)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "بارگیری برنامه کاری ناموفق بود.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadBranches().catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : "بارگیری شعب ناموفق بود.")
      setLoading(false)
    })
  }, [loadBranches])

  useEffect(() => {
    if (selectedBranchId) void loadSchedule(selectedBranchId)
  }, [selectedBranchId, loadSchedule])

  const groupedRules = useMemo(
    () =>
      Object.fromEntries(
        days.map((day) => [
          day.value,
          rules
            .filter((rule) => rule.dayOfWeek === day.value)
            .sort((left, right) => left.startMinute - right.startMinute),
        ]),
      ) as Record<number, Rule[]>,
    [rules],
  )

  function addRule(dayOfWeek: number) {
    const existing = groupedRules[dayOfWeek] ?? []
    const last = existing.at(-1)
    const startMinute = last ? Math.min(last.endMinute + 30, 1320) : 540
    const endMinute = Math.min(startMinute + 480, 1440)
    if (startMinute >= endMinute) {
      setError("برای این روز فضای خالی دیگری وجود ندارد.")
      return
    }
    setRules((current) => [
      ...current,
      { dayOfWeek, startMinute, endMinute, timezone: "Asia/Tehran", active: true },
    ])
  }

  function updateRule(target: Rule, changes: Partial<Rule>) {
    setRules((current) => current.map((rule) => (rule === target ? { ...rule, ...changes } : rule)))
  }

  function removeRule(target: Rule) {
    setRules((current) => current.filter((rule) => rule !== target))
  }

  function validateRules() {
    for (const day of days) {
      const dayRules = (groupedRules[day.value] ?? [])
        .filter((rule) => rule.active)
        .sort((left, right) => left.startMinute - right.startMinute)
      for (let index = 0; index < dayRules.length; index += 1) {
        const rule = dayRules[index]
        if (rule.startMinute < 0 || rule.endMinute > 1440 || rule.startMinute >= rule.endMinute) {
          return `بازه ${day.label} معتبر نیست.`
        }
        if (index > 0 && rule.startMinute < dayRules[index - 1].endMinute) {
          return `بازه‌های ${day.label} با هم هم‌پوشانی دارند.`
        }
      }
    }
    return null
  }

  async function saveSchedule() {
    if (!selectedBranchId) return
    const validation = validateRules()
    if (validation) {
      setError(validation)
      return
    }
    setSaving(true)
    setError(null)
    try {
      await apiRequest<Schedule>("/api/v1/availability/schedules", {
        method: "PUT",
        body: JSON.stringify({
          ownerType: "BRANCH",
          ownerId: selectedBranchId,
          expectedUpdatedAt: schedule?.updatedAt ?? null,
          rules: rules.map((rule) => ({
            dayOfWeek: rule.dayOfWeek,
            startMinute: rule.startMinute,
            endMinute: rule.endMinute,
            timezone: "Asia/Tehran",
            active: rule.active,
          })),
        }),
      })
      setNotice("برنامه هفتگی با موفقیت ذخیره شد.")
      await loadSchedule(selectedBranchId)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "ذخیره برنامه کاری ناموفق بود.")
    } finally {
      setSaving(false)
    }
  }

  async function createException(event: FormEvent) {
    event.preventDefault()
    if (!selectedBranchId) return
    setSaving(true)
    setError(null)
    try {
      if (!exceptionForm.startsAt || !exceptionForm.endsAt) throw new Error("شروع و پایان استثنا الزامی است.")
      if (exceptionForm.reason.trim().length < 3) throw new Error("دلیل استثنا باید حداقل سه کاراکتر باشد.")
      await apiRequest<Exception>("/api/v1/availability/exceptions", {
        method: "POST",
        body: JSON.stringify({
          ownerType: "BRANCH",
          ownerId: selectedBranchId,
          kind: exceptionForm.kind,
          startsAt: localInputToIso(exceptionForm.startsAt),
          endsAt: localInputToIso(exceptionForm.endsAt),
          reason: exceptionForm.reason.trim(),
        }),
      })
      setExceptionOpen(false)
      setExceptionForm({ kind: "CLOSED", startsAt: "", endsAt: "", reason: "" })
      setNotice(exceptionForm.kind === "CLOSED" ? "تعطیلی موقت ثبت شد." : "زمان کاری اضافه ثبت شد.")
      await loadSchedule(selectedBranchId)
    } catch (exceptionError) {
      setError(exceptionError instanceof Error ? exceptionError.message : "ثبت استثنا ناموفق بود.")
    } finally {
      setSaving(false)
    }
  }

  async function removeException() {
    if (!deletingException || !selectedBranchId) return
    setSaving(true)
    setError(null)
    try {
      await apiRequest<{ deleted: boolean }>(
        `/api/v1/availability/exceptions/${deletingException.id}`,
        { method: "DELETE" },
      )
      setDeletingException(null)
      setNotice("استثنای برنامه زمانی حذف شد.")
      await loadSchedule(selectedBranchId)
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "حذف استثنا ناموفق بود.")
    } finally {
      setSaving(false)
    }
  }

  const selectedBranch = branches.find((branch) => branch.id === selectedBranchId) ?? null

  return (
    <div className="space-y-6">
      {notice ? (
        <div role="status" className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <span className="flex items-center gap-2"><CheckCircle2 className="size-5" />{notice}</span>
          <button type="button" onClick={() => setNotice(null)} className="font-black" aria-label="بستن پیام">×</button>
        </div>
      ) : null}

      <section className="rounded-[26px] border border-[#5b4033]/10 bg-white p-5 shadow-[0_15px_45px_rgba(66,43,32,0.055)]">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <h2 className="text-xl font-black text-[#34231d]">تقویم شعبه</h2>
            <p className="mt-1 text-sm leading-7 text-[#806e64]">تقویم متخصص مستقل است و توسط حساب خود متخصص مدیریت می‌شود؛ این صفحه ساعات کاری شعب مجموعه را کنترل می‌کند.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="min-w-64">
              <span className="mb-1 block text-xs text-[#806e64]">شعبه</span>
              <select value={selectedBranchId} onChange={(event) => setSelectedBranchId(event.target.value)} className="h-11 w-full rounded-md border border-input bg-transparent px-3 text-sm">
                <option value="">انتخاب شعبه</option>
                {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.nameFa} - {branch.location.city.nameFa}</option>)}
              </select>
            </label>
            <Button type="button" variant="outline" onClick={() => selectedBranchId && void loadSchedule(selectedBranchId)} disabled={loading || !selectedBranchId} className="self-end"><RefreshCw className={cn("size-4", loading && "animate-spin")} />تازه‌سازی</Button>
          </div>
        </div>
      </section>

      {error ? (
        <div role="alert" className="flex items-start justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><span className="flex items-start gap-2"><AlertCircle className="mt-0.5 size-5 shrink-0" />{error}</span><button type="button" onClick={() => setError(null)} className="font-black">×</button></div>
      ) : null}

      {!selectedBranchId ? (
        <div className="rounded-[28px] border border-dashed border-[#5b4033]/20 bg-white p-10 text-center"><CalendarClock className="mx-auto size-12 text-[#a98f80]" /><h3 className="mt-4 text-lg font-black text-[#463128]">ابتدا یک شعبه انتخاب کنید</h3><p className="mt-2 text-sm text-[#806e64]">اگر شعبه‌ای وجود ندارد، آن را از بخش مدیریت شعب ثبت کنید.</p></div>
      ) : loading ? (
        <div className="space-y-3">{Array.from({ length: 7 }).map((_, index) => <div key={index} className="h-24 animate-pulse rounded-2xl bg-stone-200/70" />)}</div>
      ) : (
        <>
          <section className="rounded-[28px] border border-[#5b4033]/10 bg-white p-5 shadow-[0_18px_55px_rgba(66,43,32,0.05)] sm:p-6">
            <div className="flex flex-col justify-between gap-3 border-b border-[#5b4033]/10 pb-5 sm:flex-row sm:items-center"><div><h2 className="text-xl font-black text-[#34231d]">برنامه هفتگی {selectedBranch?.nameFa}</h2><p className="mt-1 text-sm text-[#806e64]">برای هر روز می‌توانید چند بازه بدون هم‌پوشانی تعریف کنید.</p></div><Button type="button" onClick={() => void saveSchedule()} disabled={saving} className="bg-[#3a251e] text-white hover:bg-[#4a3027]">{saving ? <><Loader2 className="animate-spin" />در حال ذخیره</> : <><Save className="size-4" />ذخیره برنامه</>}</Button></div>
            <div className="mt-5 space-y-4">
              {days.map((day) => (
                <div key={day.value} className="rounded-2xl border border-[#5b4033]/10 bg-[#fcfaf7] p-4">
                  <div className="flex items-center justify-between gap-3"><div><h3 className="font-black text-[#49342b]">{day.label}</h3><p className="mt-1 text-xs text-[#8a776d]">{(groupedRules[day.value] ?? []).length ? `${(groupedRules[day.value] ?? []).length.toLocaleString("fa-IR")} بازه کاری` : "تعطیل"}</p></div><Button type="button" variant="outline" size="sm" onClick={() => addRule(day.value)}><Plus className="size-4" />افزودن بازه</Button></div>
                  <div className="mt-3 space-y-2">
                    {(groupedRules[day.value] ?? []).map((rule, index) => (
                      <div key={`${day.value}-${index}`} className="grid items-center gap-2 rounded-xl bg-white p-3 sm:grid-cols-[1fr_auto_1fr_auto_auto]">
                        <label><span className="sr-only">شروع بازه</span><Input type="time" value={minuteToTime(rule.startMinute)} onChange={(event) => updateRule(rule, { startMinute: timeToMinute(event.target.value) })} /></label>
                        <span className="hidden text-[#9b887e] sm:block">تا</span>
                        <label><span className="sr-only">پایان بازه</span><Input type="time" value={minuteToTime(rule.endMinute === 1440 ? 1439 : rule.endMinute)} onChange={(event) => updateRule(rule, { endMinute: timeToMinute(event.target.value) })} /></label>
                        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={rule.active} onChange={(event) => updateRule(rule, { active: event.target.checked })} className="size-4 accent-[#4a3027]" />فعال</label>
                        <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeRule(rule)} aria-label="حذف بازه" className="text-rose-700 hover:bg-rose-50"><Trash2 className="size-4" /></Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-[#5b4033]/10 bg-white p-5 shadow-[0_18px_55px_rgba(66,43,32,0.05)] sm:p-6">
            <div className="flex flex-col justify-between gap-3 border-b border-[#5b4033]/10 pb-5 sm:flex-row sm:items-center"><div><h2 className="text-xl font-black text-[#34231d]">تعطیلی‌ها و زمان‌های اضافه</h2><p className="mt-1 text-sm text-[#806e64]">استثناها روی برنامه هفتگی اولویت دارند.</p></div><Button type="button" variant="outline" onClick={() => { setExceptionForm({ kind: "CLOSED", startsAt: "", endsAt: "", reason: "" }); setExceptionOpen(true) }}><Plus className="size-4" />افزودن استثنا</Button></div>
            {schedule?.exceptions.length ? (
              <div className="mt-4 space-y-3">{schedule.exceptions.map((exception) => <article key={exception.id} className="flex flex-col justify-between gap-3 rounded-2xl border border-[#5b4033]/10 p-4 sm:flex-row sm:items-center"><div className="flex items-start gap-3"><div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", exception.kind === "CLOSED" ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700")}>{exception.kind === "CLOSED" ? <CalendarOff className="size-5" /> : <Clock3 className="size-5" />}</div><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-[#49342b]">{exception.kind === "CLOSED" ? "تعطیلی موقت" : "زمان کاری اضافه"}</h3><Badge variant="outline" className={exception.kind === "CLOSED" ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}>{exception.kind === "CLOSED" ? "بسته" : "باز"}</Badge></div><p className="mt-1 text-sm text-[#746157]">{formatDateTime(exception.startsAt)} تا {formatDateTime(exception.endsAt)}</p><p className="mt-1 text-xs text-[#8a776d]">{exception.reason}</p></div></div><Button type="button" variant="ghost" size="icon" onClick={() => setDeletingException(exception)} className="text-rose-700 hover:bg-rose-50" aria-label="حذف استثنا"><Trash2 className="size-4" /></Button></article>)}</div>
            ) : (
              <div className="py-10 text-center"><CalendarOff className="mx-auto size-9 text-[#b3a096]" /><p className="mt-3 text-sm font-bold text-[#594138]">استثنایی ثبت نشده است</p></div>
            )}
          </section>
        </>
      )}

      <Dialog open={exceptionOpen} onOpenChange={(open) => { if (!open && !saving) setExceptionOpen(false) }}>
        <DialogContent dir="rtl" className="sm:max-w-lg"><DialogHeader className="text-right sm:text-right"><DialogTitle>افزودن استثنای برنامه</DialogTitle><DialogDescription>تعطیلی موقت یا زمان کاری اضافه را با تاریخ و ساعت دقیق ثبت کنید.</DialogDescription></DialogHeader><form onSubmit={createException} className="space-y-4"><label className="block"><span className="mb-2 block text-sm font-semibold">نوع استثنا</span><select value={exceptionForm.kind} onChange={(event) => setExceptionForm((current) => ({ ...current, kind: event.target.value as ExceptionForm["kind"] }))} className="h-11 w-full rounded-md border border-input bg-transparent px-3 text-sm"><option value="CLOSED">تعطیلی موقت</option><option value="AVAILABLE">زمان کاری اضافه</option></select></label><div className="grid gap-4 sm:grid-cols-2"><label><span className="mb-2 block text-sm font-semibold">شروع</span><Input type="datetime-local" value={exceptionForm.startsAt} onChange={(event) => setExceptionForm((current) => ({ ...current, startsAt: event.target.value }))} /></label><label><span className="mb-2 block text-sm font-semibold">پایان</span><Input type="datetime-local" value={exceptionForm.endsAt} onChange={(event) => setExceptionForm((current) => ({ ...current, endsAt: event.target.value }))} /></label></div><label className="block"><span className="mb-2 block text-sm font-semibold">دلیل</span><Textarea value={exceptionForm.reason} onChange={(event) => setExceptionForm((current) => ({ ...current, reason: event.target.value }))} maxLength={500} rows={4} placeholder="مثلاً تعطیلی مناسبتی یا شیفت اضافه" /></label><DialogFooter><Button type="button" variant="outline" onClick={() => setExceptionOpen(false)} disabled={saving}>انصراف</Button><Button type="submit" disabled={saving} className="bg-[#3a251e] text-white hover:bg-[#4a3027]">{saving ? <><Loader2 className="animate-spin" />در حال ثبت</> : "ثبت استثنا"}</Button></DialogFooter></form></DialogContent>
      </Dialog>

      <Dialog open={Boolean(deletingException)} onOpenChange={(open) => { if (!open && !saving) setDeletingException(null) }}>
        <DialogContent dir="rtl" className="sm:max-w-md"><DialogHeader className="text-right sm:text-right"><DialogTitle>حذف استثنا</DialogTitle><DialogDescription>برنامه هفتگی پس از حذف دوباره اعمال می‌شود.</DialogDescription></DialogHeader><div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">این استثنای زمانی حذف شود؟</div><DialogFooter><Button type="button" variant="outline" onClick={() => setDeletingException(null)} disabled={saving}>انصراف</Button><Button type="button" variant="destructive" onClick={() => void removeException()} disabled={saving}>{saving ? <><Loader2 className="animate-spin" />در حال حذف</> : "حذف استثنا"}</Button></DialogFooter></DialogContent>
      </Dialog>
    </div>
  )
}
