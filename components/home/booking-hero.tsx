"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react"
import {
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Crosshair,
  Headphones,
  Loader2,
  LocateFixed,
  Map,
  MapPin,
  Search,
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

function FieldShell({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl border border-[#eadbd4] bg-[#fffaf7]/95 px-4 py-3">{children}</div>
}

function HeroWave() {
  return (
    <svg viewBox="0 0 1440 140" className="block h-[92px] w-full sm:h-[112px]" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 42C108 72 215 86 348 82C500 77 604 30 752 31C880 31 994 76 1130 88C1257 99 1360 88 1440 66V140H0V42Z" fill="var(--background)" />
    </svg>
  )
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
    const timer = window.setTimeout(async () => {
      setAvailabilityLoading(true)
      try {
        const response = await fetch(`/api/availability/summary?city=${encodeURIComponent(location)}`, {
          signal: controller.signal,
          cache: "no-store",
        })
        if (!response.ok) throw new Error("availability-unavailable")
        setAvailability((await response.json()) as AvailabilitySummary)
      } catch (fetchError) {
        if ((fetchError as Error).name !== "AbortError") setAvailability(null)
      } finally {
        setAvailabilityLoading(false)
      }
    }, 350)
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
    const params = new URLSearchParams({ service: normalizedService, location, availability: dateMode, dayPart })
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

  const mobileStepTitle = mobileStep === 1 ? "انتخاب خدمت" : mobileStep === 2 ? "انتخاب موقعیت" : "انتخاب زمان"

  return (
    <div className="relative overflow-hidden bg-background">
      <section className="relative isolate min-h-[650px] overflow-hidden pb-16 sm:min-h-[690px] lg:min-h-[min(760px,calc(100svh-4rem))] lg:pb-20">
        <div
          className="absolute inset-0 -z-30 bg-cover bg-[position:center_36%] sm:bg-[position:center_38%] lg:bg-[position:center_42%]"
          style={{ backgroundImage: "url('/luxe-hero.svg')" }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(255,249,246,0.02)_0%,rgba(255,249,246,0.08)_28%,rgba(255,249,246,0.54)_58%,rgba(255,249,246,0.90)_78%,rgba(255,249,246,0.98)_100%)] max-lg:bg-[linear-gradient(90deg,rgba(255,249,246,0.08)_0%,rgba(255,249,246,0.25)_36%,rgba(255,249,246,0.86)_78%,rgba(255,249,246,0.98)_100%)] max-sm:bg-[linear-gradient(180deg,rgba(255,249,246,0.82)_0%,rgba(255,249,246,0.94)_56%,rgba(255,249,246,0.98)_100%)]"
          aria-hidden="true"
        />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_78%_20%,rgba(255,255,255,0.48),transparent_38%)]" aria-hidden="true" />

        <div className="relative mx-auto flex min-h-[610px] max-w-7xl items-center px-4 py-7 sm:min-h-[645px] sm:px-6 lg:min-h-[690px] lg:px-8 lg:py-8">
          <div className="ml-auto w-full text-right lg:max-w-[790px]">
            <div className="flex flex-wrap items-center justify-start gap-2 text-xs font-semibold text-[#7d594f] sm:text-sm">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/78 px-3 py-1.5 shadow-sm backdrop-blur-md">
                <MapPin className="h-4 w-4 text-[#b76f5e]" />
                {location}
              </span>
              <button type="button" onClick={() => setMobileStep(2)} className="rounded-full px-2 py-1 transition hover:bg-white/70">تغییر شهر</button>
              <button type="button" onClick={useCurrentLocation} className="inline-flex items-center gap-1 rounded-full px-2 py-1 transition hover:bg-white/70">
                {status === "locating" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Crosshair className="h-3.5 w-3.5" />}
                موقعیت فعلی
              </button>
              <Link href="/salons?map=1" className="inline-flex items-center gap-1 rounded-full px-2 py-1 transition hover:bg-white/70">
                <Map className="h-3.5 w-3.5" />
                روی نقشه
              </Link>
            </div>

            <div className="mt-4 max-w-[700px]">
              <h1 className="text-balance text-[2rem] font-black leading-[1.18] tracking-[-0.04em] text-[#372521] sm:text-[2.55rem] lg:text-[3.35rem] lg:leading-[1.09]">
                <span className="sm:hidden">خدمت زیبایی‌ات را پیدا کن و آنلاین نوبت بگیر</span>
                <span className="hidden sm:inline">بهترین سالن‌ها و متخصصان زیبایی را پیدا کن و آنلاین نوبت بگیر</span>
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#755d56] sm:text-base">خدمات، قیمت‌ها، نمونه‌کارها و زمان‌های خالی را مقایسه کن؛ بدون تماس تلفنی رزرو انجام بده.</p>
            </div>

            <form onSubmit={submitSearch} className="mt-5 rounded-[28px] border border-white/80 bg-white/88 p-3 shadow-[0_24px_80px_rgba(97,57,46,0.16)] backdrop-blur-xl sm:p-4">
              <div className="hidden gap-3 md:grid md:grid-cols-3">
                <FieldShell>
                  <label className="flex items-start gap-3"><Search className="mt-1 h-5 w-5 shrink-0 text-[#b76f5e]" /><span className="min-w-0 flex-1"><span className="block text-[11px] font-black text-[#81584d]">چه خدمتی؟</span><input value={service} onChange={(event) => setService(event.target.value)} onBlur={(event) => parseNaturalSearch(event.target.value)} list="hero-service-suggestions" placeholder="کراتین، کاشت ناخن..." className="mt-1 w-full bg-transparent text-sm font-semibold text-[#2f2522] outline-none placeholder:text-[#ad9992]" autoComplete="off" /></span></label>
                </FieldShell>
                <FieldShell>
                  <label className="flex items-start gap-3"><MapPin className="mt-1 h-5 w-5 shrink-0 text-[#b76f5e]" /><span className="min-w-0 flex-1"><span className="block text-[11px] font-black text-[#81584d]">کجا؟</span><input value={location} onChange={(event) => setLocation(event.target.value)} list="hero-city-suggestions" placeholder="شهر، منطقه یا محله" className="mt-1 w-full bg-transparent text-sm font-semibold text-[#2f2522] outline-none placeholder:text-[#ad9992]" /></span></label>
                </FieldShell>
                <FieldShell>
                  <div className="flex items-start gap-3"><CalendarDays className="mt-1 h-5 w-5 shrink-0 text-[#b76f5e]" /><span className="min-w-0 flex-1"><span className="block text-[11px] font-black text-[#81584d]">چه زمانی؟</span><div className="mt-1 flex items-center gap-2"><select value={dateMode} onChange={(event) => setDateMode(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#2f2522] outline-none"><option value="first-available">اولین نوبت خالی</option><option value="today">امروز</option><option value="tomorrow">فردا</option><option value="weekend">آخر هفته</option><option value="date">انتخاب تاریخ</option></select><select value={dayPart} onChange={(event) => setDayPart(event.target.value)} className="w-20 bg-transparent text-xs font-medium text-[#6e5550] outline-none"><option value="any">همه</option><option value="morning">صبح</option><option value="noon">ظهر</option><option value="evening">عصر</option></select></div></span></div>
                </FieldShell>
              </div>

              <div className="md:hidden">
                <div className="mb-3 flex items-center justify-between rounded-2xl bg-[#fcf8f6] px-3 py-2 text-xs font-bold text-[#8b665d]"><span>مرحله {mobileStep} از ۳</span><span>{mobileStepTitle}</span></div>
                {mobileStep === 1 && <FieldShell><label className="flex items-start gap-3"><Search className="mt-1 h-5 w-5 shrink-0 text-[#b76f5e]" /><span className="min-w-0 flex-1"><span className="block text-[11px] font-black text-[#81584d]">چه خدمتی؟</span><input value={service} onChange={(event) => setService(event.target.value)} onBlur={(event) => parseNaturalSearch(event.target.value)} list="hero-service-suggestions" placeholder="مثلاً کراتین در غرب تهران" className="mt-1 w-full bg-transparent text-sm font-semibold text-[#2f2522] outline-none placeholder:text-[#ad9992]" autoComplete="off" /></span></label></FieldShell>}
                {mobileStep === 2 && <div className="space-y-3"><FieldShell><label className="flex items-start gap-3"><MapPin className="mt-1 h-5 w-5 shrink-0 text-[#b76f5e]" /><span className="min-w-0 flex-1"><span className="block text-[11px] font-black text-[#81584d]">کجا؟</span><input value={location} onChange={(event) => setLocation(event.target.value)} list="hero-city-suggestions" placeholder="شهر، منطقه یا محله" className="mt-1 w-full bg-transparent text-sm font-semibold text-[#2f2522] outline-none placeholder:text-[#ad9992]" /></span></label></FieldShell><div className="flex gap-2"><button type="button" onClick={useCurrentLocation} className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-[#ead5cc] bg-white px-4 py-3 text-sm font-semibold text-[#7d594f]">{status === "locating" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />}موقعیت فعلی</button><Link href="/salons?map=1" className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-[#ead5cc] bg-white px-4 py-3 text-sm font-semibold text-[#7d594f]"><Map className="h-4 w-4" />روی نقشه</Link></div></div>}
                {mobileStep === 3 && <div className="space-y-3"><FieldShell><span className="mb-2 block text-[11px] font-black text-[#81584d]">چه زمانی؟</span><select value={dateMode} onChange={(event) => setDateMode(event.target.value)} className="w-full bg-transparent text-sm font-semibold text-[#2f2522] outline-none"><option value="first-available">اولین نوبت خالی</option><option value="today">امروز</option><option value="tomorrow">فردا</option><option value="weekend">آخر هفته</option><option value="date">انتخاب تاریخ</option></select></FieldShell><FieldShell><span className="mb-2 block text-[11px] font-black text-[#81584d]">صبح، ظهر یا عصر</span><select value={dayPart} onChange={(event) => setDayPart(event.target.value)} className="w-full bg-transparent text-sm font-semibold text-[#2f2522] outline-none"><option value="any">همه بازه‌ها</option><option value="morning">صبح</option><option value="noon">ظهر</option><option value="evening">عصر</option></select></FieldShell></div>}
                <div className="mt-3 flex gap-2">{mobileStep > 1 && <button type="button" onClick={() => setMobileStep((step) => Math.max(1, step - 1))} className="inline-flex items-center justify-center rounded-2xl border border-[#ead5cc] bg-white/90 px-4 py-3 text-sm font-semibold text-[#7d594f]"><ChevronDown className="h-4 w-4 rotate-90" /></button>}{mobileStep < 3 ? <button type="button" onClick={moveMobileForward} className="inline-flex flex-1 items-center justify-center rounded-2xl bg-[#ae6655] px-5 py-3 text-sm font-black text-white shadow-[0_12px_30px_rgba(174,102,85,0.28)]">مرحله بعد</button> : <button type="submit" disabled={status === "submitting"} className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#ae6655] px-5 py-3 text-sm font-black text-white shadow-[0_12px_30px_rgba(174,102,85,0.28)] disabled:cursor-wait disabled:opacity-70">{status === "submitting" && <Loader2 className="h-4 w-4 animate-spin" />}مشاهده نوبت‌های خالی</button>}</div>
              </div>

              <div className="mt-3 hidden items-center gap-3 md:flex">{dateMode === "date" && <FieldShell><label className="flex items-center gap-2 text-sm font-semibold text-[#6e5550]"><span>تاریخ</span><input type="date" value={customDate} onChange={(event) => setCustomDate(event.target.value)} className="bg-transparent text-[#2f2522] outline-none" /></label></FieldShell>}<button type="submit" disabled={status === "submitting"} className="inline-flex min-h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#ae6655] px-5 text-sm font-black text-white shadow-[0_12px_30px_rgba(174,102,85,0.28)] transition hover:bg-[#985545] disabled:cursor-wait disabled:opacity-70">{status === "submitting" && <Loader2 className="h-4 w-4 animate-spin" />}مشاهده نوبت‌های خالی</button><Link href="/salons" className="inline-flex min-h-14 shrink-0 items-center justify-center rounded-2xl border border-[#e5cec5] bg-white/72 px-5 text-sm font-bold text-[#7d594f] transition hover:bg-white">مشاهده خدمات</Link></div>
              {dateMode === "date" && mobileStep === 3 && <div className="mt-3 md:hidden"><FieldShell><span className="mb-2 block text-[11px] font-black text-[#81584d]">انتخاب تاریخ</span><input type="date" value={customDate} onChange={(event) => setCustomDate(event.target.value)} className="w-full bg-transparent text-sm font-semibold text-[#2f2522] outline-none" /></FieldShell></div>}
              <div className="mt-3 rounded-2xl bg-[#fffaf7]/82 px-4 py-3 text-xs leading-6 text-[#7b625a] backdrop-blur-sm">{availabilityLoading ? <span className="inline-flex items-center gap-2 font-semibold text-[#7d594f]"><Loader2 className="h-4 w-4 animate-spin" />در حال دریافت زمان‌های واقعی...</span> : availabilityMessage ? <span>{availabilityMessage}</span> : <span>زمان‌های واقعی و قیمت‌ها پس از جست‌وجو از اطلاعات ارائه‌دهندگان نمایش داده می‌شوند.</span>}</div>
              {error ? <p className="mt-3 text-sm font-semibold text-rose-700">{error}</p> : null}
              {recentSearches.length > 0 && <div className="mt-4"><div className="mb-2 text-xs font-bold text-[#8f6d63]">جست‌وجوهای اخیر</div><div className="flex flex-wrap gap-2">{recentSearches.map((item) => <button key={item} type="button" onClick={() => setService(item)} className="rounded-full border border-[#ead7d0] bg-white/88 px-3 py-1.5 text-xs font-semibold text-[#7f5a50] transition hover:border-[#d1a497] hover:text-[#ae6655]">{item}</button>)}</div></div>}
              <div className="mt-4 overflow-x-auto pb-1"><div className="flex w-max min-w-full gap-2">{quickFilters.map((filter) => { const Icon = filter.icon; return <Link key={filter.label} href={filter.href} className="inline-flex items-center gap-2 rounded-full border border-[#ead7d0] bg-white/88 px-3.5 py-2 text-xs font-semibold text-[#6c514b] backdrop-blur-sm transition hover:border-[#d6ad9f] hover:bg-white hover:text-[#ae6655]"><Icon className="h-4 w-4" />{filter.label}</Link> })}</div></div>
            </form>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3 text-xs font-semibold text-[#6d5a54] sm:text-sm">{trustItems.map((item) => { const Icon = item.icon; return <div key={item.label} className="inline-flex items-center gap-2 rounded-full bg-white/62 px-3 py-1.5 backdrop-blur-sm"><Icon className="h-4 w-4 text-[#5e9d76]" />{item.label}</div> })}</div>
            <div className="mt-4 flex md:hidden"><Link href="/salons" className="inline-flex items-center gap-2 text-sm font-bold text-[#9c5849]">مشاهده خدمات</Link></div>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-[44%]"><HeroWave /></div>
      </section>

      <datalist id="hero-service-suggestions">{services.map((item) => <option key={item} value={item} />)}</datalist>
      <datalist id="hero-city-suggestions">{supportedCities.map((item) => <option key={item} value={item} />)}</datalist>
    </div>
  )
}
