"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  CreditCard,
  Loader2,
  MapPin,
  Scissors,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import type { Booking, SlotHold, TimeSlot } from "@/lib/domain"
import { calculateQuote, formatToman, isIranianMobile } from "@/lib/booking-engine"
import { getCompatibleStaff, getSalonById, getServicesForSalon, salons, staffMembers } from "@/lib/mock-data"

const steps = ["انتخاب خدمت", "انتخاب آرایشگر", "تاریخ و ساعت", "ورود و تایید", "مرور و پرداخت"]

function tomorrowIso() {
  const date = new Date()
  date.setDate(date.getDate() + 1)
  return date.toISOString().slice(0, 10)
}

type ApiError = { code: string; message: string; fields?: Record<string, string> }
type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError }

type HoldResult = {
  hold: SlotHold
  quote: ReturnType<typeof calculateQuote>
  staff: { id: string; fullName: string }
}

type BookingResult = {
  booking: Booking
  staff?: { id: string; fullName: string; title: string }
}

export default function BookingPage() {
  const [step, setStep] = useState(0)
  const [salonId, setSalonId] = useState("salon-luxe")
  const [serviceIds, setServiceIds] = useState<string[]>([])
  const [staffId, setStaffId] = useState("any")
  const [date, setDate] = useState(tomorrowIso())
  const [startTime, setStartTime] = useState("")
  const [resolvedStaffId, setResolvedStaffId] = useState("")
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [mobile, setMobile] = useState("")
  const [otp, setOtp] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [demoCode, setDemoCode] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [customerNote, setCustomerNote] = useState("")
  const [discountCode, setDiscountCode] = useState("")
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [holdId, setHoldId] = useState("")
  const [holdExpiresAt, setHoldExpiresAt] = useState("")
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const salonParam = params.get("salon")
    const serviceParam = params.get("service")
    if (salonParam && salons.some((salon) => salon.id === salonParam || salon.slug === salonParam)) {
      const salon = getSalonById(salonParam)
      if (salon) setSalonId(salon.id)
    }
    if (serviceParam) setServiceIds([serviceParam])
  }, [])

  const salon = getSalonById(salonId) ?? salons[0]
  const salonServices = useMemo(() => getServicesForSalon(salonId), [salonId])
  const compatibleStaff = useMemo(() => getCompatibleStaff(serviceIds, salonId), [serviceIds, salonId])
  const quote = useMemo(() => {
    try {
      return calculateQuote(serviceIds, salonId, discountCode)
    } catch {
      return calculateQuote([], salonId)
    }
  }, [serviceIds, salonId, discountCode])
  const selectedStaff = staffMembers.find((staff) => staff.id === (resolvedStaffId || staffId))

  useEffect(() => {
    if (staffId !== "any" && !compatibleStaff.some((staff) => staff.id === staffId)) setStaffId("any")
  }, [compatibleStaff, staffId])

  useEffect(() => {
    if (step !== 2 || serviceIds.length === 0 || !date) return
    const controller = new AbortController()
    const query = new URLSearchParams({ salonId, date, staffId })
    serviceIds.forEach((id) => query.append("serviceId", id))
    setLoading(true)
    setError("")
    fetch(`/api/availability?${query.toString()}`, { signal: controller.signal })
      .then((response) => response.json() as Promise<ApiResult<{ slots: TimeSlot[] }>>)
      .then((result) => {
        if (!result.ok) throw new Error(result.error.message)
        setSlots(result.data.slots)
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return
        setError(reason instanceof Error ? reason.message : "دریافت زمان‌های آزاد ناموفق بود.")
      })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [step, salonId, serviceIds, staffId, date])

  useEffect(() => {
    if (!holdExpiresAt) return
    const update = () => setSecondsLeft(Math.max(0, Math.floor((new Date(holdExpiresAt).getTime() - Date.now()) / 1000)))
    update()
    const timer = window.setInterval(update, 1000)
    return () => window.clearInterval(timer)
  }, [holdExpiresAt])

  function toggleService(id: string) {
    setServiceIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
    setStartTime("")
    setResolvedStaffId("")
    setHoldId("")
  }

  function goNext() {
    setError("")
    if (step === 0 && serviceIds.length === 0) return setError("حداقل یک خدمت انتخاب کنید.")
    if (step === 1 && compatibleStaff.length === 0) return setError("هیچ آرایشگر مشترکی برای این ترکیب خدمات وجود ندارد.")
    if (step === 2 && (!date || !startTime)) return setError("تاریخ و ساعت آزاد را انتخاب کنید.")
    setStep((current) => Math.min(4, current + 1))
  }

  async function requestOtpCode() {
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
      setOtpSent(true)
      setDemoCode(result.data.demoCode ?? "")
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ارسال کد تایید ناموفق بود.")
    } finally {
      setLoading(false)
    }
  }

  async function verifyAndHold() {
    if (!otpSent || otp.length < 5) return setError("کد تایید را کامل وارد کنید.")
    setLoading(true)
    setError("")
    try {
      const verifyResponse = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", mobile, code: otp }),
      })
      const verifyResult = (await verifyResponse.json()) as ApiResult<{ verified: boolean }>
      if (!verifyResult.ok) throw new Error(verifyResult.error.message)

      const holdResponse = await fetch("/api/booking/hold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salonId, serviceIds, staffId: resolvedStaffId || staffId, date, startTime, customerMobile: mobile }),
      })
      const holdResult = (await holdResponse.json()) as ApiResult<HoldResult>
      if (!holdResult.ok) throw new Error(holdResult.error.message)

      setOtpVerified(true)
      setHoldId(holdResult.data.hold.id)
      setHoldExpiresAt(holdResult.data.hold.expiresAt)
      setResolvedStaffId(holdResult.data.hold.staffId)
      setStep(4)
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "تایید یا نگه‌داری زمان ناموفق بود."
      setError(message)
      if (message.includes("زمان")) setStep(2)
    } finally {
      setLoading(false)
    }
  }

  async function submitBooking() {
    if (!acceptedTerms) return setError("برای ادامه باید قوانین رزرو و کنسلی را بپذیرید.")
    if (!holdId || secondsLeft <= 0) return setError("زمان Hold منقضی شده است. دوباره زمان را انتخاب کنید.")
    setLoading(true)
    setError("")
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          holdId,
          markDepositPaid: quote.deposit > 0,
          draft: {
            salonId,
            serviceIds,
            staffId: resolvedStaffId,
            date,
            startTime,
            customerMobile: mobile,
            customerName,
            customerNote,
            discountCode,
            acceptedTerms,
          },
        }),
      })
      const result = (await response.json()) as ApiResult<BookingResult>
      if (!result.ok) throw new Error(result.error.message)
      setBookingResult(result.data)
      setStep(5)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ثبت نوبت ناموفق بود.")
    } finally {
      setLoading(false)
    }
  }

  if (bookingResult) {
    const booking = bookingResult.booking
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-3xl px-4 pb-20 pt-28">
          <div className="rounded-3xl border border-border bg-card p-6 text-center shadow-sm md:p-10">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 className="h-11 w-11" />
            </div>
            <h1 className="mt-6 text-3xl font-black text-foreground">نوبت شما با موفقیت ثبت شد</h1>
            <p className="mt-3 text-muted-foreground">رسید رزرو در پنل مشتری ثبت شد و آماده ارسال اعلان تایید است.</p>
            <div className="mt-8 rounded-2xl bg-secondary/60 p-5 text-right">
              <div className="grid gap-4 sm:grid-cols-2">
                <ReceiptItem label="کد رهگیری" value={booking.trackingCode} />
                <ReceiptItem label="سالن" value={salon.name} />
                <ReceiptItem label="آرایشگر" value={bookingResult.staff?.fullName ?? selectedStaff?.fullName ?? "اولین آرایشگر آزاد"} />
                <ReceiptItem label="تاریخ و ساعت" value={`${booking.date}، ${booking.startTime}`} />
                <ReceiptItem label="مبلغ کل" value={formatToman(booking.quote.total)} />
                <ReceiptItem label="بیعانه پرداخت‌شده" value={formatToman(booking.quote.deposit)} />
              </div>
            </div>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild><Link href="/dashboard">مشاهده نوبت‌های من</Link></Button>
              <Button variant="outline" asChild><Link href={`/salons/${salon.slug}`}>بازگشت به سالن</Link></Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-4 pb-20 pt-24 lg:px-8">
        <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold text-primary">رزرو آنلاین امن</p>
            <h1 className="mt-2 text-3xl font-black text-foreground md:text-4xl">رزرو نوبت در {salon.name}</h1>
            <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{salon.address}</p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
            <ShieldCheck className="h-5 w-5 text-primary" /> قیمت و زمان در سرور دوباره کنترل می‌شود
          </div>
        </div>

        <div className="mb-8 overflow-x-auto rounded-2xl border border-border bg-card p-3">
          <div className="flex min-w-[760px] items-center justify-between gap-2">
            {steps.map((label, index) => (
              <div key={label} className="flex flex-1 items-center gap-2">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${index <= step ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                  {index < step ? <Check className="h-4 w-4" /> : index + 1}
                </div>
                <span className={`text-sm font-medium ${index <= step ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
                {index < steps.length - 1 && <div className="h-px flex-1 bg-border" />}
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="rounded-3xl border border-border bg-card p-5 shadow-sm md:p-7">
            {step === 0 && (
              <div>
                <SectionTitle icon={Scissors} title="خدمات موردنظر را انتخاب کنید" subtitle="می‌توانید چند خدمت سازگار را در یک رزرو قرار دهید." />
                <label className="mb-5 block text-sm font-medium text-foreground">
                  سالن
                  <select
                    value={salonId}
                    onChange={(event) => { setSalonId(event.target.value); setServiceIds([]); setStaffId("any") }}
                    className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3"
                  >
                    {salons.map((item) => <option key={item.id} value={item.id}>{item.name} — {item.area}</option>)}
                  </select>
                </label>
                <div className="space-y-3">
                  {salonServices.map((service) => {
                    const selected = serviceIds.includes(service.id)
                    return (
                      <button key={service.id} type="button" onClick={() => toggleService(service.id)} className={`w-full rounded-2xl border p-4 text-right transition ${selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-bold text-foreground">{service.name}</h3>
                              {service.discountPrice && <span className="rounded-full bg-rose-500/10 px-2 py-1 text-xs text-rose-600">تخفیف‌دار</span>}
                              {service.requiresConsultation && <span className="rounded-full bg-amber-500/10 px-2 py-1 text-xs text-amber-700">نیازمند مشاوره</span>}
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">{service.description}</p>
                            <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><Clock3 className="h-4 w-4" /> حدود {service.durationMinutes} دقیقه · بیعانه {formatToman(service.depositAmount)}</p>
                          </div>
                          <div className="shrink-0 text-left">
                            {service.discountPrice && <div className="text-xs text-muted-foreground line-through">{formatToman(service.price)}</div>}
                            <div className="mt-1 font-bold text-primary">{formatToman(service.discountPrice ?? service.price)}</div>
                            <div className={`mr-auto mt-3 flex h-6 w-6 items-center justify-center rounded-full border ${selected ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{selected && <Check className="h-4 w-4" />}</div>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {step === 1 && (
              <div>
                <SectionTitle icon={UserRound} title="آرایشگر را انتخاب کنید" subtitle="فقط افرادی نمایش داده می‌شوند که تمام خدمات انتخابی را ارائه می‌دهند." />
                <div className="grid gap-3 md:grid-cols-2">
                  <button type="button" onClick={() => setStaffId("any")} className={`rounded-2xl border p-5 text-right ${staffId === "any" ? "border-primary bg-primary/5" : "border-border"}`}>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Sparkles className="h-6 w-6" /></div>
                    <h3 className="mt-4 font-bold text-foreground">هر آرایشگر موجود</h3>
                    <p className="mt-2 text-sm text-muted-foreground">سیستم اولین متخصص سازگار و آزاد را انتخاب می‌کند.</p>
                  </button>
                  {compatibleStaff.map((staff) => (
                    <button key={staff.id} type="button" onClick={() => setStaffId(staff.id)} className={`rounded-2xl border p-5 text-right ${staffId === staff.id ? "border-primary bg-primary/5" : "border-border"}`}>
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary font-bold text-primary">{staff.fullName.slice(0, 1)}</div>
                        <div><h3 className="font-bold text-foreground">{staff.fullName}</h3><p className="text-sm text-muted-foreground">{staff.title}</p></div>
                      </div>
                      <p className="mt-4 text-sm text-muted-foreground">{staff.specialties.join("، ")}</p>
                      <p className="mt-3 text-sm font-medium text-foreground">امتیاز {staff.rating} · {staff.successfulBookings.toLocaleString("fa-IR")} رزرو موفق</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <SectionTitle icon={CalendarDays} title="تاریخ و ساعت آزاد" subtitle="بعد از تایید شماره، زمان انتخابی برای ۷ دقیقه نگه داشته می‌شود." />
                <label className="block text-sm font-medium text-foreground">تاریخ<input type="date" min={new Date().toISOString().slice(0, 10)} value={date} onChange={(event) => { setDate(event.target.value); setStartTime("") }} className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3" /></label>
                <div className="mt-6">
                  <h3 className="font-bold text-foreground">زمان‌های پیشنهادی</h3>
                  {loading ? <div className="mt-6 flex items-center justify-center gap-2 py-10 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />در حال بررسی هم‌زمان ظرفیت…</div> : (
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                      {slots.map((slot) => {
                        const selected = startTime === slot.startTime && resolvedStaffId === slot.staffId
                        return <button key={slot.id} type="button" disabled={!slot.available} onClick={() => { setStartTime(slot.startTime); setResolvedStaffId(slot.staffId) }} className={`rounded-xl border px-3 py-3 text-sm font-semibold ${selected ? "border-primary bg-primary text-primary-foreground" : slot.available ? "border-border hover:border-primary" : "cursor-not-allowed border-border bg-secondary text-muted-foreground line-through"}`}>{slot.startTime}<span className="mt-1 block text-[10px] opacity-75">{staffMembers.find((item) => item.id === slot.staffId)?.fullName}</span></button>
                      })}
                    </div>
                  )}
                  {!loading && slots.length === 0 && <div className="mt-4 rounded-2xl bg-secondary p-6 text-center text-sm text-muted-foreground">برای این روز زمان آزادی وجود ندارد. تاریخ یا آرایشگر دیگری انتخاب کنید.</div>}
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <SectionTitle icon={ShieldCheck} title="ورود با شماره موبایل" subtitle="برای ثبت رزرو و دریافت اعلان‌ها شماره خود را تایید کنید." />
                <div className="mx-auto max-w-md space-y-5">
                  <label className="block text-sm font-medium text-foreground">شماره موبایل<Input dir="ltr" inputMode="numeric" maxLength={11} value={mobile} onChange={(event) => setMobile(event.target.value)} placeholder="09123456789" className="mt-2 text-left" /></label>
                  {!otpSent ? <Button className="w-full" disabled={loading} onClick={requestOtpCode}>{loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}دریافت کد تایید</Button> : (
                    <>
                      <label className="block text-sm font-medium text-foreground">کد تایید<Input dir="ltr" inputMode="numeric" maxLength={5} value={otp} onChange={(event) => setOtp(event.target.value)} placeholder="•••••" className="mt-2 text-center text-xl tracking-[0.5em]" /></label>
                      {demoCode && <div className="rounded-xl border border-dashed border-amber-500/50 bg-amber-500/5 p-3 text-center text-sm text-amber-800">کد محیط توسعه: <strong dir="ltr">{demoCode}</strong></div>}
                      <Button className="w-full" disabled={loading} onClick={verifyAndHold}>{loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}تایید، نگه‌داری زمان و ادامه</Button>
                      <button type="button" className="w-full text-sm text-primary" onClick={() => { setOtpSent(false); setOtp(""); setDemoCode("") }}>ویرایش شماره</button>
                    </>
                  )}
                </div>
              </div>
            )}

            {step === 4 && (
              <div>
                <SectionTitle icon={CreditCard} title="تایید نهایی و پرداخت بیعانه" subtitle="قبل از پرداخت، همه جزئیات و قوانین را بررسی کنید." />
                {otpVerified && holdId && <div className={`mb-5 rounded-2xl p-4 text-sm ${secondsLeft > 60 ? "bg-emerald-500/10 text-emerald-800" : "bg-rose-500/10 text-rose-700"}`}>زمان انتخابی تا {Math.floor(secondsLeft / 60).toLocaleString("fa-IR")}:{String(secondsLeft % 60).padStart(2, "0")} برای شما نگه داشته شده است.</div>}
                <div className="grid gap-5 md:grid-cols-2">
                  <label className="block text-sm font-medium text-foreground">نام و نام خانوادگی<Input value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="نام شما" className="mt-2" /></label>
                  <label className="block text-sm font-medium text-foreground">کد تخفیف<Input dir="ltr" value={discountCode} onChange={(event) => setDiscountCode(event.target.value)} placeholder="LUXE10" className="mt-2 text-left" /></label>
                </div>
                <label className="mt-5 block text-sm font-medium text-foreground">یادداشت برای سالن<textarea value={customerNote} onChange={(event) => setCustomerNote(event.target.value)} placeholder="حساسیت، ترجیح یا توضیح ضروری…" className="mt-2 min-h-28 w-full rounded-xl border border-input bg-background p-3" /></label>
                <div className="mt-5 rounded-2xl bg-secondary/60 p-4 text-sm text-muted-foreground">
                  <p className="font-bold text-foreground">قوانین مهم</p>
                  <p className="mt-2 leading-7">لغو و بازگشت وجه مطابق سیاست سالن انجام می‌شود. تاخیر بیش از ۱۵ دقیقه ممکن است باعث کاهش زمان خدمت یا لغو نوبت شود. قیمت نهایی خدمات مشاوره‌ای پس از تایید مشتری ثبت خواهد شد.</p>
                </div>
                <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4"><input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} className="mt-1 h-4 w-4" /><span className="text-sm leading-6 text-foreground">قوانین رزرو، کنسلی، حریم خصوصی و شرایط پرداخت را خوانده‌ام و می‌پذیرم.</span></label>
                <Button className="mt-6 w-full" size="lg" disabled={loading || secondsLeft <= 0} onClick={submitBooking}>{loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}{quote.deposit > 0 ? `پرداخت ${formatToman(quote.deposit)} و ثبت نوبت` : "ثبت نهایی نوبت"}</Button>
              </div>
            )}

            {error && <div className="mt-6 rounded-xl bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}
            {step < 4 && (
              <div className="mt-8 flex items-center justify-between border-t border-border pt-5">
                <Button variant="ghost" disabled={step === 0 || loading} onClick={() => { setStep((current) => Math.max(0, current - 1)); setError("") }}>مرحله قبل</Button>
                {step !== 3 && <Button disabled={loading} onClick={goNext}>ادامه <ArrowLeft className="mr-2 h-4 w-4" /></Button>}
              </div>
            )}
          </section>

          <aside className="h-fit rounded-3xl border border-border bg-card p-5 shadow-sm lg:sticky lg:top-24">
            <h2 className="text-lg font-black text-foreground">خلاصه رزرو</h2>
            <div className="mt-5 space-y-4 text-sm">
              <SummaryRow label="سالن" value={salon.name} />
              <SummaryRow label="خدمت‌ها" value={quote.lines.length ? quote.lines.map((line) => line.serviceName).join("، ") : "هنوز انتخاب نشده"} />
              <SummaryRow label="آرایشگر" value={selectedStaff?.fullName ?? (staffId === "any" ? "هر آرایشگر موجود" : "انتخاب نشده")} />
              <SummaryRow label="تاریخ" value={date || "انتخاب نشده"} />
              <SummaryRow label="ساعت" value={startTime || "انتخاب نشده"} />
              <SummaryRow label="مدت تقریبی" value={quote.durationMinutes ? `${quote.durationMinutes.toLocaleString("fa-IR")} دقیقه` : "—"} />
            </div>
            <div className="my-5 h-px bg-border" />
            <div className="space-y-3 text-sm">
              <SummaryRow label="جمع خدمات" value={formatToman(quote.subtotal)} />
              <SummaryRow label="تخفیف" value={quote.discount ? `− ${formatToman(quote.discount)}` : "—"} valueClass="text-emerald-600" />
              <SummaryRow label="مبلغ کل" value={formatToman(quote.total)} strong />
              <SummaryRow label="بیعانه" value={formatToman(quote.deposit)} strong valueClass="text-primary" />
            </div>
            <p className="mt-5 rounded-xl bg-secondary p-3 text-xs leading-6 text-muted-foreground">قیمت فقط در سمت سرور نهایی می‌شود. باقی‌مانده مبلغ مطابق روش پرداخت سالن تسویه خواهد شد.</p>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  )
}

function SectionTitle({ icon: Icon, title, subtitle }: { icon: typeof Scissors; title: string; subtitle: string }) {
  return <div className="mb-6 flex items-start gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div><div><h2 className="text-xl font-black text-foreground">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{subtitle}</p></div></div>
}

function SummaryRow({ label, value, strong, valueClass = "" }: { label: string; value: string; strong?: boolean; valueClass?: string }) {
  return <div className="flex items-start justify-between gap-4"><span className="shrink-0 text-muted-foreground">{label}</span><span className={`text-left ${strong ? "font-black text-foreground" : "font-medium text-foreground"} ${valueClass}`}>{value}</span></div>
}

function ReceiptItem({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-bold text-foreground">{value}</p></div>
}
