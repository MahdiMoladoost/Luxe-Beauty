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
import type { Booking, BookingQuote, SlotHold, TimeSlot } from "@/lib/domain"
import { calculateQuote, formatToman, isIranianMobile } from "@/lib/booking-engine"
import { getCompatibleStaff, getSalonById, getServicesForSalon, salons, staffMembers } from "@/lib/mock-data"

const stepLabels = ["خدمات", "آرایشگر", "زمان", "تایید موبایل", "مرور و پرداخت"]

function nextDateIso(days = 1) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

type ApiError = { code: string; message: string; fields?: Record<string, string> }
type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError }
type HoldResult = { hold: SlotHold; quote: BookingQuote; staff: { id: string; fullName: string } }
type BookingResult = { booking: Booking; staff?: { id: string; fullName: string; title: string } }

export default function BookingPage() {
  const [step, setStep] = useState(0)
  const [salonId, setSalonId] = useState("salon-luxe")
  const [serviceIds, setServiceIds] = useState<string[]>([])
  const [staffId, setStaffId] = useState("any")
  const [resolvedStaffId, setResolvedStaffId] = useState("")
  const [date, setDate] = useState(nextDateIso())
  const [startTime, setStartTime] = useState("")
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
    const requestedSalon = getSalonById(params.get("salon") ?? "")
    const initialSalon = requestedSalon ?? salons[0]
    const validServices = new Set(getServicesForSalon(initialSalon.id).map((service) => service.id))
    const requestedServices = Array.from(new Set(params.getAll("service"))).filter((id) => validServices.has(id))
    const requestedStaff = params.get("staff")

    setSalonId(initialSalon.id)
    setServiceIds(requestedServices)
    if (requestedStaff && staffMembers.some((staff) => staff.id === requestedStaff && staff.salonId === initialSalon.id)) {
      setStaffId(requestedStaff)
    }
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
    if (staffId !== "any" && !compatibleStaff.some((staff) => staff.id === staffId)) {
      setStaffId("any")
      setResolvedStaffId("")
    }
  }, [compatibleStaff, staffId])

  useEffect(() => {
    if (step !== 2 || !date || serviceIds.length === 0) return
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
  }, [step, salonId, date, staffId, serviceIds])

  useEffect(() => {
    if (!holdExpiresAt) return
    const update = () => setSecondsLeft(Math.max(0, Math.floor((new Date(holdExpiresAt).getTime() - Date.now()) / 1000)))
    update()
    const timer = window.setInterval(update, 1000)
    return () => window.clearInterval(timer)
  }, [holdExpiresAt])

  function resetSlotSelection() {
    setStartTime("")
    setResolvedStaffId("")
    setHoldId("")
    setHoldExpiresAt("")
  }

  function toggleService(id: string) {
    setServiceIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
    resetSlotSelection()
  }

  function advance() {
    setError("")
    if (step === 0 && serviceIds.length === 0) return setError("حداقل یک خدمت انتخاب کنید.")
    if (step === 1 && compatibleStaff.length === 0) return setError("این ترکیب خدمات آرایشگر مشترک ندارد.")
    if (step === 2 && (!date || !startTime || !resolvedStaffId)) return setError("یک تاریخ و زمان آزاد انتخاب کنید.")
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
      const verificationResponse = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", mobile, code: otp }),
      })
      const verificationResult = (await verificationResponse.json()) as ApiResult<{ verified: boolean }>
      if (!verificationResult.ok) throw new Error(verificationResult.error.message)

      const holdResponse = await fetch("/api/booking/hold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salonId,
          serviceIds,
          staffId: resolvedStaffId || staffId,
          date,
          startTime,
          customerMobile: mobile,
        }),
      })
      const holdResult = (await holdResponse.json()) as ApiResult<HoldResult>
      if (!holdResult.ok) throw new Error(holdResult.error.message)

      setOtpVerified(true)
      setHoldId(holdResult.data.hold.id)
      setHoldExpiresAt(holdResult.data.hold.expiresAt)
      setResolvedStaffId(holdResult.data.hold.staffId)
      setStep(4)
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "تایید شماره یا نگه‌داری زمان ناموفق بود."
      setError(message)
      if (message.includes("زمان")) setStep(2)
    } finally {
      setLoading(false)
    }
  }

  async function submitBooking() {
    if (!acceptedTerms) return setError("پذیرش قوانین رزرو و کنسلی الزامی است.")
    if (!holdId || secondsLeft <= 0) return setError("Hold منقضی شده است؛ دوباره زمان را انتخاب کنید.")
    setLoading(true)
    setError("")
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          holdId,
          // MVP simulation. Production must set this only after a verified gateway callback.
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
          <section className="rounded-3xl border border-border bg-card p-7 text-center shadow-sm md:p-10">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600"><CheckCircle2 className="h-11 w-11" /></div>
            <h1 className="mt-6 text-3xl font-black text-foreground">نوبت شما با موفقیت ثبت شد</h1>
            <p className="mt-3 text-muted-foreground">رسید رزرو ایجاد شد و اعلان تایید در محیط تولید از صف اعلان ارسال می‌شود.</p>
            <div className="mt-8 grid gap-4 rounded-2xl bg-secondary/60 p-5 text-right sm:grid-cols-2">
              <Receipt label="کد رهگیری" value={booking.trackingCode} />
              <Receipt label="سالن" value={salon.name} />
              <Receipt label="آرایشگر" value={bookingResult.staff?.fullName ?? selectedStaff?.fullName ?? "آرایشگر آزاد"} />
              <Receipt label="تاریخ و ساعت" value={`${booking.date}، ${booking.startTime}`} />
              <Receipt label="مبلغ کل" value={formatToman(booking.quote.total)} />
              <Receipt label="بیعانه" value={formatToman(booking.quote.deposit)} />
            </div>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild><Link href="/dashboard">مشاهده نوبت‌های من</Link></Button>
              <Button variant="outline" asChild><Link href={`/salons/${salon.slug}`}>بازگشت به سالن</Link></Button>
            </div>
          </section>
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
            <p className="text-sm font-bold text-primary">رزرو آنلاین امن</p>
            <h1 className="mt-2 text-3xl font-black text-foreground md:text-4xl">رزرو نوبت در {salon.name}</h1>
            <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{salon.address}</p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground"><ShieldCheck className="h-5 w-5 text-primary" />قیمت و ظرفیت در سرور کنترل می‌شود</div>
        </div>

        <div className="mb-8 overflow-x-auto rounded-2xl border border-border bg-card p-3">
          <div className="flex min-w-[720px] items-center justify-between gap-2">
            {stepLabels.map((label, index) => (
              <div key={label} className="flex flex-1 items-center gap-2">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${index <= step ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>{index < step ? <Check className="h-4 w-4" /> : index + 1}</div>
                <span className={`text-sm font-medium ${index <= step ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
                {index < stepLabels.length - 1 && <div className="h-px flex-1 bg-border" />}
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="rounded-3xl border border-border bg-card p-5 shadow-sm md:p-7">
            {step === 0 && (
              <div>
                <SectionTitle icon={Scissors} title="خدمات موردنظر را انتخاب کنید" subtitle="چند خدمت سازگار را می‌توانید در یک نوبت رزرو کنید." />
                <label className="mb-5 block text-sm font-medium text-foreground">سالن<select value={salonId} onChange={(event) => { setSalonId(event.target.value); setServiceIds([]); setStaffId("any"); resetSlotSelection() }} className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3">{salons.map((item) => <option key={item.id} value={item.id}>{item.name} — {item.area}</option>)}</select></label>
                <div className="space-y-3">
                  {salonServices.map((service) => {
                    const selected = serviceIds.includes(service.id)
                    return (
                      <button key={service.id} type="button" onClick={() => toggleService(service.id)} className={`w-full rounded-2xl border p-4 text-right transition ${selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div><h2 className="font-black text-foreground">{service.name}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{service.description}</p><p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><Clock3 className="h-4 w-4" />{service.durationMinutes.toLocaleString("fa-IR")} دقیقه · بیعانه {formatToman(service.depositAmount)}</p></div>
                          <div className="shrink-0 text-left">{service.discountPrice && <p className="text-xs text-muted-foreground line-through">{formatToman(service.price)}</p>}<p className="font-black text-primary">{formatToman(service.discountPrice ?? service.price)}</p><span className={`mr-auto mt-3 flex h-6 w-6 items-center justify-center rounded-full border ${selected ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{selected && <Check className="h-4 w-4" />}</span></div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {step === 1 && (
              <div>
                <SectionTitle icon={UserRound} title="آرایشگر را انتخاب کنید" subtitle="فقط افراد سازگار با تمام خدمات انتخابی نمایش داده می‌شوند." />
                <div className="grid gap-3 md:grid-cols-2">
                  <button type="button" onClick={() => { setStaffId("any"); resetSlotSelection() }} className={`rounded-2xl border p-5 text-right ${staffId === "any" ? "border-primary bg-primary/5" : "border-border"}`}><Sparkles className="h-8 w-8 text-primary" /><h2 className="mt-4 font-black text-foreground">هر آرایشگر موجود</h2><p className="mt-2 text-sm text-muted-foreground">اولین متخصص آزاد و سازگار انتخاب می‌شود.</p></button>
                  {compatibleStaff.map((staff) => <button key={staff.id} type="button" onClick={() => { setStaffId(staff.id); resetSlotSelection() }} className={`rounded-2xl border p-5 text-right ${staffId === staff.id ? "border-primary bg-primary/5" : "border-border"}`}><div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary font-black text-primary">{staff.fullName.slice(0, 1)}</div><div><h2 className="font-black text-foreground">{staff.fullName}</h2><p className="text-sm text-muted-foreground">{staff.title}</p></div></div><p className="mt-4 text-sm text-muted-foreground">{staff.specialties.join("، ")}</p><p className="mt-3 text-sm font-bold text-foreground">امتیاز {staff.rating} · {staff.successfulBookings.toLocaleString("fa-IR")} رزرو</p></button>)}
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <SectionTitle icon={CalendarDays} title="تاریخ و ساعت آزاد" subtitle="زمان بعد از تایید موبایل برای ۷ دقیقه نگه داشته می‌شود." />
                <label className="block text-sm font-medium text-foreground">تاریخ<input type="date" min={new Date().toISOString().slice(0, 10)} value={date} onChange={(event) => { setDate(event.target.value); resetSlotSelection() }} className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3" /></label>
                {loading ? <div className="mt-8 flex items-center justify-center gap-2 py-10 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />در حال بررسی ظرفیت…</div> : <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">{slots.map((slot) => { const selected = startTime === slot.startTime && resolvedStaffId === slot.staffId; const staff = staffMembers.find((item) => item.id === slot.staffId); return <button key={slot.id} type="button" disabled={!slot.available} onClick={() => { setStartTime(slot.startTime); setResolvedStaffId(slot.staffId) }} className={`rounded-xl border px-3 py-3 text-sm font-bold ${selected ? "border-primary bg-primary text-primary-foreground" : slot.available ? "border-border hover:border-primary" : "cursor-not-allowed bg-secondary text-muted-foreground line-through"}`}>{slot.startTime}<span className="mt-1 block text-[10px] opacity-75">{staff?.fullName}</span></button> })}</div>}
                {!loading && slots.length === 0 && <div className="mt-5 rounded-2xl bg-secondary p-6 text-center text-sm text-muted-foreground">زمان آزادی برای این روز وجود ندارد. تاریخ یا آرایشگر دیگری انتخاب کنید.</div>}
              </div>
            )}

            {step === 3 && (
              <div>
                <SectionTitle icon={ShieldCheck} title="تایید شماره موبایل" subtitle="کد یک‌بارمصرف برای مالک رزرو ارسال می‌شود." />
                <div className="mx-auto max-w-md space-y-5">
                  <label className="block text-sm font-medium text-foreground">شماره موبایل<Input dir="ltr" inputMode="numeric" maxLength={11} value={mobile} onChange={(event) => setMobile(event.target.value)} placeholder="09123456789" className="mt-2 text-left" /></label>
                  {!otpSent ? <Button className="w-full" disabled={loading} onClick={requestOtpCode}>{loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}دریافت کد تایید</Button> : <><label className="block text-sm font-medium text-foreground">کد تایید<Input dir="ltr" inputMode="numeric" maxLength={5} value={otp} onChange={(event) => setOtp(event.target.value)} placeholder="•••••" className="mt-2 text-center text-xl tracking-[0.45em]" /></label>{demoCode && <div className="rounded-xl border border-dashed border-amber-500/50 bg-amber-500/5 p-3 text-center text-sm text-amber-800">کد محیط توسعه: <strong dir="ltr">{demoCode}</strong></div>}<Button className="w-full" disabled={loading} onClick={verifyAndHold}>{loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}تایید و نگه‌داری زمان</Button><button type="button" className="w-full text-sm font-bold text-primary" onClick={() => { setOtpSent(false); setOtp(""); setDemoCode("") }}>ویرایش شماره</button></>}
                </div>
              </div>
            )}

            {step === 4 && (
              <div>
                <SectionTitle icon={CreditCard} title="مرور و پرداخت بیعانه" subtitle="جزئیات و قوانین را پیش از ثبت نهایی بررسی کنید." />
                {otpVerified && holdId && <div className={`mb-5 rounded-2xl p-4 text-sm ${secondsLeft > 60 ? "bg-emerald-500/10 text-emerald-800" : "bg-rose-500/10 text-rose-700"}`}>زمان تا {Math.floor(secondsLeft / 60).toLocaleString("fa-IR")}:{String(secondsLeft % 60).padStart(2, "0")} نگه داشته شده است.</div>}
                <div className="grid gap-5 md:grid-cols-2"><label className="text-sm font-medium text-foreground">نام و نام خانوادگی<Input value={customerName} onChange={(event) => setCustomerName(event.target.value)} className="mt-2" /></label><label className="text-sm font-medium text-foreground">کد تخفیف<Input dir="ltr" value={discountCode} onChange={(event) => setDiscountCode(event.target.value)} placeholder="LUXE10" className="mt-2 text-left" /></label></div>
                <label className="mt-5 block text-sm font-medium text-foreground">یادداشت برای سالن<textarea value={customerNote} onChange={(event) => setCustomerNote(event.target.value)} className="mt-2 min-h-28 w-full rounded-xl border border-input bg-background p-3" placeholder="حساسیت یا توضیح ضروری…" /></label>
                <div className="mt-5 rounded-2xl bg-secondary/60 p-4 text-sm leading-7 text-muted-foreground"><strong className="text-foreground">قوانین مهم:</strong> لغو و بازگشت وجه مطابق سیاست سالن است. تاخیر بیش از ۱۵ دقیقه ممکن است مدت خدمت را کاهش دهد. خدمات مشاوره‌ای فقط پس از تایید قیمت نهایی مشتری آغاز می‌شوند.</div>
                <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4"><input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} className="mt-1 h-4 w-4" /><span className="text-sm leading-6 text-foreground">قوانین رزرو، کنسلی، پرداخت و حریم خصوصی را می‌پذیرم.</span></label>
                <Button className="mt-6 w-full" size="lg" disabled={loading || secondsLeft <= 0} onClick={submitBooking}>{loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}{quote.deposit > 0 ? `پرداخت ${formatToman(quote.deposit)} و ثبت نوبت` : "ثبت نهایی نوبت"}</Button>
                <p className="mt-3 text-center text-xs leading-6 text-muted-foreground">پرداخت این MVP شبیه‌سازی شده است؛ در تولید فقط Callback تاییدشده درگاه مجاز به تغییر وضعیت پرداخت است.</p>
              </div>
            )}

            {error && <div className="mt-6 rounded-xl bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}
            {step < 4 && <div className="mt-8 flex items-center justify-between border-t border-border pt-5"><Button variant="ghost" disabled={step === 0 || loading} onClick={() => { setStep((current) => Math.max(0, current - 1)); setError("") }}>مرحله قبل</Button>{step !== 3 && <Button disabled={loading} onClick={advance}>ادامه<ArrowLeft className="mr-2 h-4 w-4" /></Button>}</div>}
          </section>

          <aside className="h-fit rounded-3xl border border-border bg-card p-5 shadow-sm lg:sticky lg:top-24">
            <h2 className="text-lg font-black text-foreground">خلاصه رزرو</h2>
            <div className="mt-5 space-y-4 text-sm"><Summary label="سالن" value={salon.name} /><Summary label="خدمات" value={quote.lines.length ? quote.lines.map((line) => line.serviceName).join("، ") : "انتخاب نشده"} /><Summary label="آرایشگر" value={selectedStaff?.fullName ?? (staffId === "any" ? "هر آرایشگر موجود" : "انتخاب نشده")} /><Summary label="تاریخ" value={date || "انتخاب نشده"} /><Summary label="ساعت" value={startTime || "انتخاب نشده"} /><Summary label="مدت" value={quote.durationMinutes ? `${quote.durationMinutes.toLocaleString("fa-IR")} دقیقه` : "—"} /></div>
            <div className="my-5 h-px bg-border" />
            <div className="space-y-3 text-sm"><Summary label="جمع خدمات" value={formatToman(quote.subtotal)} /><Summary label="تخفیف" value={quote.discount ? `− ${formatToman(quote.discount)}` : "—"} valueClass="text-emerald-600" /><Summary label="مبلغ کل" value={formatToman(quote.total)} strong /><Summary label="بیعانه" value={formatToman(quote.deposit)} strong valueClass="text-primary" /></div>
            <p className="mt-5 rounded-xl bg-secondary p-3 text-xs leading-6 text-muted-foreground">قیمت نهایی فقط در سمت سرور محاسبه می‌شود.</p>
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

function Summary({ label, value, strong, valueClass = "" }: { label: string; value: string; strong?: boolean; valueClass?: string }) {
  return <div className="flex items-start justify-between gap-4"><span className="shrink-0 text-muted-foreground">{label}</span><span className={`text-left ${strong ? "font-black" : "font-medium"} text-foreground ${valueClass}`}>{value}</span></div>
}

function Receipt({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-black text-foreground">{value}</p></div>
}
