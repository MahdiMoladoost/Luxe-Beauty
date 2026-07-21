"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react"
import { CalendarDays, Check, ChevronDown, Clock3, Crosshair, Loader2, Map, MapPin, Search } from "lucide-react"

const CITY_STORAGE_KEY = "luxe-beauty-selected-city"
const CITY_COOKIE_KEY = "luxe_beauty_city"
const CITY_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 10

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

const dateOptions = [
  { value: "first-available", label: "اولین نوبت خالی" },
  { value: "today", label: "امروز" },
  { value: "tomorrow", label: "فردا" },
  { value: "weekend", label: "آخر هفته" },
  { value: "date", label: "انتخاب تاریخ" },
]

const rangeOptions = [
  { value: "any", label: "همه بازه‌ها" },
  { value: "morning", label: "صبح" },
  { value: "noon", label: "ظهر" },
  { value: "evening", label: "عصر" },
]

type DropdownKey = "service" | "location" | "date" | "range"
type Option = { value: string; label: string }
type AvailabilitySummary = {
  message?: string
  availableCount?: number
  nearestTime?: string
  activeProviders?: number
}

function readSavedCity() {
  const entry = document.cookie.split("; ").find((item) => item.startsWith(`${CITY_COOKIE_KEY}=`))
  const cookieCity = entry ? decodeURIComponent(entry.slice(CITY_COOKIE_KEY.length + 1)) : ""
  return cookieCity || window.localStorage.getItem(CITY_STORAGE_KEY) || ""
}

function persistCity(city: string) {
  if (!city || city === "موقعیت فعلی") return
  document.cookie = `${CITY_COOKIE_KEY}=${encodeURIComponent(city)}; Max-Age=${CITY_COOKIE_MAX_AGE}; Path=/; SameSite=Lax`
  window.localStorage.setItem(CITY_STORAGE_KEY, city)
}

function availabilityText(summary: AvailabilitySummary | null) {
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

function HeroWave() {
  return (
    <svg viewBox="0 0 1440 140" className="block h-[64px] w-full sm:h-[76px] lg:h-[88px]" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 42C108 72 215 86 348 82C500 77 604 30 752 31C880 31 994 76 1130 88C1257 99 1360 88 1440 66V140H0V42Z" fill="var(--background)" />
    </svg>
  )
}

function DropdownField({
  icon,
  label,
  value,
  options,
  open,
  divider,
  onToggle,
  onSelect,
}: {
  icon: ReactNode
  label: string
  value: string
  options: Option[]
  open: boolean
  divider?: boolean
  onToggle: () => void
  onSelect: (value: string) => void
}) {
  const selected = options.find((option) => option.value === value)?.label || label

  return (
    <div className={`relative min-w-0 ${divider ? "border-r border-[#dfc9c0]/80" : ""}`}>
      <button
        type="button"
        dir="rtl"
        onClick={onToggle}
        aria-expanded={open}
        className="flex h-[62px] w-full items-center gap-3 px-4 text-right transition hover:bg-white/40 focus-visible:bg-white/55 focus-visible:outline-none sm:h-[66px] sm:px-5"
      >
        {icon}
        <span className={`min-w-0 flex-1 truncate text-sm font-bold ${value ? "text-[#302522]" : "text-[#654f48]"}`}>{selected}</span>
        <ChevronDown className={`h-[18px] w-[18px] shrink-0 text-[#6d5048] transition-transform ${open ? "rotate-180" : ""}`} strokeWidth={1.8} />
      </button>

      {open ? (
        <div className="absolute inset-x-2 top-[calc(100%+10px)] z-50 rounded-[22px] border border-white/80 bg-[#fffaf7]/95 p-2 shadow-[0_22px_55px_rgba(48,27,21,0.24)] backdrop-blur-xl">
          <p className="px-3 pb-1 pt-1 text-right text-[11px] font-bold text-[#936457]">{label}</p>
          <div className="max-h-64 overflow-y-auto">
            {options.map((option) => {
              const active = option.value === value
              return (
                <button
                  key={option.value}
                  type="button"
                  dir="rtl"
                  onClick={() => onSelect(option.value)}
                  className={`flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${active ? "bg-[#f2dfd7] text-[#884f42]" : "text-[#392c29] hover:bg-[#f9ece6]"}`}
                >
                  <span>{option.label}</span>
                  {active ? <Check className="h-4 w-4" /> : <span className="h-4 w-4" />}
                </button>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function BookingHero() {
  const router = useRouter()
  const dropdownRoot = useRef<HTMLDivElement | null>(null)
  const [service, setService] = useState("")
  const [location, setLocation] = useState("")
  const [dateMode, setDateMode] = useState("")
  const [dayPart, setDayPart] = useState("")
  const [customDate, setCustomDate] = useState("")
  const [openField, setOpenField] = useState<DropdownKey | null>(null)
  const [status, setStatus] = useState<"idle" | "locating" | "submitting">("idle")
  const [error, setError] = useState("")
  const [availability, setAvailability] = useState<AvailabilitySummary | null>(null)
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    const savedCity = readSavedCity()
    if (savedCity) setLocation(savedCity)
  }, [])

  useEffect(() => {
    persistCity(location)
  }, [location])

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (dropdownRoot.current && !dropdownRoot.current.contains(event.target as Node)) setOpenField(null)
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenField(null)
    }
    document.addEventListener("mousedown", close)
    document.addEventListener("keydown", escape)
    return () => {
      document.removeEventListener("mousedown", close)
      document.removeEventListener("keydown", escape)
    }
  }, [])

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

  const helperText = useMemo(() => availabilityText(availability), [availability])

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
        setError("دسترسی به موقعیت فعلی انجام نشد؛ شهر را دستی انتخاب کنید.")
        setStatus("idle")
      },
      { timeout: 8000, maximumAge: 300000 },
    )
  }

  const submitSearch = (event: FormEvent) => {
    event.preventDefault()
    setError("")
    if (!service) return setError("ابتدا خدمت موردنظر را انتخاب کنید.")
    if (!location) return setError("شهر موردنظر را انتخاب کنید.")
    if (!dateMode) return setError("زمان موردنظر را انتخاب کنید.")
    if (!dayPart) return setError("بازه زمانی را انتخاب کنید.")
    if (dateMode === "date" && !customDate) return setError("تاریخ موردنظر را انتخاب کنید.")

    persistCity(location)
    const params = new URLSearchParams({ service, location, availability: dateMode, dayPart })
    if (customDate && dateMode === "date") params.set("date", customDate)
    if (coordinates) {
      params.set("lat", coordinates.lat.toString())
      params.set("lng", coordinates.lng.toString())
    }
    setStatus("submitting")
    router.push(`/salons?${params.toString()}`)
  }

  return (
    <div className="relative bg-background">
      <section className="relative isolate h-[590px] overflow-visible sm:h-[620px] lg:h-[660px] xl:h-[690px]">
        <div
          className="absolute inset-0 -z-30 bg-cover bg-[position:center_58%] sm:bg-[position:center_62%] lg:bg-[position:center_65%]"
          style={{ backgroundImage: "url('/hero.png')" }}
          aria-hidden="true"
        />
        <div className="pointer-events-none absolute inset-0 -z-20 bg-[linear-gradient(180deg,rgba(51,27,22,0.03)_0%,rgba(51,27,22,0.10)_52%,rgba(51,27,22,0.22)_100%)]" aria-hidden="true" />

        <div className="relative z-20 mx-auto flex h-full max-w-7xl items-center justify-center px-4 pb-16 pt-8 sm:px-6 sm:pb-20 lg:px-8 lg:pb-24">
          <form
            onSubmit={submitSearch}
            className="w-full max-w-6xl rounded-[30px] border border-white/60 bg-white/40 p-3 shadow-[0_32px_85px_rgba(48,27,21,0.28),0_8px_28px_rgba(48,27,21,0.13)] backdrop-blur-2xl backdrop-saturate-150 sm:p-4"
          >
            <div ref={dropdownRoot} className="grid overflow-visible rounded-2xl border border-white/70 bg-white/75 shadow-[0_7px_24px_rgba(56,34,28,0.10)] md:grid-cols-4">
              <DropdownField icon={<Search className="h-[18px] w-[18px] shrink-0 text-[#a85f4f]" strokeWidth={1.8} />} label="انتخاب خدمت" value={service} options={services.map((item) => ({ value: item, label: item }))} open={openField === "service"} onToggle={() => setOpenField(openField === "service" ? null : "service")} onSelect={(value) => { setService(value); setOpenField(null) }} />
              <DropdownField divider icon={<MapPin className="h-[18px] w-[18px] shrink-0 text-[#a85f4f]" strokeWidth={1.8} />} label="انتخاب شهر" value={location} options={supportedCities.map((item) => ({ value: item, label: item }))} open={openField === "location"} onToggle={() => setOpenField(openField === "location" ? null : "location")} onSelect={(value) => { setLocation(value); setOpenField(null) }} />
              <DropdownField divider icon={<CalendarDays className="h-[18px] w-[18px] shrink-0 text-[#a85f4f]" strokeWidth={1.8} />} label="انتخاب زمان" value={dateMode} options={dateOptions} open={openField === "date"} onToggle={() => setOpenField(openField === "date" ? null : "date")} onSelect={(value) => { setDateMode(value); setOpenField(null) }} />
              <DropdownField divider icon={<Clock3 className="h-[18px] w-[18px] shrink-0 text-[#a85f4f]" strokeWidth={1.8} />} label="انتخاب بازه" value={dayPart} options={rangeOptions} open={openField === "range"} onToggle={() => setOpenField(openField === "range" ? null : "range")} onSelect={(value) => { setDayPart(value); setOpenField(null) }} />
            </div>

            {dateMode === "date" ? (
              <div className="mt-2 rounded-2xl border border-white/70 bg-white/75 px-4 py-3">
                <label className="flex items-center gap-3 text-sm font-bold text-[#59443e]">
                  <span>انتخاب تاریخ</span>
                  <input type="date" value={customDate} onChange={(event) => setCustomDate(event.target.value)} className="min-w-0 flex-1 bg-transparent text-[#302522] outline-none" />
                </label>
              </div>
            ) : null}

            <div className="mt-2 grid gap-2.5 md:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
              <button type="submit" disabled={status === "submitting"} className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#ae6655] px-5 text-sm font-bold text-white shadow-[0_10px_26px_rgba(71,36,28,0.25)] transition hover:-translate-y-0.5 hover:bg-[#985545] disabled:opacity-70">
                {status === "submitting" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                مشاهده نوبت‌های خالی
              </button>
              <Link href="/salons" className="inline-flex h-12 items-center justify-center rounded-2xl border border-[#b87362]/80 bg-white/55 px-5 text-sm font-bold text-[#75483e] transition hover:bg-white/75">مشاهده خدمات</Link>
            </div>

            <div className="mt-2 flex flex-col gap-2 rounded-2xl border border-white/65 bg-white/65 px-4 py-2.5 text-[13px] font-medium leading-6 text-[#493a36] sm:flex-row sm:items-center sm:justify-between">
              <span>{availabilityLoading ? "در حال دریافت زمان‌های واقعی..." : helperText || "زمان‌ها و قیمت‌های واقعی پس از جست‌وجو نمایش داده می‌شوند."}</span>
              <span className="flex shrink-0 gap-2">
                <button type="button" onClick={useCurrentLocation} className="inline-flex items-center gap-1.5 font-bold text-[#845246]">
                  {status === "locating" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />}
                  موقعیت فعلی
                </button>
                <Link href="/salons?map=1" className="inline-flex items-center gap-1.5 font-bold text-[#845246]"><Map className="h-4 w-4" />روی نقشه</Link>
              </span>
            </div>

            {error ? <p className="mt-2 text-sm font-bold text-rose-700">{error}</p> : null}
          </form>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-[-1px] z-0 leading-none"><HeroWave /></div>
      </section>
    </div>
  )
}
