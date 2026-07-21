"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { FormEvent, useEffect, useMemo, useState } from "react"
import {
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  Crosshair,
  Headphones,
  Loader2,
  LocateFixed,
  Map,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
  UsersRound,
  WalletCards,
} from "lucide-react"

const CITY_STORAGE_KEY = "luxe-beauty-selected-city"
const RECENT_SEARCHES_KEY = "luxe-beauty-recent-searches"

const services = [
  "کراتین مو",
  "کوتاهی مو",
  "رنگ و هایلایت",
  "کاشت ناخن",
  "مانیکور و پدیکور",
  "پاکسازی پوست",
  "میکاپ و شینیون",
  "اکستنشن مژه",
  "اصلاح مردانه",
  "خدمات در منزل",
]

const supportedCities = ["تهران", "کرج", "مشهد", "اصفهان", "شیراز", "تبریز", "قم", "اهواز"]

const quickFilters = [
  { label: "نوبت امروز", href: "/salons?availability=today", icon: Clock3 },
  { label: "نزدیک‌ترین‌ها", href: "/salons?sort=nearby", icon: LocateFixed },
  { label: "تخفیف‌دارها", href: "/salons?offer=discount", icon: Tag },
  { label: "خدمات بانوان", href: "/salons?audience=women", icon: Sparkles },
  { label: "خدمات آقایان", href: "/salons?audience=men", icon: UsersRound },
  { label: "خدمات کودکان", href: "/salons?audience=children", icon: Star },
  { label: "خدمات در منزل", href: "/salons?provider=home-service", icon: MapPin },
  { label: "محبوب‌ترین‌ها", href: "/salons?sort=popular", icon: CheckCircle2 },
]

const trustItems = [
  { label: "ارائه‌دهندگان احرازشده", icon: BadgeCheck },
  { label: "قیمت شفاف قبل از رزرو", icon: WalletCards },
  { label: "نظرات مشتریان واقعی", icon: Star },
  { label: "پشتیبانی رزرو و بازپرداخت", icon: Headphones },
]

const typoCorrections: Record<string, string> = {
  "کراتینن": "کراتین",
  "کراتینه": "کراتین",
  "ناخون": "ناخن",
  "کاشت ناخون": "کاشت ناخن",
  "اصلاح مردونه": "اصلاح مردانه",
  "کوتاهی مردونه": "کوتاهی مردانه",
}

type AvailabilitySummary = {
  message?: string
  availableCount?: number
  nearestTime?: string
  activeProviders?: number
}

function normalizeService(value: string) {
  const trimmed = value.trim().replace(/\s+/g, " ")
  return typoCorrections[trimmed] ?? trimmed
}

function isSupportedLocation(value: string) {
  if (!value.trim() || value === "موقعیت فعلی") return true
  return supportedCities.some((city) => value.includes(city))
}

function buildAvailabilityMessage(summary: AvailabilitySummary | null) {
  if (!summary) return null
  if (summary.message) return summary.message
  if (typeof summary.availableCount === "number") {
    return `امروز ${summary.availableCount.toLocaleString("fa-IR")} نوبت خالی موجود است${summary.nearestTime ? `؛ نزدیک‌ترین زمان ${summary.nearestTime}` : ""}.`
  }
  if (typeof summary.activeProviders === "number") {
    return `${summary.activeProviders.toLocaleString("fa-IR")} سالن و متخصص در محدوده شما فعال هستند.`
  }
  return null
}

export function BookingHero() {
  const router = useRouter()
  const [service, setService] = useState("")
  const [location, setLocation] = useState("تهران، منطقه ۲۲")
  const [dateMode, setDateMode] = useState("first-available")
  const [dayPart, setDayPart] = useState("any")
  const [customDate, setCustomDate] = useState("")
  const [mobileStep, setMobileStep] = useState(1)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [status, setStatus] = useState<"idle" | "locating" | "submitting">("idle")
  const [error, setError] = useState("")
  const [availability, setAvailability] = useState<AvailabilitySummary | null>(null)
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    const savedCity = window.localStorage.getItem(CITY_STORAGE_KEY)
    const savedSearches = window.localStorage.getItem(RECENT_SEARCHES_KEY)

    if (savedCity) setLocation(savedCity)
    if (savedSearches) {
      try {
        const parsed = JSON.parse(savedSearches)
        if (Array.isArray(parsed)) setRecentSearches(parsed.slice(0, 4))
      } catch {
        window.localStorage.removeItem(RECENT_SEARCHES_KEY)
      }
    }
  }, [])

  useEffect(() => {
    if (location) window.localStorage.setItem(CITY_STORAGE_KEY, location)
  }, [location])

  useEffect(() => {
    if (!location || location === "موقعیت فعلی") return

    const controller = new AbortController()
    const loadAvailability = async () => {
      setAvailabilityLoading(true)
      try {
        const response = await fetch(`/api/availability/summary?city=${encodeURIComponent(location)}`, {
          signal: controller.signal,
          cache: "no-store",
        })
        if (!response.ok) throw new Error("availability-unavailable")
        const data = (await response.json()) as AvailabilitySummary
        setAvailability(data)
      } catch (fetchError) {
        if ((fetchError as Error).name !== "AbortError") setAvailability(null)
      } finally {
        setAvailabilityLoading(false)
      }
    }

    const timer = window.setTimeout(loadAvailability, 350)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [location])

  const availabilityMessage = useMemo(() => buildAvailabilityMessage(availability), [availability])

  const parseNaturalSearch = (rawValue: string) => {
    const normalized = normalizeService(rawValue)
    const parts = normalized.split(/\s+در\s+/)
    if (parts.length > 1) {
      const detectedLocation = parts.slice(1).join(" در ").trim()
      setService(parts[0].trim())
      if (detectedLocation) setLocation(detectedLocation)
      return parts[0].trim()
    }
    setService(normalized)
    return normalized
  }

  const useCurrentLocation = () => {
    setError("")
    if (!navigator.geolocation) {
      setError("مرورگر شما دسترسی به موقعیت فعلی را پشتیبانی نمی‌کند.")
      return
    }

    setStatus("locating")
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setCoordinates({ lat: coords.latitude, lng: coords.longitude })
        setLocation("موقعیت فعلی")
        setStatus("idle")
      },
      () => {
        setError("دسترسی به موقعیت فعلی انجام نشد؛ شهر یا محله را دستی وارد کنید.")
        setStatus("idle")
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
    )
  }

  const submitSearch = (event?: FormEvent) => {
    event?.preventDefault()
    setError("")

    const normalizedService = parseNaturalSearch(service)
    if (!normalizedService) {
      setError("ابتدا خدمت موردنظر را انتخاب یا جست‌وجو کنید.")
      setMobileStep(1)
      return
    }
    if (!location.trim()) {
      setError("شهر، منطقه یا محله را وارد کنید.")
      setMobileStep(2)
      return
    }
    if (!isSupportedLocation(location)) {
      setError("این شهر هنوز تحت پوشش لوکس بیوتی نیست. می‌توانید شهر دیگری را انتخاب کنید.")
      setMobileStep(2)
      return
    }
    if (dateMode === "date" && !customDate) {
      setError("تاریخ موردنظر را انتخاب کنید.")
      setMobileStep(3)
      return
    }

    const nextRecent = [normalizedService, ...recentSearches.filter((item) => item !== normalizedService)].slice(0, 4)
    setRecentSearches(nextRecent)
    window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(nextRecent))
    window.localStorage.setItem(CITY_STORAGE_KEY, location)

    const params = new URLSearchParams()
    params.set("service", normalizedService)
    params.set("location", location)
    params.set("availability", dateMode)
    params.set("dayPart", dayPart)
    if (dateMode === "date") params.set("date", customDate)
    if (coordinates) {
      params.set("lat", coordinates.lat.toString())
      params.set("lng", coordinates.lng.toString())
    }

    setStatus("submitting")
    router.push(`/salons?${params.toString()}`)
  }

  const moveMobileForward = () => {
    setError("")
    if (mobileStep === 1 && !service.trim()) {
      setError("ابتدا خدمت موردنظر را انتخاب کنید.")
      return
    }
    if (mobileStep === 2 && !location.trim()) {
      setError("موقعیت موردنظر را وارد کنید.")
      return
    }
    setMobileStep((step) => Math.min(3, step + 1))
  }

  return (
    <div className="relative bg-background">
      <section className="relative isolate min-h-[620px] overflow-hidden pb-16 sm:min-h-[660px] lg:min-h-[min(720px,calc(100svh-4rem))] lg:pb-20">
        <div
          className="absolute inset-0 -z-30 bg-cover bg-[position:68%_center] sm:bg-center"
          style={{ backgroundImage: "url('/luxe-hero.svg')" }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(255,250,248,0.99)_0%,rgba(255,250,248,0.97)_34%,rgba(255,250,248,0.78)_54%,rgba(255,250,248,0.16)_76%,rgba(255,250,248,0.04)_100%)] max-lg:bg-[linear-gradient(90deg,rgba(255,250,248,0.98)_0%,rgba(255,250,248,0.92)_58%,rgba(255,250,248,0.42)_100%)] max-sm:bg-[linear-gradient(180deg,rgba(255,250,248,0.94)_0%,rgba(255,250,248,0.90)_100%)]"
          aria-hidden="true"
        />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_24%_12%,rgba(255,255,255,0.9),transparent_38%)]" aria-hidden="true" />

        <div className="mx-auto flex min-h-[590px] max-w-7xl items-center px-4 py-6 sm:px-6 lg:min-h-[650px] lg:px-8 lg:py-7">
          <div className="w-full lg:mr-auto lg:max-w-[790px]">
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-medium text-[#7b5147] sm:text-sm">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/75 px-3 py-1.5 shadow-sm backdrop-blur-md">
                <MapPin className="h-4 w-4 text-[#b76f5e]" />
                {location}
              </span>
              <button type="button" onClick={() => setMobileStep(2)} className="rounded-full px-2 py-1 hover:bg-white/60">
                تغییر شهر
              </button>
              <button type="button" onClick={useCurrentLocation} className="inline-flex items-center gap-1 rounded-full px-2 py-1 hover:bg-white/60">
                {status === "locating" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Crosshair className="h-3.5 w-3.5" />}
                موقعیت فعلی
              </button>
              <Link href="/salons?map=1" className="inline-flex items-center gap-1 rounded-full px-2 py-1 hover:bg-white/60">
                <Map className="h-3.5 w-3.5" />
                روی نقشه
              </Link>
            </div>

            <div className="max-w-[720px]">
              <h1 className="text-balance text-[2rem] font-black leading-[1.28] tracking-[-0.035em] text-[#34231f] sm:text-4xl lg:text-[2.75rem]">
                <span className="sm:hidden">خدمت زیبایی‌ات را پیدا کن و آنلاین نوبت بگیر</span>
                <span className="hidden sm:inline">بهترین سالن‌ها و متخصصان زیبایی را پیدا کن و آنلاین نوبت بگیر</span>
              </h1>
              <p className="mt-2.5 max-w-2xl text-sm leading-6 text-[#755d56] sm:text-base sm:leading-7">
                خدمات، قیمت‌ها، نمونه‌کارها و زمان‌های خالی را مقایسه کن؛ بدون تماس تلفنی رزرو انجام بده.
              </p>
            </div>

            <form onSubmit={submitSearch} className="mt-4 rounded-[24px] border border-white/80 bg-white/86 p-2.5 shadow-[0_22px_65px_rgba(96,57,46,0.16)] backdrop-blur-xl sm:p-3">
              <div className="hidden gap-2 md:grid md:grid-cols-[1.18fr_1fr_1fr_auto] md:items-stretch">
                <label className="relative flex min-w-0 items-center gap-2.5 rounded-2xl bg-[#faf5f2] px-3.5 py-2.5">
                  <Search className="h-5 w-5 shrink-0 text-[#b76f5e]" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-bold text-[#76564e]">چه خدمتی؟</span>
                    <input
                      value={service}
                      onChange={(event) => setService(event.target.value)}
                      onBlur={(event) => parseNaturalSearch(event.target.value)}
                      list="hero-service-suggestions"
                      placeholder="کراتین، کاشت ناخن..."
                      className="mt-0.5 w-full bg-transparent text-sm font-medium text-[#2f2522] outline-none placeholder:text-[#aa9891]"
                      autoComplete="off"
                    />
                  </span>
                </label>

                <label className="flex min-w-0 items-center gap-2.5 rounded-2xl bg-[#faf5f2] px-3.5 py-2.5">
                  <MapPin className="h-5 w-5 shrink-0 text-[#b76f5e]" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-bold text-[#76564e]">کجا؟</span>
                    <input
                      value={location}
                      onChange={(event) => setLocation(event.target.value)}
                      list="hero-city-suggestions"
                      placeholder="شهر، منطقه یا محله"
                      className="mt-0.5 w-full bg-transparent text-sm font-medium text-[#2f2522] outline-none placeholder:text-[#aa9891]"
                    />
                  </span>
                </label>

                <div className="flex min-w-0 items-center gap-2.5 rounded-2xl bg-[#faf5f2] px-3.5 py-2.5">
                  <CalendarDays className="h-5 w-5 shrink-0 text-[#b76f5e]" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-bold text-[#76564e]">چه زمانی؟</span>
                    <div className="mt-0.5 flex gap-1">
                      <select value={dateMode} onChange={(event) => setDateMode(event.target.value)} className="min-w-0 flex-1 bg-transparent text-xs font-medium text-[#2f2522] outline-none">
                        <option value="first-available">اولین نوبت خالی</option>
                        <option value="today">امروز</option>
                        <option value="tomorrow">فردا</option>
                        <option value="weekend">آخر هفته</option>
                        <option value="date">انتخاب تاریخ</option>
                      </select>
                      <select value={dayPart} onChange={(event) => setDayPart(event.target.value)} className="w-[62px] bg-transparent text-xs text-[#67524c] outline-none">
                        <option value="any">همه</option>
                        <option value="morning">صبح</option>
                        <option value="noon">ظهر</option>
                        <option value="evening">عصر</option>
                      </select>
                    </div>
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[#ae6655] px-5 text-sm font-black text-white shadow-[0_10px_24px_rgba(174,102,85,0.28)] hover:bg-[#9b594a] disabled:cursor-wait disabled:opacity-70"
                >
                  {status === "submitting" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                  مشاهده نوبت‌های خالی
                </button>
              </div>

              <div className="md:hidden">
                <div className="mb-2 flex items-center justify-between px-1 text-[11px] font-bold text-[#8a6c64]">
                  <span>مرحله {mobileStep} از ۳</span>
                  <div className="flex gap-1" aria-hidden="true">
                    {[1, 2, 3].map((step) => (
                      <span key={step} className={`h-1.5 w-8 rounded-full ${step <= mobileStep ? "bg-[#ae6655]" : "bg-[#eadbd6]"}`} />
                    ))}
                  </div>
                </div>

                {mobileStep === 1 && (
                  <label className="flex items-center gap-3 rounded-2xl bg-[#faf5f2] px-4 py-3.5">
                    <Search className="h-5 w-5 shrink-0 text-[#b76f5e]" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-bold text-[#76564e]">چه خدمتی می‌خواهی؟</span>
                      <input
                        value={service}
                        onChange={(event) => setService(event.target.value)}
                        onBlur={(event) => parseNaturalSearch(event.target.value)}
                        list="hero-service-suggestions"
                        placeholder="مثلاً کراتین در غرب تهران"
                        className="mt-1 w-full bg-transparent text-sm text-[#2f2522] outline-none placeholder:text-[#aa9891]"
                        autoFocus
                      />
                    </span>
                  </label>
                )}

                {mobileStep === 2 && (
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 rounded-2xl bg-[#faf5f2] px-4 py-3.5">
                      <MapPin className="h-5 w-5 shrink-0 text-[#b76f5e]" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-bold text-[#76564e]">کجا؟</span>
                        <input
                          value={location}
                          onChange={(event) => setLocation(event.target.value)}
                          list="hero-city-suggestions"
                          placeholder="شهر، منطقه یا محله"
                          className="mt-1 w-full bg-transparent text-sm text-[#2f2522] outline-none placeholder:text-[#aa9891]"
                          autoFocus
                        />
                      </span>
                    </label>
                    <div className="flex gap-2 overflow-x-auto pb-1 text-xs text-[#76564e]">
                      <button type="button" onClick={useCurrentLocation} className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#ead8d2] bg-white px-3 py-2">
                        <Crosshair className="h-3.5 w-3.5" /> موقعیت فعلی
                      </button>
                      <Link href="/salons?map=1" className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#ead8d2] bg-white px-3 py-2">
                        <Map className="h-3.5 w-3.5" /> انتخاب روی نقشه
                      </Link>
                    </div>
                  </div>
                )}

                {mobileStep === 3 && (
                  <div className="grid grid-cols-2 gap-2">
                    <label className="rounded-2xl bg-[#faf5f2] px-3.5 py-3">
                      <span className="block text-xs font-bold text-[#76564e]">روز</span>
                      <select value={dateMode} onChange={(event) => setDateMode(event.target.value)} className="mt-1 w-full bg-transparent text-sm text-[#2f2522] outline-none">
                        <option value="first-available">اولین نوبت خالی</option>
                        <option value="today">امروز</option>
                        <option value="tomorrow">فردا</option>
                        <option value="weekend">آخر هفته</option>
                        <option value="date">انتخاب تاریخ</option>
                      </select>
                    </label>
                    <label className="rounded-2xl bg-[#faf5f2] px-3.5 py-3">
                      <span className="block text-xs font-bold text-[#76564e]">بازه زمانی</span>
                      <select value={dayPart} onChange={(event) => setDayPart(event.target.value)} className="mt-1 w-full bg-transparent text-sm text-[#2f2522] outline-none">
                        <option value="any">هر زمانی</option>
                        <option value="morning">صبح</option>
                        <option value="noon">ظهر</option>
                        <option value="evening">عصر</option>
                      </select>
                    </label>
                  </div>
                )}

                {dateMode === "date" && mobileStep === 3 && (
                  <input
                    type="date"
                    value={customDate}
                    onChange={(event) => setCustomDate(event.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="mt-2 w-full rounded-2xl bg-[#faf5f2] px-4 py-3 text-sm text-[#2f2522] outline-none"
                  />
                )}

                <div className="mt-2 flex gap-2">
                  {mobileStep > 1 && (
                    <button type="button" onClick={() => setMobileStep((step) => Math.max(1, step - 1))} className="rounded-2xl border border-[#e4d1ca] bg-white px-4 py-3 text-sm font-bold text-[#76564e]">
                      بازگشت
                    </button>
                  )}
                  {mobileStep < 3 ? (
                    <button type="button" onClick={moveMobileForward} className="flex-1 rounded-2xl bg-[#ae6655] px-4 py-3 text-sm font-black text-white">
                      ادامه
                    </button>
                  ) : (
                    <button type="submit" className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#ae6655] px-4 py-3 text-sm font-black text-white">
                      <Search className="h-4 w-4" /> مشاهده نوبت‌های خالی
                    </button>
                  )}
                </div>
              </div>

              {dateMode === "date" && (
                <div className="mt-2 hidden justify-end md:flex">
                  <label className="inline-flex items-center gap-2 rounded-xl bg-[#faf5f2] px-3 py-2 text-xs font-medium text-[#76564e]">
                    تاریخ دقیق
                    <input type="date" value={customDate} onChange={(event) => setCustomDate(event.target.value)} min={new Date().toISOString().split("T")[0]} className="bg-transparent outline-none" />
                  </label>
                </div>
              )}
            </form>

            <datalist id="hero-service-suggestions">
              {services.map((item) => <option key={item} value={item} />)}
              {recentSearches.map((item) => <option key={`recent-${item}`} value={item} label="جست‌وجوی اخیر" />)}
            </datalist>
            <datalist id="hero-city-suggestions">
              {supportedCities.map((city) => <option key={city} value={city} />)}
              <option value="تهران، منطقه ۲۲" />
              <option value="غرب تهران" />
              <option value="شمال تهران" />
            </datalist>

            <div className="mt-2 min-h-5 px-1 text-xs font-medium text-[#76564e]" aria-live="polite">
              {error ? (
                <span className="text-[#a83e39]">{error}</span>
              ) : availabilityLoading ? (
                <span className="inline-flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin" /> در حال دریافت زمان‌های واقعی...</span>
              ) : availabilityMessage ? (
                <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-[#5c8b6c]" /> {availabilityMessage}</span>
              ) : (
                <span>زمان‌های واقعی و قیمت‌ها پس از جست‌وجو از اطلاعات ارائه‌دهندگان نمایش داده می‌شوند.</span>
              )}
            </div>

            <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {quickFilters.map((item) => {
                const Icon = item.icon
                return (
                  <Link key={item.label} href={item.href} className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/80 bg-white/72 px-3 py-1.5 text-xs font-bold text-[#694e47] shadow-sm backdrop-blur-md hover:bg-white">
                    <Icon className="h-3.5 w-3.5 text-[#b76f5e]" />
                    {item.label}
                  </Link>
                )
              })}
            </div>

            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-[11px] font-medium text-[#6d5750] sm:flex sm:flex-wrap sm:gap-x-4">
                {trustItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <span key={item.label} className="inline-flex items-center gap-1.5 whitespace-nowrap">
                      <Icon className="h-3.5 w-3.5 text-[#5d8a6a]" />
                      {item.label}
                    </span>
                  )
                })}
              </div>
              <Link href="/salons" className="hidden shrink-0 items-center gap-1 text-xs font-black text-[#9f5c4d] hover:text-[#82483c] sm:inline-flex">
                مشاهده خدمات <ChevronLeft className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        <svg className="absolute -bottom-px left-0 z-10 h-14 w-full sm:h-16 lg:h-20" viewBox="0 0 1440 96" preserveAspectRatio="none" aria-hidden="true">
          <path className="fill-background" d="M0 44C170 76 320 84 486 62C668 38 790 12 978 24C1152 35 1298 70 1440 54V96H0Z" />
        </svg>
      </section>
    </div>
  )
}
