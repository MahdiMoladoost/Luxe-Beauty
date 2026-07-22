"use client"

import { FormEvent, useCallback, useEffect, useState } from "react"
import {
  Accessibility,
  AlertCircle,
  CalendarDays,
  Check,
  Loader2,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Trash2,
  UserRound,
  UsersRound,
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

type Recipient = {
  id: string
  firstName: string
  lastName: string
  birthDate: string | null
  genderCode: string | null
  relationLabel: string | null
  contactMobile: string | null
  accessibilityNeeds: string | null
  createdAt: string
  updatedAt: string
}

type ApiEnvelope<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } }

type RecipientForm = {
  firstName: string
  lastName: string
  birthDate: string
  genderCode: string
  relationLabel: string
  contactMobile: string
  accessibilityNeeds: string
}

const emptyForm: RecipientForm = {
  firstName: "",
  lastName: "",
  birthDate: "",
  genderCode: "UNKNOWN",
  relationLabel: "",
  contactMobile: "",
  accessibilityNeeds: "",
}

const genderLabels: Record<string, string> = {
  FEMALE: "خانم",
  MALE: "آقا",
  OTHER: "سایر",
  UNKNOWN: "ثبت نشده",
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fa-IR", {
    timeZone: "UTC",
    dateStyle: "medium",
  }).format(new Date(`${value}T00:00:00.000Z`))
}

function formFromRecipient(recipient: Recipient): RecipientForm {
  return {
    firstName: recipient.firstName,
    lastName: recipient.lastName,
    birthDate: recipient.birthDate ?? "",
    genderCode: recipient.genderCode ?? "UNKNOWN",
    relationLabel: recipient.relationLabel ?? "",
    contactMobile: recipient.contactMobile ?? "",
    accessibilityNeeds: recipient.accessibilityNeeds ?? "",
  }
}

export function RecipientManager() {
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [editing, setEditing] = useState<Recipient | "new" | null>(null)
  const [deleting, setDeleting] = useState<Recipient | null>(null)
  const [form, setForm] = useState<RecipientForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setRecipients(await apiRequest<Recipient[]>("/api/v1/booking-recipients"))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "بارگیری دریافت‌کنندگان ناموفق بود.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  function openCreate() {
    setEditing("new")
    setForm(emptyForm)
    setActionError(null)
  }

  function openEdit(recipient: Recipient) {
    setEditing(recipient)
    setForm(formFromRecipient(recipient))
    setActionError(null)
  }

  function updateField<Key extends keyof RecipientForm>(key: Key, value: RecipientForm[Key]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!editing) return
    if (form.firstName.trim().length < 2 || form.lastName.trim().length < 2) {
      setActionError("نام و نام خانوادگی باید حداقل دو کاراکتر باشند.")
      return
    }

    setSaving(true)
    setActionError(null)
    try {
      const body = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        birthDate: form.birthDate || null,
        genderCode: form.genderCode || null,
        relationLabel: form.relationLabel.trim() || null,
        contactMobile: form.contactMobile.trim() || null,
        accessibilityNeeds: form.accessibilityNeeds.trim() || null,
        ...(editing === "new" ? {} : { expectedUpdatedAt: editing.updatedAt }),
      }
      if (editing === "new") {
        await apiRequest<Recipient>("/api/v1/booking-recipients", {
          method: "POST",
          body: JSON.stringify(body),
        })
        setNotice("دریافت‌کننده جدید با موفقیت ثبت شد.")
      } else {
        await apiRequest<Recipient>(`/api/v1/booking-recipients/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        })
        setNotice("اطلاعات دریافت‌کننده به‌روزرسانی شد.")
      }
      setEditing(null)
      setForm(emptyForm)
      await load()
    } catch (saveError) {
      const typed = saveError as Error & { code?: string }
      setActionError(typed.message || "ذخیره اطلاعات ناموفق بود.")
      if (typed.code === "VERSION_CONFLICT") await load()
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (!deleting) return
    setSaving(true)
    setActionError(null)
    try {
      await apiRequest<{ kind: "DELETED" }>(
        `/api/v1/booking-recipients/${deleting.id}?expectedUpdatedAt=${encodeURIComponent(deleting.updatedAt)}`,
        { method: "DELETE" },
      )
      setDeleting(null)
      setNotice("دریافت‌کننده از فهرست فعال حذف شد.")
      await load()
    } catch (deleteError) {
      const typed = deleteError as Error & { code?: string }
      setActionError(typed.message || "حذف دریافت‌کننده ناموفق بود.")
      if (typed.code === "VERSION_CONFLICT") await load()
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

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-black text-[#34231d]">فهرست دریافت‌کنندگان</h2>
          <p className="mt-1 text-sm text-[#806e64]">برای خودتان یا افراد دیگر اطلاعات رزرو را نگه‌داری کنید.</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className={cn("size-4", loading && "animate-spin")} />تازه‌سازی</Button>
          <Button type="button" onClick={openCreate} className="bg-[#3a251e] text-white hover:bg-[#4a3027]"><Plus className="size-4" />افزودن دریافت‌کننده</Button>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-60 animate-pulse rounded-[24px] bg-stone-200/70" />)}</div>
      ) : error ? (
        <div className="rounded-[26px] border border-rose-200 bg-rose-50 p-8 text-center"><AlertCircle className="mx-auto size-10 text-rose-500" /><p className="mt-4 font-bold text-rose-900">بارگیری اطلاعات ناموفق بود</p><p className="mt-2 text-sm text-rose-700">{error}</p><Button type="button" variant="outline" className="mt-5" onClick={() => void load()}>تلاش دوباره</Button></div>
      ) : recipients.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-[#5b4033]/20 bg-white p-10 text-center"><UsersRound className="mx-auto size-12 text-[#a98f80]" /><h3 className="mt-4 text-lg font-black text-[#463128]">دریافت‌کننده‌ای ثبت نشده است</h3><p className="mt-2 text-sm text-[#806e64]">برای شروع رزرو، اطلاعات فرد دریافت‌کننده خدمت را ثبت کنید.</p><Button type="button" className="mt-5 bg-[#3a251e] text-white hover:bg-[#4a3027]" onClick={openCreate}><Plus className="size-4" />ثبت اولین دریافت‌کننده</Button></div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {recipients.map((recipient) => (
            <article key={recipient.id} className="flex flex-col rounded-[24px] border border-[#5b4033]/10 bg-white p-5 shadow-[0_14px_42px_rgba(66,43,32,0.055)]">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#3a251e] text-[#e8c58d]"><UserRound className="size-5" /></div>
                  <div className="min-w-0"><h3 className="truncate font-black text-[#3d2a22]">{recipient.firstName} {recipient.lastName}</h3><p className="mt-1 text-xs text-[#806e64]">{recipient.relationLabel || "نسبت ثبت نشده"}</p></div>
                </div>
                <Badge variant="outline" className="border-[#cdb9a9] bg-[#faf6f1] text-[#6e5548]">{genderLabels[recipient.genderCode ?? "UNKNOWN"] ?? recipient.genderCode}</Badge>
              </div>
              <div className="mt-5 space-y-2 text-sm text-[#746157]">
                <p className="flex items-center gap-2"><CalendarDays className="size-4 text-[#9b7b66]" />{recipient.birthDate ? formatDate(recipient.birthDate) : "تاریخ تولد ثبت نشده"}</p>
                <p className="flex items-center gap-2"><Phone className="size-4 text-[#9b7b66]" /><span dir="ltr">{recipient.contactMobile || "شماره تماس ثبت نشده"}</span></p>
                <p className="flex items-start gap-2"><Accessibility className="mt-0.5 size-4 shrink-0 text-[#9b7b66]" /><span className="line-clamp-2">{recipient.accessibilityNeeds || "نیاز دسترس‌پذیری ثبت نشده"}</span></p>
              </div>
              <div className="mt-auto flex gap-2 border-t border-[#5b4033]/10 pt-4">
                <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => openEdit(recipient)}><Pencil className="size-4" />ویرایش</Button>
                <Button type="button" variant="outline" size="sm" className="text-rose-700" onClick={() => { setDeleting(recipient); setActionError(null) }}><Trash2 className="size-4" />حذف</Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog open={Boolean(editing)} onOpenChange={(open) => { if (!open && !saving) setEditing(null) }}>
        <DialogContent dir="rtl" className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader className="text-right sm:text-right"><DialogTitle>{editing === "new" ? "افزودن دریافت‌کننده" : "ویرایش دریافت‌کننده"}</DialogTitle><DialogDescription>اطلاعات دقیق فردی که خدمت را دریافت می‌کند ثبت کنید.</DialogDescription></DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block"><span className="mb-2 block text-sm font-semibold">نام</span><Input value={form.firstName} onChange={(event) => updateField("firstName", event.target.value)} minLength={2} maxLength={100} required /></label>
              <label className="block"><span className="mb-2 block text-sm font-semibold">نام خانوادگی</span><Input value={form.lastName} onChange={(event) => updateField("lastName", event.target.value)} minLength={2} maxLength={100} required /></label>
              <label className="block"><span className="mb-2 block text-sm font-semibold">تاریخ تولد</span><Input type="date" value={form.birthDate} onChange={(event) => updateField("birthDate", event.target.value)} /></label>
              <label className="block"><span className="mb-2 block text-sm font-semibold">جنسیت</span><select value={form.genderCode} onChange={(event) => updateField("genderCode", event.target.value)} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"><option value="UNKNOWN">ثبت نشده</option><option value="FEMALE">خانم</option><option value="MALE">آقا</option><option value="OTHER">سایر</option></select></label>
              <label className="block"><span className="mb-2 block text-sm font-semibold">نسبت با شما</span><Input value={form.relationLabel} onChange={(event) => updateField("relationLabel", event.target.value)} placeholder="مثلاً خودم، مادر، فرزند" maxLength={60} /></label>
              <label className="block"><span className="mb-2 block text-sm font-semibold">شماره تماس اختیاری</span><Input dir="ltr" value={form.contactMobile} onChange={(event) => updateField("contactMobile", event.target.value)} placeholder="09123456789" maxLength={20} /></label>
            </div>
            <label className="block"><span className="mb-2 block text-sm font-semibold">نیازهای دسترس‌پذیری یا توضیحات مهم</span><Textarea value={form.accessibilityNeeds} onChange={(event) => updateField("accessibilityNeeds", event.target.value)} rows={4} maxLength={1000} placeholder="اطلاعاتی که برای ارائه بهتر خدمت لازم است..." /></label>
            {actionError ? <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{actionError}</p> : null}
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditing(null)} disabled={saving}>انصراف</Button><Button type="submit" disabled={saving} className="bg-[#3a251e] text-white hover:bg-[#4a3027]">{saving ? <><Loader2 className="animate-spin" />در حال ذخیره</> : "ذخیره اطلاعات"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleting)} onOpenChange={(open) => { if (!open && !saving) setDeleting(null) }}>
        <DialogContent dir="rtl" className="sm:max-w-md">
          <DialogHeader className="text-right sm:text-right"><DialogTitle>حذف دریافت‌کننده</DialogTitle><DialogDescription>این فرد از فهرست فعال شما حذف می‌شود.</DialogDescription></DialogHeader>
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm leading-7 text-rose-900">آیا از حذف «{deleting?.firstName} {deleting?.lastName}» مطمئن هستید؟ سوابق نوبت قبلی حذف نمی‌شوند.</div>
          {actionError ? <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{actionError}</p> : null}
          <DialogFooter><Button type="button" variant="outline" onClick={() => setDeleting(null)} disabled={saving}>انصراف</Button><Button type="button" variant="destructive" onClick={() => void confirmDelete()} disabled={saving}>{saving ? <><Loader2 className="animate-spin" />در حال حذف</> : "حذف از فهرست"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
