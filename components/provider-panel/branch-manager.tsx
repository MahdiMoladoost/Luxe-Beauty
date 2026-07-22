"use client"

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  BadgeCheck,
  Building2,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
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
import { cn } from "@/lib/utils"

type Branch = {
  id: string
  providerId: string
  nameFa: string
  slug: string
  location: {
    city: { id: string; nameFa: string; slug: string }
    district: { id: string; nameFa: string; slug: string } | null
    neighborhood: { id: string; nameFa: string; slug: string } | null
    latitude: string | null
    longitude: string | null
  }
  addressVerified: boolean
  active: boolean
  createdAt: string
  updatedAt: string
}

type Geography = {
  provinces: Array<{
    id: string
    nameFa: string
    cities: Array<{
      id: string
      nameFa: string
      districts: Array<{ id: string; nameFa: string }>
      neighborhoods: Array<{ id: string; nameFa: string; districtId: string | null }>
    }>
  }>
}

type ApiEnvelope<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string }; correlationId?: string }

type BranchForm = {
  nameFa: string
  cityId: string
  districtId: string
  neighborhoodId: string
  latitude: string
  longitude: string
  active: boolean
}

const emptyForm: BranchForm = {
  nameFa: "",
  cityId: "",
  districtId: "",
  neighborhoodId: "",
  latitude: "",
  longitude: "",
  active: false,
}

async function apiRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: "same-origin",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  })
  const payload = (await response.json()) as ApiEnvelope<T>
  if (!payload.ok) {
    const error = new Error(payload.error.message) as Error & { code?: string }
    error.code = payload.error.code
    throw error
  }
  return payload.data
}

function locationLabel(branch: Branch) {
  return [
    branch.location.city.nameFa,
    branch.location.district?.nameFa,
    branch.location.neighborhood?.nameFa,
  ]
    .filter(Boolean)
    .join("، ")
}

export function BranchManager({ providerId }: { providerId: string }) {
  const [branches, setBranches] = useState<Branch[]>([])
  const [geography, setGeography] = useState<Geography | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)
  const [form, setForm] = useState<BranchForm>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingBranch, setDeletingBranch] = useState<Branch | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [branchRows, geographyData] = await Promise.all([
        apiRequest<Branch[]>(`/api/v1/providers/${providerId}/branches`),
        apiRequest<Geography>("/api/v1/provider-panel/geography"),
      ])
      setBranches(branchRows)
      setGeography(geographyData)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "بارگیری شعب ناموفق بود.")
    } finally {
      setLoading(false)
    }
  }, [providerId])

  useEffect(() => {
    void load()
  }, [load])

  const cities = useMemo(
    () => geography?.provinces.flatMap((province) => province.cities) ?? [],
    [geography],
  )
  const selectedCity = cities.find((city) => city.id === form.cityId) ?? null
  const districts = selectedCity?.districts ?? []
  const neighborhoods = (selectedCity?.neighborhoods ?? []).filter(
    (neighborhood) => !form.districtId || neighborhood.districtId === form.districtId,
  )

  function openCreate() {
    setEditingBranch(null)
    setForm(emptyForm)
    setFormError(null)
    setEditorOpen(true)
  }

  function openEdit(branch: Branch) {
    setEditingBranch(branch)
    setForm({
      nameFa: branch.nameFa,
      cityId: branch.location.city.id,
      districtId: branch.location.district?.id ?? "",
      neighborhoodId: branch.location.neighborhood?.id ?? "",
      latitude: branch.location.latitude ?? "",
      longitude: branch.location.longitude ?? "",
      active: branch.active,
    })
    setFormError(null)
    setEditorOpen(true)
  }

  function updateForm<Key extends keyof BranchForm>(key: Key, value: BranchForm[Key]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function validateForm() {
    if (form.nameFa.trim().length < 2) return "نام شعبه باید حداقل دو کاراکتر باشد."
    if (!form.cityId) return "انتخاب شهر الزامی است."
    if (Boolean(form.latitude) !== Boolean(form.longitude)) {
      return "عرض و طول جغرافیایی باید با هم وارد شوند."
    }
    const latitude = form.latitude ? Number(form.latitude) : null
    const longitude = form.longitude ? Number(form.longitude) : null
    if (latitude !== null && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) {
      return "عرض جغرافیایی معتبر نیست."
    }
    if (longitude !== null && (!Number.isFinite(longitude) || longitude < -180 || longitude > 180)) {
      return "طول جغرافیایی معتبر نیست."
    }
    return null
  }

  async function saveBranch(event: FormEvent) {
    event.preventDefault()
    const validation = validateForm()
    if (validation) {
      setFormError(validation)
      return
    }

    setSaving(true)
    setFormError(null)
    try {
      const basePayload = {
        nameFa: form.nameFa.trim(),
        cityId: form.cityId,
        districtId: form.districtId || null,
        neighborhoodId: form.neighborhoodId || null,
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
      }
      if (editingBranch) {
        await apiRequest<Branch>(
          `/api/v1/providers/${providerId}/branches/${editingBranch.id}`,
          {
            method: "PATCH",
            body: JSON.stringify({
              ...basePayload,
              active: form.active,
              expectedUpdatedAt: editingBranch.updatedAt,
            }),
          },
        )
        setNotice("اطلاعات شعبه با موفقیت به‌روزرسانی شد.")
      } else {
        await apiRequest<Branch>(`/api/v1/providers/${providerId}/branches`, {
          method: "POST",
          body: JSON.stringify(basePayload),
        })
        setNotice("شعبه جدید ثبت شد. برای فعال‌سازی، پرونده ارائه‌دهنده باید تأیید شده باشد.")
      }
      setEditorOpen(false)
      await load()
    } catch (saveError) {
      setFormError(saveError instanceof Error ? saveError.message : "ذخیره شعبه ناموفق بود.")
    } finally {
      setSaving(false)
    }
  }

  async function deleteBranch() {
    if (!deletingBranch) return
    setDeleting(true)
    setFormError(null)
    try {
      await apiRequest<{ deleted: boolean }>(
        `/api/v1/providers/${providerId}/branches/${deletingBranch.id}?expectedUpdatedAt=${encodeURIComponent(deletingBranch.updatedAt)}`,
        { method: "DELETE" },
      )
      setNotice("شعبه حذف شد و دیگر در عملیات جدید نمایش داده نمی‌شود.")
      setDeletingBranch(null)
      await load()
    } catch (deleteError) {
      setFormError(deleteError instanceof Error ? deleteError.message : "حذف شعبه ناموفق بود.")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-5">
      {notice ? (
        <div role="status" className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)} aria-label="بستن پیام" className="font-black">×</button>
        </div>
      ) : null}

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-black text-[#34231d]">شعب مجموعه</h2>
          <p className="mt-1 text-sm text-[#806e64]">مدیریت محل‌های ارائه خدمت و وضعیت فعالیت هر شعبه</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={cn("size-4", loading && "animate-spin")} /> تازه‌سازی
          </Button>
          <Button type="button" onClick={openCreate} className="bg-[#3a251e] text-white hover:bg-[#4a3027]">
            <Plus className="size-4" /> افزودن شعبه
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-48 animate-pulse rounded-[24px] bg-stone-200/70" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-[26px] border border-rose-200 bg-rose-50 p-8 text-center">
          <AlertCircle className="mx-auto size-10 text-rose-500" />
          <p className="mt-4 font-bold text-rose-900">بارگیری شعب ناموفق بود</p>
          <p className="mt-2 text-sm text-rose-700">{error}</p>
          <Button type="button" variant="outline" className="mt-5" onClick={() => void load()}>تلاش دوباره</Button>
        </div>
      ) : branches.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-[#5b4033]/20 bg-white p-10 text-center">
          <Building2 className="mx-auto size-12 text-[#a98f80]" />
          <h3 className="mt-4 text-lg font-black text-[#463128]">هنوز شعبه‌ای ثبت نشده است</h3>
          <p className="mt-2 text-sm text-[#806e64]">اولین محل ارائه خدمت را ثبت کنید.</p>
          <Button type="button" onClick={openCreate} className="mt-5 bg-[#3a251e] text-white hover:bg-[#4a3027]">
            <Plus className="size-4" /> ثبت اولین شعبه
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {branches.map((branch) => (
            <article key={branch.id} className="rounded-[24px] border border-[#5b4033]/10 bg-white p-5 shadow-[0_14px_42px_rgba(66,43,32,0.055)]">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#3a251e] text-[#e8c58d]">
                    <Building2 className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate font-black text-[#3d2a22]">{branch.nameFa}</h3>
                    <p className="mt-2 flex items-start gap-1 text-sm leading-6 text-[#79675d]">
                      <MapPin className="mt-1 size-4 shrink-0" /> {locationLabel(branch)}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className={branch.active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-stone-200 bg-stone-50 text-stone-600"}>
                  {branch.active ? "فعال" : "غیرفعال"}
                </Badge>
              </div>

              <div className="mt-5 flex flex-wrap gap-2 text-xs">
                <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-1", branch.addressVerified ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700")}>
                  <BadgeCheck className="size-3.5" /> {branch.addressVerified ? "نشانی تأییدشده" : "نشانی در انتظار تأیید"}
                </span>
                {branch.location.latitude && branch.location.longitude ? (
                  <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-sky-700">مختصات ثبت‌شده</span>
                ) : null}
              </div>

              <div className="mt-5 flex gap-2 border-t border-[#5b4033]/10 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => openEdit(branch)}>
                  <Pencil className="size-4" /> ویرایش
                </Button>
                <Button type="button" variant="ghost" size="icon" onClick={() => setDeletingBranch(branch)} aria-label={`حذف ${branch.nameFa}`} className="text-rose-700 hover:bg-rose-50 hover:text-rose-800">
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog open={editorOpen} onOpenChange={(open) => { if (!open && !saving) setEditorOpen(false) }}>
        <DialogContent dir="rtl" className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader className="text-right sm:text-right">
            <DialogTitle>{editingBranch ? "ویرایش شعبه" : "افزودن شعبه جدید"}</DialogTitle>
            <DialogDescription>اطلاعات موقعیت را دقیق وارد کنید. تأیید نشانی فقط توسط فرایند سیستمی انجام می‌شود.</DialogDescription>
          </DialogHeader>
          <form onSubmit={saveBranch} className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold">نام شعبه</span>
              <Input value={form.nameFa} onChange={(event) => updateForm("nameFa", event.target.value)} maxLength={180} placeholder="مثلاً شعبه سعادت‌آباد" />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">شهر</span>
                <select
                  value={form.cityId}
                  onChange={(event) => setForm((current) => ({ ...current, cityId: event.target.value, districtId: "", neighborhoodId: "" }))}
                  className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  <option value="">انتخاب شهر</option>
                  {geography?.provinces.map((province) => (
                    <optgroup key={province.id} label={province.nameFa}>
                      {province.cities.map((city) => <option key={city.id} value={city.id}>{city.nameFa}</option>)}
                    </optgroup>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">منطقه</span>
                <select
                  value={form.districtId}
                  onChange={(event) => setForm((current) => ({ ...current, districtId: event.target.value, neighborhoodId: "" }))}
                  disabled={!selectedCity}
                  className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm disabled:opacity-50"
                >
                  <option value="">بدون منطقه</option>
                  {districts.map((district) => <option key={district.id} value={district.id}>{district.nameFa}</option>)}
                </select>
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm font-semibold">محله</span>
                <select
                  value={form.neighborhoodId}
                  onChange={(event) => updateForm("neighborhoodId", event.target.value)}
                  disabled={!selectedCity}
                  className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm disabled:opacity-50"
                >
                  <option value="">بدون محله</option>
                  {neighborhoods.map((neighborhood) => <option key={neighborhood.id} value={neighborhood.id}>{neighborhood.nameFa}</option>)}
                </select>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">عرض جغرافیایی اختیاری</span>
                <Input inputMode="decimal" value={form.latitude} onChange={(event) => updateForm("latitude", event.target.value)} placeholder="35.7219" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">طول جغرافیایی اختیاری</span>
                <Input inputMode="decimal" value={form.longitude} onChange={(event) => updateForm("longitude", event.target.value)} placeholder="51.3347" />
              </label>
            </div>

            {editingBranch ? (
              <label className="flex items-center justify-between gap-4 rounded-2xl border border-[#5b4033]/10 bg-stone-50 p-4">
                <span><strong className="block text-sm">فعال‌بودن شعبه</strong><small className="mt-1 block text-[#806e64]">فعال‌سازی فقط برای ارائه‌دهنده تأییدشده ممکن است.</small></span>
                <input type="checkbox" checked={form.active} onChange={(event) => updateForm("active", event.target.checked)} className="size-5 accent-[#4a3027]" />
              </label>
            ) : null}

            {formError ? <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{formError}</div> : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditorOpen(false)} disabled={saving}>انصراف</Button>
              <Button type="submit" disabled={saving} className="bg-[#3a251e] text-white hover:bg-[#4a3027]">
                {saving ? <><Loader2 className="animate-spin" />در حال ذخیره</> : editingBranch ? "ذخیره تغییرات" : "ثبت شعبه"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deletingBranch)} onOpenChange={(open) => { if (!open && !deleting) setDeletingBranch(null) }}>
        <DialogContent dir="rtl" className="sm:max-w-md">
          <DialogHeader className="text-right sm:text-right">
            <DialogTitle>حذف شعبه</DialogTitle>
            <DialogDescription>این عملیات حذف نرم است و سوابق قبلی نوبت‌ها باقی می‌مانند.</DialogDescription>
          </DialogHeader>
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm leading-7 text-rose-900">
            شعبه «{deletingBranch?.nameFa}» از فهرست عملیاتی حذف شود؟
          </div>
          {formError ? <p className="text-sm text-rose-700">{formError}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeletingBranch(null)} disabled={deleting}>انصراف</Button>
            <Button type="button" variant="destructive" onClick={() => void deleteBranch()} disabled={deleting}>
              {deleting ? <><Loader2 className="animate-spin" />در حال حذف</> : "حذف شعبه"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
