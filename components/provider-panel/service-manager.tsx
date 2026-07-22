"use client"

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  EyeOff,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Scissors,
  Search,
  Send,
  Trash2,
  UserRound,
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

type CatalogCategory = {
  id: string
  nameFa: string
  services: Array<{ id: string; titleFa: string; description: string | null }>
}

type Branch = {
  id: string
  nameFa: string
  active: boolean
  location: { city: { id: string; nameFa: string } }
}

type Affiliation = {
  id: string
  status: string
  professional: { id: string; displayNameFa: string; verified: boolean; active: boolean }
  organization: { id: string; nameFa: string }
  branch: { id: string; nameFa: string; active: boolean } | null
}

type Offering = {
  id: string
  providerId: string
  branchId: string | null
  professionalId: string | null
  standardServiceId: string
  titleFa: string
  priceModel: "FIXED" | "STARTING_FROM" | "RANGE" | "AFTER_CONSULTATION"
  priceMinToman: string | null
  priceMaxToman: string | null
  duration: {
    baseMinute: number
    preparationMinute: number
    cleanupMinute: number
    bufferBeforeMinute: number
    bufferAfterMinute: number
  }
  audienceRules: Record<string, unknown>
  bookingPolicy: Record<string, unknown>
  pricingRules: Record<string, unknown> | null
  active: boolean
  published: boolean
  version: number
  updatedAt: string
  branch: { id: string; nameFa: string; active: boolean } | null
  professional: { id: string; displayNameFa: string; verified: boolean; active: boolean } | null
  standardService: {
    id: string
    titleFa: string
    category: { id: string; nameFa: string }
  }
}

type ApiEnvelope<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } }

type OfferingForm = {
  standardServiceId: string
  titleFa: string
  branchId: string
  professionalId: string
  priceModel: Offering["priceModel"]
  priceMinToman: string
  priceMaxToman: string
  baseDurationMinute: string
  preparationMinute: string
  cleanupMinute: string
  bufferBeforeMinute: string
  bufferAfterMinute: string
  audience: "ALL" | "WOMEN" | "MEN" | "CHILDREN"
  approval: "INSTANT" | "MANUAL"
  approvalDeadlineMinute: string
  active: boolean
  published: boolean
}

const emptyForm: OfferingForm = {
  standardServiceId: "",
  titleFa: "",
  branchId: "",
  professionalId: "",
  priceModel: "FIXED",
  priceMinToman: "",
  priceMaxToman: "",
  baseDurationMinute: "60",
  preparationMinute: "0",
  cleanupMinute: "0",
  bufferBeforeMinute: "0",
  bufferAfterMinute: "0",
  audience: "ALL",
  approval: "MANUAL",
  approvalDeadlineMinute: "30",
  active: false,
  published: false,
}

const priceModelLabels: Record<Offering["priceModel"], string> = {
  FIXED: "قیمت قطعی",
  STARTING_FROM: "شروع از",
  RANGE: "بازه قیمت",
  AFTER_CONSULTATION: "پس از مشاوره",
}

const audienceLabels: Record<OfferingForm["audience"], string> = {
  ALL: "همه",
  WOMEN: "بانوان",
  MEN: "آقایان",
  CHILDREN: "کودکان",
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
  if (!payload.ok) throw new Error(payload.error.message)
  return payload.data
}

function formatToman(value: string | null) {
  if (!value) return "—"
  try {
    return `${new Intl.NumberFormat("fa-IR").format(BigInt(value))} تومان`
  } catch {
    return `${value} تومان`
  }
}

function priceLabel(offering: Offering) {
  if (offering.priceModel === "AFTER_CONSULTATION") return "قیمت پس از مشاوره"
  if (offering.priceModel === "RANGE") {
    return `${formatToman(offering.priceMinToman)} تا ${formatToman(offering.priceMaxToman)}`
  }
  if (offering.priceModel === "STARTING_FROM") return `از ${formatToman(offering.priceMinToman)}`
  return formatToman(offering.priceMinToman)
}

function numeric(value: string) {
  return Number.parseInt(value || "0", 10)
}

export function ServiceManager({ providerId }: { providerId: string }) {
  const [offerings, setOfferings] = useState<Offering[]>([])
  const [catalog, setCatalog] = useState<CatalogCategory[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [affiliations, setAffiliations] = useState<Affiliation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<Offering | null>(null)
  const [form, setForm] = useState<OfferingForm>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<Offering | null>(null)
  const [actionId, setActionId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [offeringRows, catalogRows, branchRows, affiliationRows] = await Promise.all([
        apiRequest<Offering[]>(`/api/v1/providers/${providerId}/offerings`),
        apiRequest<CatalogCategory[]>("/api/v1/catalog/categories"),
        apiRequest<Branch[]>(`/api/v1/providers/${providerId}/branches`),
        apiRequest<Affiliation[]>("/api/v1/professional-affiliations"),
      ])
      setOfferings(offeringRows)
      setCatalog(catalogRows)
      setBranches(branchRows)
      setAffiliations(
        affiliationRows.filter(
          (item) =>
            item.organization.id === providerId &&
            item.status === "ACTIVE" &&
            item.professional.active &&
            item.professional.verified,
        ),
      )
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "بارگیری خدمات ناموفق بود.")
    } finally {
      setLoading(false)
    }
  }, [providerId])

  useEffect(() => {
    void load()
  }, [load])

  const activeBranches = branches.filter((branch) => branch.active)
  const filteredOfferings = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase("fa")
    if (!normalized) return offerings
    return offerings.filter((offering) =>
      [
        offering.titleFa,
        offering.standardService.titleFa,
        offering.standardService.category.nameFa,
        offering.branch?.nameFa ?? "",
        offering.professional?.displayNameFa ?? "",
      ].some((value) => value.toLocaleLowerCase("fa").includes(normalized)),
    )
  }, [offerings, search])

  function updateForm<Key extends keyof OfferingForm>(key: Key, value: OfferingForm[Key]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setFormError(null)
    setEditorOpen(true)
  }

  function openEdit(offering: Offering) {
    const policy = offering.bookingPolicy as { approval?: string; approvalDeadlineMinute?: number }
    const audience = offering.audienceRules as { audience?: OfferingForm["audience"] }
    setEditing(offering)
    setForm({
      standardServiceId: offering.standardServiceId,
      titleFa: offering.titleFa,
      branchId: offering.branchId ?? "",
      professionalId: offering.professionalId ?? "",
      priceModel: offering.priceModel,
      priceMinToman: offering.priceMinToman ?? "",
      priceMaxToman: offering.priceMaxToman ?? "",
      baseDurationMinute: String(offering.duration.baseMinute),
      preparationMinute: String(offering.duration.preparationMinute),
      cleanupMinute: String(offering.duration.cleanupMinute),
      bufferBeforeMinute: String(offering.duration.bufferBeforeMinute),
      bufferAfterMinute: String(offering.duration.bufferAfterMinute),
      audience: audience.audience ?? "ALL",
      approval: policy.approval === "INSTANT" ? "INSTANT" : "MANUAL",
      approvalDeadlineMinute: String(policy.approvalDeadlineMinute ?? 30),
      active: offering.active,
      published: offering.published,
    })
    setFormError(null)
    setEditorOpen(true)
  }

  function validate() {
    if (!editing && !form.standardServiceId) return "انتخاب خدمت استاندارد الزامی است."
    if (form.titleFa.trim().length < 2) return "عنوان خدمت باید حداقل دو کاراکتر باشد."
    const duration = numeric(form.baseDurationMinute)
    if (!Number.isInteger(duration) || duration < 5 || duration > 720) return "مدت خدمت باید بین ۵ تا ۷۲۰ دقیقه باشد."
    for (const [label, value] of [
      ["زمان آماده‌سازی", form.preparationMinute],
      ["زمان جمع‌بندی", form.cleanupMinute],
      ["فاصله قبل", form.bufferBeforeMinute],
      ["فاصله بعد", form.bufferAfterMinute],
    ] as const) {
      const parsed = numeric(value)
      if (!Number.isInteger(parsed) || parsed < 0 || parsed > 180) return `${label} باید بین صفر تا ۱۸۰ دقیقه باشد.`
    }
    if (form.priceModel !== "AFTER_CONSULTATION" && !/^\d+$/.test(form.priceMinToman)) {
      return "قیمت پایه باید به‌صورت عدد صحیح تومان وارد شود."
    }
    if (form.priceModel === "RANGE") {
      if (!/^\d+$/.test(form.priceMaxToman)) return "حداکثر قیمت باید وارد شود."
      if (BigInt(form.priceMaxToman) < BigInt(form.priceMinToman)) return "حداکثر قیمت نباید کمتر از حداقل باشد."
    }
    if (form.approval === "MANUAL") {
      const deadline = numeric(form.approvalDeadlineMinute)
      if (!Number.isInteger(deadline) || deadline < 15 || deadline > 120) return "مهلت تأیید دستی باید بین ۱۵ تا ۱۲۰ دقیقه باشد."
    }
    if (form.published && !form.active) return "برای انتشار، خدمت باید فعال باشد."
    return null
  }

  function payload(includeImmutable: boolean) {
    const base = {
      titleFa: form.titleFa.trim(),
      priceModel: form.priceModel,
      priceMinToman: form.priceModel === "AFTER_CONSULTATION" ? null : form.priceMinToman,
      priceMaxToman: form.priceModel === "RANGE" ? form.priceMaxToman : null,
      baseDurationMinute: numeric(form.baseDurationMinute),
      preparationMinute: numeric(form.preparationMinute),
      cleanupMinute: numeric(form.cleanupMinute),
      bufferBeforeMinute: numeric(form.bufferBeforeMinute),
      bufferAfterMinute: numeric(form.bufferAfterMinute),
      audienceRules: { audience: form.audience },
      bookingPolicy: {
        approval: form.approval,
        ...(form.approval === "MANUAL"
          ? { approvalDeadlineMinute: numeric(form.approvalDeadlineMinute) }
          : {}),
        payment: "NONE",
      },
      pricingRules: null,
      active: form.active,
      published: form.published,
    }
    return includeImmutable
      ? {
          ...base,
          branchId: form.branchId || null,
          professionalId: form.professionalId || null,
          standardServiceId: form.standardServiceId,
        }
      : base
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    const validation = validate()
    if (validation) {
      setFormError(validation)
      return
    }
    setSaving(true)
    setFormError(null)
    try {
      if (editing) {
        await apiRequest<Offering>(`/api/v1/providers/${providerId}/offerings/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify({ expectedVersion: editing.version, ...payload(false) }),
        })
        setNotice("خدمت با موفقیت به‌روزرسانی شد.")
      } else {
        await apiRequest<Offering>(`/api/v1/providers/${providerId}/offerings`, {
          method: "POST",
          body: JSON.stringify(payload(true)),
        })
        setNotice("خدمت جدید ثبت شد.")
      }
      setEditorOpen(false)
      await load()
    } catch (saveError) {
      setFormError(saveError instanceof Error ? saveError.message : "ذخیره خدمت ناموفق بود.")
    } finally {
      setSaving(false)
    }
  }

  async function togglePublication(offering: Offering) {
    setActionId(offering.id)
    setNotice(null)
    try {
      const nextPublished = !offering.published
      await apiRequest<Offering>(`/api/v1/providers/${providerId}/offerings/${offering.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          expectedVersion: offering.version,
          active: nextPublished ? true : offering.active,
          published: nextPublished,
        }),
      })
      setNotice(nextPublished ? "خدمت فعال و منتشر شد." : "انتشار خدمت متوقف شد.")
      await load()
    } catch (toggleError) {
      setNotice(null)
      setError(toggleError instanceof Error ? toggleError.message : "تغییر وضعیت انتشار ناموفق بود.")
    } finally {
      setActionId(null)
    }
  }

  async function remove() {
    if (!deleting) return
    setActionId(deleting.id)
    setFormError(null)
    try {
      await apiRequest<{ deleted: boolean }>(
        `/api/v1/providers/${providerId}/offerings/${deleting.id}?expectedVersion=${deleting.version}`,
        { method: "DELETE" },
      )
      setDeleting(null)
      setNotice("خدمت حذف شد و سوابق قبلی آن محفوظ ماند.")
      await load()
    } catch (deleteError) {
      setFormError(deleteError instanceof Error ? deleteError.message : "حذف خدمت ناموفق بود.")
    } finally {
      setActionId(null)
    }
  }

  return (
    <div className="space-y-5">
      {notice ? (
        <div role="status" className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <span className="flex items-center gap-2"><CheckCircle2 className="size-5" />{notice}</span>
          <button type="button" onClick={() => setNotice(null)} aria-label="بستن پیام" className="font-black">×</button>
        </div>
      ) : null}

      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
        <div>
          <h2 className="text-xl font-black text-[#34231d]">خدمات مجموعه</h2>
          <p className="mt-1 text-sm text-[#806e64]">قیمت، مدت، مخاطب، روش تأیید و انتشار هر خدمت</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="relative block min-w-64">
            <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#9b887e]" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="جست‌وجوی خدمت، شعبه یا متخصص" className="h-10 pr-10" />
          </label>
          <Button type="button" variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className={cn("size-4", loading && "animate-spin")} />تازه‌سازی</Button>
          <Button type="button" onClick={openCreate} className="bg-[#3a251e] text-white hover:bg-[#4a3027]"><Plus className="size-4" />افزودن خدمت</Button>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-64 animate-pulse rounded-[24px] bg-stone-200/70" />)}</div>
      ) : error ? (
        <div className="rounded-[26px] border border-rose-200 bg-rose-50 p-8 text-center"><AlertCircle className="mx-auto size-10 text-rose-500" /><p className="mt-4 font-bold text-rose-900">عملیات خدمات با خطا روبه‌رو شد</p><p className="mt-2 text-sm text-rose-700">{error}</p><Button type="button" variant="outline" className="mt-5" onClick={() => { setError(null); void load() }}>تلاش دوباره</Button></div>
      ) : filteredOfferings.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-[#5b4033]/20 bg-white p-10 text-center"><Scissors className="mx-auto size-12 text-[#a98f80]" /><h3 className="mt-4 text-lg font-black text-[#463128]">{search ? "خدمتی مطابق جست‌وجو پیدا نشد" : "هنوز خدمتی ثبت نشده است"}</h3><p className="mt-2 text-sm text-[#806e64]">{search ? "عبارت جست‌وجو را تغییر دهید." : "اولین خدمت قابل رزرو را تعریف کنید."}</p>{!search ? <Button type="button" onClick={openCreate} className="mt-5 bg-[#3a251e] text-white hover:bg-[#4a3027]"><Plus className="size-4" />ثبت اولین خدمت</Button> : null}</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredOfferings.map((offering) => (
            <article key={offering.id} className="flex flex-col rounded-[24px] border border-[#5b4033]/10 bg-white p-5 shadow-[0_14px_42px_rgba(66,43,32,0.055)]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0"><p className="text-xs font-semibold text-[#9a7b62]">{offering.standardService.category.nameFa}</p><h3 className="mt-1 truncate font-black text-[#3d2a22]">{offering.titleFa}</h3><p className="mt-2 text-sm text-[#6f5b51]">{priceLabel(offering)}</p></div>
                <Badge variant="outline" className={offering.published ? "border-emerald-200 bg-emerald-50 text-emerald-700" : offering.active ? "border-amber-200 bg-amber-50 text-amber-700" : "border-stone-200 bg-stone-50 text-stone-600"}>{offering.published ? "منتشرشده" : offering.active ? "فعال، منتشرنشده" : "غیرفعال"}</Badge>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-[#78665c]">
                <span className="flex items-center gap-1 rounded-xl bg-stone-50 p-2"><Clock3 className="size-3.5" />{offering.duration.baseMinute.toLocaleString("fa-IR")} دقیقه</span>
                <span className="flex items-center gap-1 rounded-xl bg-stone-50 p-2"><UserRound className="size-3.5" />{offering.professional?.displayNameFa ?? "بدون متخصص"}</span>
                <span className="col-span-2 rounded-xl bg-stone-50 p-2">{offering.branch?.nameFa ?? "بدون شعبه مشخص"} · {audienceLabels[((offering.audienceRules as { audience?: OfferingForm["audience"] }).audience ?? "ALL")]}</span>
              </div>

              <div className="mt-auto flex flex-wrap gap-2 border-t border-[#5b4033]/10 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => openEdit(offering)}><Pencil className="size-4" />ویرایش</Button>
                <Button type="button" variant={offering.published ? "secondary" : "default"} className={cn("flex-1", !offering.published && "bg-[#6f4b38] text-white hover:bg-[#805743]")} onClick={() => void togglePublication(offering)} disabled={actionId === offering.id}>{actionId === offering.id ? <Loader2 className="animate-spin" /> : offering.published ? <EyeOff className="size-4" /> : <Send className="size-4" />}{offering.published ? "توقف انتشار" : "انتشار"}</Button>
                <Button type="button" variant="ghost" size="icon" onClick={() => setDeleting(offering)} aria-label={`حذف ${offering.titleFa}`} className="text-rose-700 hover:bg-rose-50"><Trash2 className="size-4" /></Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog open={editorOpen} onOpenChange={(open) => { if (!open && !saving) setEditorOpen(false) }}>
        <DialogContent dir="rtl" className="max-h-[94vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader className="text-right sm:text-right"><DialogTitle>{editing ? "ویرایش خدمت" : "افزودن خدمت جدید"}</DialogTitle><DialogDescription>قیمت‌ها فقط به تومان و مدت‌ها به دقیقه ثبت می‌شوند. در این مرحله سیاست پرداخت خدمت روی «بدون پرداخت آنلاین» است.</DialogDescription></DialogHeader>
          <form onSubmit={save} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2"><span className="mb-2 block text-sm font-semibold">خدمت استاندارد</span><select value={form.standardServiceId} onChange={(event) => updateForm("standardServiceId", event.target.value)} disabled={Boolean(editing)} className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm disabled:bg-stone-100"><option value="">انتخاب خدمت</option>{catalog.map((category) => <optgroup key={category.id} label={category.nameFa}>{category.services.map((service) => <option key={service.id} value={service.id}>{service.titleFa}</option>)}</optgroup>)}</select></label>
              <label className="block sm:col-span-2"><span className="mb-2 block text-sm font-semibold">عنوان نمایشی</span><Input value={form.titleFa} onChange={(event) => updateForm("titleFa", event.target.value)} maxLength={180} placeholder="مثلاً کوتاهی و استایل حرفه‌ای" /></label>
              <label className="block"><span className="mb-2 block text-sm font-semibold">شعبه</span><select value={form.branchId} onChange={(event) => updateForm("branchId", event.target.value)} disabled={Boolean(editing)} className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm disabled:bg-stone-100"><option value="">بدون شعبه مشخص</option>{activeBranches.map((branch) => <option key={branch.id} value={branch.id}>{branch.nameFa} - {branch.location.city.nameFa}</option>)}</select></label>
              <label className="block"><span className="mb-2 block text-sm font-semibold">متخصص</span><select value={form.professionalId} onChange={(event) => updateForm("professionalId", event.target.value)} disabled={Boolean(editing)} className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm disabled:bg-stone-100"><option value="">بدون متخصص مشخص</option>{affiliations.map((affiliation) => <option key={affiliation.professional.id} value={affiliation.professional.id}>{affiliation.professional.displayNameFa}{affiliation.branch ? ` - ${affiliation.branch.nameFa}` : ""}</option>)}</select></label>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block"><span className="mb-2 block text-sm font-semibold">نوع قیمت</span><select value={form.priceModel} onChange={(event) => updateForm("priceModel", event.target.value as Offering["priceModel"])} className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm">{Object.entries(priceModelLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label className="block"><span className="mb-2 block text-sm font-semibold">قیمت پایه تومان</span><Input inputMode="numeric" value={form.priceMinToman} onChange={(event) => updateForm("priceMinToman", event.target.value.replace(/\D/g, ""))} disabled={form.priceModel === "AFTER_CONSULTATION"} placeholder="500000" /></label>
              <label className="block"><span className="mb-2 block text-sm font-semibold">حداکثر قیمت تومان</span><Input inputMode="numeric" value={form.priceMaxToman} onChange={(event) => updateForm("priceMaxToman", event.target.value.replace(/\D/g, ""))} disabled={form.priceModel !== "RANGE"} placeholder="900000" /></label>
            </div>

            <div className="grid gap-4 sm:grid-cols-5">
              <label className="block"><span className="mb-2 block text-xs font-semibold">مدت خدمت</span><Input inputMode="numeric" value={form.baseDurationMinute} onChange={(event) => updateForm("baseDurationMinute", event.target.value.replace(/\D/g, ""))} /></label>
              <label className="block"><span className="mb-2 block text-xs font-semibold">آماده‌سازی</span><Input inputMode="numeric" value={form.preparationMinute} onChange={(event) => updateForm("preparationMinute", event.target.value.replace(/\D/g, ""))} /></label>
              <label className="block"><span className="mb-2 block text-xs font-semibold">جمع‌بندی</span><Input inputMode="numeric" value={form.cleanupMinute} onChange={(event) => updateForm("cleanupMinute", event.target.value.replace(/\D/g, ""))} /></label>
              <label className="block"><span className="mb-2 block text-xs font-semibold">فاصله قبل</span><Input inputMode="numeric" value={form.bufferBeforeMinute} onChange={(event) => updateForm("bufferBeforeMinute", event.target.value.replace(/\D/g, ""))} /></label>
              <label className="block"><span className="mb-2 block text-xs font-semibold">فاصله بعد</span><Input inputMode="numeric" value={form.bufferAfterMinute} onChange={(event) => updateForm("bufferAfterMinute", event.target.value.replace(/\D/g, ""))} /></label>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block"><span className="mb-2 block text-sm font-semibold">مخاطب</span><select value={form.audience} onChange={(event) => updateForm("audience", event.target.value as OfferingForm["audience"])} className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm">{Object.entries(audienceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label className="block"><span className="mb-2 block text-sm font-semibold">روش تأیید</span><select value={form.approval} onChange={(event) => updateForm("approval", event.target.value as OfferingForm["approval"])} className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm"><option value="INSTANT">تأیید فوری</option><option value="MANUAL">تأیید دستی سالن</option></select></label>
              <label className="block"><span className="mb-2 block text-sm font-semibold">مهلت تأیید دستی</span><Input inputMode="numeric" value={form.approvalDeadlineMinute} onChange={(event) => updateForm("approvalDeadlineMinute", event.target.value.replace(/\D/g, ""))} disabled={form.approval !== "MANUAL"} /></label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center justify-between gap-4 rounded-2xl border border-[#5b4033]/10 bg-stone-50 p-4"><span><strong className="block text-sm">فعال</strong><small className="mt-1 block text-[#806e64]">خدمت برای عملیات داخلی آماده است.</small></span><input type="checkbox" checked={form.active} onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked, published: event.target.checked ? current.published : false }))} className="size-5 accent-[#4a3027]" /></label>
              <label className="flex items-center justify-between gap-4 rounded-2xl border border-[#5b4033]/10 bg-stone-50 p-4"><span><strong className="block text-sm">انتشار عمومی</strong><small className="mt-1 block text-[#806e64]">فقط خدمت فعال و معتبر منتشر می‌شود.</small></span><input type="checkbox" checked={form.published} onChange={(event) => setForm((current) => ({ ...current, published: event.target.checked, active: event.target.checked ? true : current.active }))} className="size-5 accent-[#4a3027]" /></label>
            </div>

            {formError ? <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{formError}</div> : null}
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditorOpen(false)} disabled={saving}>انصراف</Button><Button type="submit" disabled={saving} className="bg-[#3a251e] text-white hover:bg-[#4a3027]">{saving ? <><Loader2 className="animate-spin" />در حال ذخیره</> : editing ? "ذخیره تغییرات" : "ثبت خدمت"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleting)} onOpenChange={(open) => { if (!open && !actionId) setDeleting(null) }}>
        <DialogContent dir="rtl" className="sm:max-w-md"><DialogHeader className="text-right sm:text-right"><DialogTitle>حذف خدمت</DialogTitle><DialogDescription>خدمت از فهرست عملیاتی حذف می‌شود اما سوابق نوبت‌های قبلی باقی می‌ماند.</DialogDescription></DialogHeader><div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">خدمت «{deleting?.titleFa}» حذف شود؟</div>{formError ? <p className="text-sm text-rose-700">{formError}</p> : null}<DialogFooter><Button type="button" variant="outline" onClick={() => setDeleting(null)} disabled={Boolean(actionId)}>انصراف</Button><Button type="button" variant="destructive" onClick={() => void remove()} disabled={Boolean(actionId)}>{actionId ? <><Loader2 className="animate-spin" />در حال حذف</> : "حذف خدمت"}</Button></DialogFooter></DialogContent>
      </Dialog>
    </div>
  )
}
