"use client"

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  FilterX,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  UserRound,
  WalletCards,
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

type Booking = {
  id: string
  status: string
  currency: string
  subtotalToman: string
  discountToman: string
  travelFeeToman: string
  platformFeeToman: string
  totalToman: string
  approvalDeadlineAt: string | null
  disputeWindowEndsAt: string | null
  cancelledAt: string | null
  finalizedAt: string | null
  version: number
  createdAt: string
  updatedAt: string
  recipient: {
    id: string
    firstName: string
    lastName: string
    birthDate: string | null
    genderCode: string | null
    relationLabel: string | null
  }
  provider: {
    id: string
    nameFa: string
    slug: string
    status: string
    bookingEnabled: boolean
  }
  branch: {
    id: string
    nameFa: string
    active: boolean
    city: { id: string; nameFa: string }
    neighborhood: { id: string; nameFa: string } | null
  } | null
  items: Array<{
    id: string
    startsAt: string
    endsAt: string
    occupiedFrom: string
    occupiedUntil: string
    unitPriceToman: string
    quantity: number
    offering: {
      id: string
      titleFa: string
      standardService: { id: string; titleFa: string }
    }
    professional: {
      id: string
      displayNameFa: string
      verified: boolean
      active: boolean
    } | null
  }>
  transitions: Array<{
    id: string
    fromStatus: string | null
    toStatus: string
    reasonCode: string | null
    reason: string | null
    createdAt: string
  }>
  payments: Array<{
    id: string
    purpose: string
    providerKey: string
    providerRef: string | null
    status: string
    amountToman: string
    succeededAt: string | null
    failedAt: string | null
    createdAt: string
    updatedAt: string
  }>
}

type BookingListData = {
  items: Booking[]
  pagination: { page: number; pageSize: number; total: number; totalPages: number }
}

type ApiEnvelope<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string }; correlationId?: string }

const statusOptions = [
  ["", "همه وضعیت‌ها"],
  ["AWAITING_PROVIDER_APPROVAL", "در انتظار تأیید سالن"],
  ["CONFIRMED", "تأییدشده"],
  ["RESCHEDULED", "زمان جدید تأییدشده"],
  ["AWAITING_PAYMENT", "در انتظار پرداخت"],
  ["PAYMENT_PENDING", "پرداخت در حال بررسی"],
  ["REJECTED", "ردشده"],
  ["EXPIRED", "منقضی‌شده"],
  ["CUSTOMER_CANCELLED", "لغوشده توسط شما"],
  ["PROVIDER_CANCELLED", "لغوشده توسط سالن"],
  ["CHECKED_IN", "حضور ثبت‌شده"],
  ["IN_SERVICE", "در حال انجام"],
  ["COMPLETED_BY_PROVIDER", "تکمیل‌شده"],
  ["FINALIZED", "نهایی‌شده"],
  ["DISPUTED", "در حال بررسی اختلاف"],
  ["REFUNDED", "بازپرداخت‌شده"],
  ["PARTIALLY_REFUNDED", "بازپرداخت جزئی"],
] as const

const statusLabels: Record<string, string> = Object.fromEntries(statusOptions.filter(([value]) => value))

const paymentLabels: Record<string, string> = {
  CREATED: "ایجادشده",
  PENDING: "در انتظار",
  SUCCEEDED: "موفق",
  FAILED: "ناموفق",
  EXPIRED: "منقضی‌شده",
  REFUND_PENDING: "بازپرداخت در انتظار",
  PARTIALLY_REFUNDED: "بازپرداخت جزئی",
  REFUNDED: "بازپرداخت‌شده",
}

function statusClass(status: string) {
  if (["CONFIRMED", "RESCHEDULED", "FINALIZED"].includes(status)) return "border-emerald-200 bg-emerald-50 text-emerald-700"
  if (["AWAITING_PROVIDER_APPROVAL", "AWAITING_PAYMENT", "PAYMENT_PENDING"].includes(status)) return "border-amber-200 bg-amber-50 text-amber-700"
  if (["REJECTED", "EXPIRED", "CUSTOMER_CANCELLED", "PROVIDER_CANCELLED"].includes(status)) return "border-rose-200 bg-rose-50 text-rose-700"
  if (["CHECKED_IN", "IN_SERVICE"].includes(status)) return "border-sky-200 bg-sky-50 text-sky-700"
  return "border-stone-200 bg-stone-50 text-stone-700"
}

function formatToman(value: string) {
  return `${new Intl.NumberFormat("fa-IR").format(Number(value))} تومان`
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("fa-IR", {
    timeZone: "Asia/Tehran",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

async function apiRequest<T>(url: string): Promise<T> {
  const response = await fetch(url, { credentials: "same-origin" })
  const payload = (await response.json()) as ApiEnvelope<T>
  if (!payload.ok) throw new Error(payload.error.message)
  return payload.data
}

function LoadingRows() {
  return (
    <div className="space-y-3" aria-label="در حال بارگیری نوبت‌ها">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="animate-pulse rounded-2xl border border-[#5b4033]/8 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-stone-200" />
            <div className="flex-1 space-y-2"><div className="h-4 w-1/3 rounded bg-stone-200" /><div className="h-3 w-2/3 rounded bg-stone-100" /></div>
            <div className="h-8 w-24 rounded-full bg-stone-100" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function CustomerBookingManager({
  initialScope = "all",
  initialStatus = "",
  initialBookingId,
}: {
  initialScope?: "all" | "upcoming" | "past"
  initialStatus?: string
  initialBookingId?: string
}) {
  const router = useRouter()
  const [items, setItems] = useState<Booking[]>([])
  const [pagination, setPagination] = useState({ page: 1, pageSize: 15, total: 0, totalPages: 1 })
  const [scope, setScope] = useState<"all" | "upcoming" | "past">(initialScope)
  const [status, setStatus] = useState(initialStatus)
  const [queryDraft, setQueryDraft] = useState("")
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)

  const queryString = useMemo(() => {
    const params = new URLSearchParams({ scope, page: String(page), pageSize: "15" })
    if (status) params.set("status", status)
    if (query) params.set("query", query)
    return params.toString()
  }, [scope, page, status, query])

  const loadBookings = useCallback(async () => {
    setLoading(true)
    setListError(null)
    try {
      const data = await apiRequest<BookingListData>(`/api/v1/customer-panel/bookings?${queryString}`)
      setItems(data.items)
      setPagination(data.pagination)
      if (data.pagination.page > data.pagination.totalPages) setPage(data.pagination.totalPages)
    } catch (error) {
      setListError(error instanceof Error ? error.message : "بارگیری نوبت‌ها ناموفق بود.")
    } finally {
      setLoading(false)
    }
  }, [queryString])

  const loadDetail = useCallback(async (bookingId: string) => {
    setDetailLoading(true)
    setDetailError(null)
    try {
      setSelectedBooking(await apiRequest<Booking>(`/api/v1/customer-panel/bookings/${bookingId}`))
    } catch (error) {
      setSelectedBooking(null)
      setDetailError(error instanceof Error ? error.message : "جزئیات نوبت دریافت نشد.")
    } finally {
      setDetailLoading(false)
    }
  }, [])

  useEffect(() => { void loadBookings() }, [loadBookings])
  useEffect(() => { if (initialBookingId) void loadDetail(initialBookingId) }, [initialBookingId, loadDetail])

  function syncUrl(bookingId?: string | null) {
    const params = new URLSearchParams({ scope })
    if (status) params.set("status", status)
    if (bookingId) params.set("bookingId", bookingId)
    router.replace(`/dashboard/bookings?${params.toString()}`, { scroll: false })
  }

  function openDetails(booking: Booking) {
    setSelectedBooking(booking)
    setDetailError(null)
    syncUrl(booking.id)
    void loadDetail(booking.id)
  }

  function closeDetails() {
    setSelectedBooking(null)
    setDetailError(null)
    syncUrl(null)
  }

  function applyFilters(event: FormEvent) {
    event.preventDefault()
    setPage(1)
    setQuery(queryDraft.trim())
  }

  function clearFilters() {
    setScope("all")
    setStatus("")
    setQueryDraft("")
    setQuery("")
    setPage(1)
    router.replace("/dashboard/bookings?scope=all", { scroll: false })
  }

  const hasFilters = Boolean(scope !== "all" || status || query)

  return (
    <div className="space-y-5">
      <form onSubmit={applyFilters} className="rounded-[26px] border border-[#5b4033]/10 bg-white p-4 shadow-[0_15px_45px_rgba(66,43,32,0.055)] sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_180px_220px_auto]">
          <label className="relative block">
            <span className="sr-only">جست‌وجوی نوبت</span>
            <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#9b887e]" />
            <Input value={queryDraft} onChange={(event) => setQueryDraft(event.target.value)} placeholder="نام سالن، خدمت، متخصص یا دریافت‌کننده" className="h-11 pr-10" />
          </label>
          <label>
            <span className="sr-only">بازه نوبت</span>
            <select value={scope} onChange={(event) => { setScope(event.target.value as typeof scope); setPage(1) }} className="h-11 w-full rounded-md border border-input bg-transparent px-3 text-sm">
              <option value="all">همه نوبت‌ها</option>
              <option value="upcoming">نوبت‌های آینده</option>
              <option value="past">نوبت‌های گذشته</option>
            </select>
          </label>
          <label>
            <span className="sr-only">وضعیت نوبت</span>
            <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }} className="h-11 w-full rounded-md border border-input bg-transparent px-3 text-sm">
              {statusOptions.map(([value, label]) => <option key={value || "all"} value={value}>{label}</option>)}
            </select>
          </label>
          <Button type="submit" className="h-11 bg-[#3a251e] text-white hover:bg-[#4a3027]">اعمال فیلتر</Button>
        </div>
        {hasFilters ? <div className="mt-3 flex justify-end"><Button type="button" variant="ghost" size="sm" onClick={clearFilters}><FilterX className="size-4" />پاک‌کردن فیلترها</Button></div> : null}
      </form>

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div><h2 className="text-xl font-black text-[#34231d]">فهرست نوبت‌ها</h2><p className="mt-1 text-sm text-[#806e64]">{loading ? "در حال دریافت..." : `${pagination.total.toLocaleString("fa-IR")} نوبت یافت شد`}</p></div>
        <Button type="button" variant="outline" onClick={() => void loadBookings()} disabled={loading}><RefreshCw className={cn("size-4", loading && "animate-spin")} />تازه‌سازی</Button>
      </div>

      {loading ? <LoadingRows /> : listError ? (
        <div className="rounded-[26px] border border-rose-200 bg-rose-50 p-8 text-center"><AlertCircle className="mx-auto size-10 text-rose-500" /><p className="mt-4 font-bold text-rose-900">بارگیری نوبت‌ها ناموفق بود</p><p className="mt-2 text-sm text-rose-700">{listError}</p><Button type="button" variant="outline" className="mt-5" onClick={() => void loadBookings()}>تلاش دوباره</Button></div>
      ) : items.length === 0 ? (
        <div className="rounded-[26px] border border-dashed border-[#5b4033]/20 bg-white p-10 text-center"><CalendarDays className="mx-auto size-11 text-[#b4a096]" /><p className="mt-4 font-black text-[#49342b]">نوبتی مطابق این فیلتر پیدا نشد</p><p className="mt-2 text-sm text-[#87756b]">فیلترها را تغییر دهید یا از سایت خدمت جدیدی رزرو کنید.</p>{hasFilters ? <Button type="button" variant="outline" className="mt-5" onClick={clearFilters}>نمایش همه نوبت‌ها</Button> : null}</div>
      ) : (
        <div className="space-y-3">
          {items.map((booking) => {
            const firstItem = booking.items[0]
            return (
              <article key={booking.id} className="rounded-[24px] border border-[#5b4033]/10 bg-white p-4 shadow-[0_12px_38px_rgba(66,43,32,0.045)] transition hover:border-[#b98a55]/30 sm:p-5">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#f0e5da] font-black text-[#5a3c2f]">{booking.provider.nameFa.slice(0, 1)}</div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2"><h3 className="font-black text-[#392820]">{booking.provider.nameFa}</h3><Badge variant="outline" className={statusClass(booking.status)}>{statusLabels[booking.status] ?? booking.status}</Badge></div>
                      <p className="mt-2 text-sm font-semibold text-[#5d493f]">{firstItem?.offering.titleFa ?? "خدمت نامشخص"}</p>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs text-[#837168]">
                        <span className="flex items-center gap-1"><CalendarDays className="size-3.5" />{firstItem ? formatDateTime(firstItem.startsAt) : "زمان نامشخص"}</span>
                        <span className="flex items-center gap-1"><MapPin className="size-3.5" />{booking.branch ? `${booking.branch.nameFa}، ${booking.branch.city.nameFa}` : "بدون شعبه"}</span>
                        <span className="flex items-center gap-1"><UserRound className="size-3.5" />برای {booking.recipient.firstName} {booking.recipient.lastName}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#5b4033]/8 pt-4 xl:justify-end xl:border-0 xl:pt-0">
                    <div className="text-left xl:text-right"><p className="text-xs text-[#8b796f]">مبلغ کل</p><p className="mt-1 font-black text-[#3d2a22]">{formatToman(booking.totalToman)}</p></div>
                    <Button type="button" variant="outline" onClick={() => openDetails(booking)}><Eye className="size-4" />جزئیات</Button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {!loading && !listError && pagination.totalPages > 1 ? (
        <nav aria-label="صفحه‌بندی نوبت‌ها" className="flex items-center justify-center gap-3 pt-2">
          <Button type="button" variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} aria-label="صفحه قبل"><ChevronRight className="size-4" /></Button>
          <span className="min-w-28 text-center text-sm text-[#6f5c52]">صفحه {pagination.page.toLocaleString("fa-IR")} از {pagination.totalPages.toLocaleString("fa-IR")}</span>
          <Button type="button" variant="outline" size="icon" disabled={page >= pagination.totalPages} onClick={() => setPage((value) => Math.min(pagination.totalPages, value + 1))} aria-label="صفحه بعد"><ChevronLeft className="size-4" /></Button>
        </nav>
      ) : null}

      <Dialog open={Boolean(selectedBooking) || detailLoading || Boolean(detailError)} onOpenChange={(open) => { if (!open) closeDetails() }}>
        <DialogContent dir="rtl" className="max-h-[92vh] overflow-y-auto border-[#5b4033]/15 bg-[#fcfaf7] sm:max-w-3xl">
          <DialogHeader className="text-right sm:text-right"><DialogTitle className="text-xl text-[#34231d]">جزئیات نوبت</DialogTitle><DialogDescription>اطلاعات ثبت‌شده، وضعیت و پرداخت‌های مرتبط</DialogDescription></DialogHeader>
          {detailLoading && !selectedBooking ? <div className="flex min-h-64 items-center justify-center"><Loader2 className="size-8 animate-spin text-[#6e4a38]" /></div> : detailError && !selectedBooking ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-800"><AlertCircle className="mx-auto mb-3 size-8" />{detailError}</div>
          ) : selectedBooking ? (
            <div className="space-y-5">
              <div className="flex flex-col justify-between gap-3 rounded-2xl bg-[#35231c] p-5 text-white sm:flex-row sm:items-center">
                <div><p className="text-sm text-[#dbc6b5]">ارائه‌دهنده</p><p className="mt-1 text-lg font-black">{selectedBooking.provider.nameFa}</p><p className="mt-1 text-xs text-[#cbb4a3]">دریافت‌کننده: {selectedBooking.recipient.firstName} {selectedBooking.recipient.lastName}</p></div>
                <Badge variant="outline" className={cn("w-fit", statusClass(selectedBooking.status))}>{statusLabels[selectedBooking.status] ?? selectedBooking.status}</Badge>
              </div>

              {selectedBooking.status === "AWAITING_PROVIDER_APPROVAL" ? <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><div className="flex items-start gap-2"><Clock3 className="mt-0.5 size-5 shrink-0" /><div><p className="font-bold">در انتظار پاسخ سالن</p><p className="mt-1 leading-6">مهلت پاسخ: {selectedBooking.approvalDeadlineAt ? formatDateTime(selectedBooking.approvalDeadlineAt) : "نامشخص"}</p></div></div></div> : null}

              <section><h3 className="font-black text-[#3e2c24]">خدمات و زمان</h3><div className="mt-3 space-y-3">{selectedBooking.items.map((item) => <div key={item.id} className="rounded-2xl border border-[#5b4033]/10 bg-white p-4"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><p className="font-bold text-[#3e2c24]">{item.offering.titleFa}</p><p className="mt-1 text-xs text-[#8a776d]">خدمت استاندارد: {item.offering.standardService.titleFa}</p></div><p className="font-black text-[#4b3329]">{formatToman((Number(item.unitPriceToman) * item.quantity).toString())}</p></div><div className="mt-3 grid gap-2 text-sm text-[#725f55] sm:grid-cols-3"><span>شروع: {formatDateTime(item.startsAt)}</span><span>پایان: {formatDateTime(item.endsAt)}</span><span>متخصص: {item.professional?.displayNameFa ?? "تعیین نشده"}</span></div></div>)}</div></section>

              <section className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-[#5b4033]/10 bg-white p-4"><p className="text-xs text-[#8a776d]">شعبه</p><p className="mt-2 font-bold text-[#3e2c24]">{selectedBooking.branch?.nameFa ?? "بدون شعبه"}</p><p className="mt-1 text-sm text-[#725f55]">{selectedBooking.branch ? `${selectedBooking.branch.city.nameFa}${selectedBooking.branch.neighborhood ? `، ${selectedBooking.branch.neighborhood.nameFa}` : ""}` : ""}</p></div>
                <div className="rounded-2xl border border-[#5b4033]/10 bg-white p-4"><p className="text-xs text-[#8a776d]">خلاصه مبلغ</p><div className="mt-2 space-y-1 text-sm text-[#725f55]"><p className="flex justify-between"><span>جمع خدمات</span><span>{formatToman(selectedBooking.subtotalToman)}</span></p><p className="flex justify-between"><span>تخفیف</span><span>{formatToman(selectedBooking.discountToman)}</span></p><p className="flex justify-between font-black text-[#3e2c24]"><span>مبلغ نهایی</span><span>{formatToman(selectedBooking.totalToman)}</span></p></div></div>
              </section>

              <section><h3 className="font-black text-[#3e2c24]">پرداخت‌های مرتبط</h3>{selectedBooking.payments.length === 0 ? <div className="mt-3 rounded-2xl border border-dashed border-[#5b4033]/15 bg-white p-5 text-sm text-[#806e64]">پرداختی برای این نوبت ثبت نشده است.</div> : <div className="mt-3 space-y-3">{selectedBooking.payments.map((payment) => <div key={payment.id} className="flex flex-col justify-between gap-3 rounded-2xl border border-[#5b4033]/10 bg-white p-4 sm:flex-row sm:items-center"><div className="flex items-start gap-3"><WalletCards className="mt-0.5 size-5 text-[#8d684e]" /><div><p className="font-bold text-[#3e2c24]">{paymentLabels[payment.status] ?? payment.status}</p><p className="mt-1 text-xs text-[#8a776d]">{formatDateTime(payment.createdAt)}</p></div></div><p className="font-black text-[#4b3329]">{formatToman(payment.amountToman)}</p></div>)}</div>}</section>

              <section><h3 className="font-black text-[#3e2c24]">تاریخچه وضعیت</h3><ol className="mt-3 space-y-3 border-r-2 border-[#d9c6b7] pr-4">{selectedBooking.transitions.map((transition) => <li key={transition.id} className="relative rounded-xl bg-white p-3 text-sm before:absolute before:-right-[22px] before:top-4 before:size-3 before:rounded-full before:bg-[#9c714f]"><div className="flex flex-col justify-between gap-1 sm:flex-row"><span className="font-bold text-[#473128]">{statusLabels[transition.toStatus] ?? transition.toStatus}</span><span className="text-xs text-[#8a776d]">{formatDateTime(transition.createdAt)}</span></div>{transition.reason ? <p className="mt-2 text-[#725f55]">{transition.reason}</p> : null}</li>)}</ol></section>
            </div>
          ) : null}
          <DialogFooter><Button type="button" variant="outline" onClick={closeDetails}>بستن</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
