"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react"
import { CalendarDays, Check, ChevronDown, Clock3, Crosshair, Loader2, Map, MapPin, Search } from "lucide-react"

const CITY_STORAGE_KEY = "luxe-beauty-selected-city"

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

const dateModeOptions = [
  { value: "first-available", label: "اولین نوبت خالی" },
  { value: "today", label: "امروز" },
  { value: "tomorrow", label: "فردا" },
  { value: "weekend", label: "آخر هفته" },
  { value: "date", label: "انتخاب تاریخ" },
]

const dayPartOptions = [
  { value: "any", label: "همه" },
  { value: "morning", label: "صبح" },
  { value: "noon", label: "ظهر" },
  { value: "evening", label: "عصر" },
]

const typoCorrections: Record<string, string> = {
  کراتینن: "کراتین",
  کراتینه: "کراتین",
  ناخون: "ناخن",
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

type DropdownKey = "service" | "location" | "dateMode" | "dayPart"
type Option = { value: string; label: string }

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
  return (
    <div className="rounded-2xl border border-[#d8c1b7] bg-white px-4 py-3 shadow-[0_1px_0_rgba(58,37,31,0.03)] transition focus-within:border-[#b76f5e] focus-within:shadow-[0_0_0_3px_rgba(183,111,94,0.12)]">
      {children}
    </div>
  )
}

function HeroWave() {
  return (
    <svg viewBox="0 0 1440 140" className="block h-[58px] w-full sm:h-[68px] lg:h-[76px]" preserveAspectRatio="none" aria-hidden="true">
      <path
        d="M0 42C108 72 215 86 348 82C500 77 604 30 752 31C880 31 994 76 1130 88C1257 99 1360 88 1440 66V140H0V42Z"
        fill="var(--background)"
      />
    </svg>
  )
}

function DesktopDropdownField({
  icon,
  value,
  placeholder,
  open,
  options,
  divider = false,
  onToggle,
  onSelect,
}: {
  icon: ReactNode
  value: string
  placeholder: string
  open: boolean
  options: Option[]
  divider?: boolean
  onToggle: () => void
  onSelect: (value: string) => void
}) {
  const selectedLabel = options.find((option) => option.value === value)?.label ?? placeholder

  return (
    <div className={`relative min-w-0 ${divider ? "border-r border-[#eadbd4]" : ""}`}>
      <button
        type="button"
        dir="rtl"
        onClick={onToggle}
        aria-expanded={open}
        className="group flex min-h-[64px] w-full items-center gap-3 px-5 text-right transition focus:outline-none focus-visible:bg-[#fff7f3]"
      >
        {icon}
        <span className={`min-w-0 flex-1 truncate text-sm font-bold ${value ? "text-[#2f2522]" : "text-[#6c5750]"}`}>
          {selectedLabel}
        </span>
        <ChevronDown className={`h-[18px] w-[18px] shrink-0 text-[#6c4e46] transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div className="absolute inset-x-2 top-[calc(100%+10px)] z-50 rounded-[22px] border border-[#dbc5bc] bg-[#fffdfa] p-2 shadow-[0_20px_48px_rgba(54,35,30,0.16)] backdrop-blur-sm">
          <div className="mb-1 px-3 py-1 text-right text-[11px] font-bold text-[#8a6258]">{placeholder}</div>
          <div className="max-h-64 overflow-y-auto">
            {options.map((option) => {
              const active = option.value === value

              return (
                <button
                  key={option.value}
                  type="button"
                  dir="rtl"
                  onClick={() => onSelect(option.value)}
                  className={`flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
                    active ? "bg-[#f6ece7] text-[#8c5244]" : "text-[#3a2d2a] hover:bg-[#fbf2ed]"
                  }`}
                >
                  <span>{option.label}</span>
                  {active ? <Check className="h-4 w-4 shrink-0" /> : <span className="h-4 w-4 shrink-0" aria-hidden="true" />}
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
  const desktopFieldsRef = useRef<HTMLDivElement | null>(null)
  const [service, setService] = useState("")
  const [location, setLocation] = useState("")
  const [dateMode, setDateMode] = useState("")
  const [dayPart, setDayPart] = useState("")
  const [customDate, setCustomDate] = useState("")
  const [mobileStep, setMobileStep] = useState(1)
  const [status, setStatus] = useState<"idle" | "locating" | "submitting">("idle")
  const [error, setError] = useState("")
  const [availability, setAvailability] = useState<AvailabilitySummary | null>(null)
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [openField, setOpenField] = useState<DropdownKey | null>(null)

  useEffect(() => {
    if (location) window.localStorage.setItem(CITY_STORAGE_KEY, location)
  }, [location])

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (desktopFieldsRef.current && !desktopFieldsRef.current.contains(event.target as Node)) {
        setOpenField(null)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenField(null)
    }

    document.addEventListener("mousedown", handlePointerDown)
    document.addEventListener("keydown", handleEscape)

    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
      document.removeEventListener("keydown", handleEscape)
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

    window.localStorage.setItem(CITY_STORAGE_KEY, location)

    const params = new URLSearchParams({
      service: normalizedService,
      location,
      availability: dateMode || "first-available",
      dayPart: dayPart || "any",
    })

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
  const mobileInputClassName =
    "mt-1 w-full bg-transparent text-sm font-semibold text-[#302523] outline-none placeholder:text-[#6a5751] placeholder:opacity-100"

  return (
    <div className="relative bg-background pb-[235px] sm:pb-[190px] lg:pb-[145px]">
      <section className="relative isolate h-[350px] overflow-visible sm:h-[390px] lg:h-[425px]">
        <div
          className="absolute inset-0 -z-30 bg-cover bg-[position:center_58%] sm:bg-[position:center_62%] lg:bg-[position:center_66%]"
          style={{ backgroundImage: "url('/hero.png')" }}
          aria-hidden="true"
        />

        <div
          className="pointer-events-none absolute inset-y-0 right-0 -z-20 w-full bg-[linear-gradient(270deg,rgba(255,249,246,0.80)_0%,rgba(255,249,246,0.58)_30%,rgba(255,249,246,0.14)_58%,transparent_76%)] sm:w-[76%] lg:w-[62%]"
          aria-hidden="true"
        />

        <div className="relative z-10 mx-auto flex h-full max-w-7xl items-start justify-end px-4 pt-10 sm:px-6 sm:pt-12 lg:px-8 lg:pt-14">
          <div className="w-full max-w-[650px] text-right">
            <h1 dir="rtl" className="font-sans font-extrabold tracking-[-0.03em] text-[#342421]">
              <span className="block text-[2.35rem] leading-[1.05] text-[#8a5648] sm:text-[3.1rem] lg:text-[4.35rem]">لوکس بیوتی</span>
              <span className="mt-3 block text-[1.2rem] leading-[1.65] text-[#342421] sm:text-[1.55rem] lg:text-[2rem]">
                انتخاب بهترین آرایشگاه برای شما
              </span>
            </h1>
            <p className="mt-3 max-w-[500px] text-sm font-medium leading-7 text-[#5f4a44] sm:text-base">
              سالن‌ها و متخصصان منتخب را یک‌جا ببینید، مقایسه کنید و با خیال راحت آنلاین نوبت بگیرید.
            </p>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-[-1px] z-0 leading-none">
          <HeroWave />
        </div>

        <div className="absolute inset-x-0 bottom-[40px] z-20 translate-y-1/2 px-4 sm:bottom-[48px] sm:px-6 lg:bottom-[56px] lg:px-8">
          <form
            onSubmit={submitSearch}
            className="mx-auto max-w-6xl rounded-[30px] border border-[#d9c1b6] bg-[#fffaf7] p-3 shadow-[0_28px_74px_rgba(54,35,30,0.18),0_8px_22px_rgba(54,35,30,0.08)]"
          >
            <div ref={desktopFieldsRef} className="hidden overflow-visible rounded-2xl border border-[#d8c1b7] bg-white shadow-[0_2px_10px_rgba(65,42,34,0.05)] md:grid md:grid-cols-4">
              <DesktopDropdownField
                icon={<Search className="h-[18px] w-[18px] shrink-0 text-[#a85f4f]" />}
                value={service}
                placeholder="انتخاب خدمت"
                open={openField === "service"}
                options={services.map((item) => ({ value: item, label: item }))}
                onToggle={() => setOpenField((field) => (field === "service" ? null : "service"))}
                onSelect={(value) => {
                  setService(value)
                  setOpenField(null)
                }}
              />

              <DesktopDropdownField
                divider
                icon={<MapPin className="h-[18px] w-[18px] shrink-0 text-[#a85f4f]" />}
                value={location}
                placeholder="انتخاب شهر"
                open={openField === "location"}
                options={supportedCities.map((item) => ({ value: item, label: item }))}
                onToggle={() => setOpenField((field) => (field === "location" ? null : "location"))}
                onSelect={(value) => {
                  setLocation(value)
                  setOpenField(null)
                }}
              />

              <DesktopDropdownField
                divider
                icon={<CalendarDays className="h-[18px] w-[18px] shrink-0 text-[#a85f4f]" />}
                value={dateMode}
                placeholder="انتخاب زمان"
                open={openField === "dateMode"}
                options={dateModeOptions}
                onToggle={() => setOpenField((field) => (field === "dateMode" ? null : "dateMode"))}
                onSelect={(value) => {
                  setDateMode(value)
                  setOpenField(null)
                }}
              />

              <DesktopDropdownField
                divider
                icon={<Clock3 className="h-[18px] w-[18px] shrink-0 text-[#a85f4f]" />}
                value={dayPart}
                placeholder="انتخاب بازه"
                open={openField === "dayPart"}
                options={dayPartOptions}
                onToggle={() => setOpenField((field) => (field === "dayPart" ? null : "dayPart"))}
                onSelect={(value) => {
                  setDayPart(value)
                  setOpenField(null)
                }}
              />
            </div>

            <div className="md:hidden">
              <div className="mb-3 flex items-center justify-between rounded-2xl bg-[#f6ece7] px-3 py-2 text-xs font-bold text-[#704f47]">
                <span>مرحله {mobileStep} از ۳</span>
                <span>{mobileStepTitle}</span>
              </div>

              {mobileStep === 1 && (
                <FieldShell>
                  <label className="flex items-start gap-3">
                    <Search className="mt-1 h-5 w-5 shrink-0 text-[#a85f4f]" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[11px] font-bold text-[#704b42]">چه خدمتی؟</span>
                      <input
                        value={service}
                        onChange={(event) => setService(event.target.value)}
                        onBlur={(event) => parseNaturalSearch(event.target.value)}
                        list="hero-service-suggestions"
                        placeholder="نام خدمت را بنویسید"
                        className={mobileInputClassName}
                        autoComplete="off"
                      />
                    </span>
                  </label>
                </FieldShell>
              )}

              {mobileStep === 2 && (
                <div className="space-y-3">
                  <FieldShell>
                    <label className="flex items-start gap-3">
                      <MapPin className="mt-1 h-5 w-5 shrink-0 text-[#a85f4f]" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[11px] font-bold text-[#704b42]">کجا؟</span>
                        <input
                          value={location}
                          onChange={(event) => setLocation(event.target.value)}
                          list="hero-city-suggestions"
                          placeholder="شهر، منطقه یا محله"
                          className={mobileInputClassName}
                        />
                      </span>
                    </label>
                  </FieldShell>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={useCurrentLocation}
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-[#d9c2b8] bg-white px-3 text-sm font-semibold leading-none text-[#684b44]"
                    >
                      {status === "locating" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />}
                      موقعیت فعلی
                    </button>
                    <Link
                      href="/salons?map=1"
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-[#d9c2b8] bg-white px-3 text-sm font-semibold leading-none text-[#684b44]"
                    >
                      <Map className="h-4 w-4" />
                      روی نقشه
                    </Link>
                  </div>
                </div>
              )}

              {mobileStep === 3 && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <FieldShell>
                    <label className="flex items-center gap-3">
                      <CalendarDays className="h-5 w-5 shrink-0 text-[#a85f4f]" />
                      <span className="shrink-0 text-xs font-bold text-[#704b42]">زمان</span>
                      <select
                        value={dateMode}
                        onChange={(event) => setDateMode(event.target.value)}
                        className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#312725] outline-none"
                      >
                        <option value="">انتخاب زمان</option>
                        {dateModeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </FieldShell>

                  <FieldShell>
                    <label className="flex items-center gap-3">
                      <Clock3 className="h-5 w-5 shrink-0 text-[#a85f4f]" />
                      <span className="shrink-0 text-xs font-bold text-[#704b42]">بازه</span>
                      <select
                        value={dayPart}
                        onChange={(event) => setDayPart(event.target.value)}
                        className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#312725] outline-none"
                      >
                        <option value="">انتخاب بازه</option>
                        {dayPartOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </FieldShell>
                </div>
              )}

              <div className="mt-3 flex gap-2">
                {mobileStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setMobileStep((step) => Math.max(1, step - 1))}
                    className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#d9c2b8] bg-white text-[#684b44]"
                    aria-label="مرحله قبل"
                  >
                    <ChevronDown className="h-4 w-4 rotate-90" />
                  </button>
                )}

                {mobileStep < 3 ? (
                  <button
                    type="button"
                    onClick={moveMobileForward}
                    className="inline-flex h-12 flex-1 items-center justify-center rounded-2xl bg-[#ae6655] px-5 text-sm font-bold leading-none text-white shadow-[0_10px_26px_rgba(174,102,85,0.24)]"
                  >
                    مرحله بعد
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={status === "submitting"}
                    className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#ae6655] px-5 text-sm font-bold leading-none text-white shadow-[0_10px_26px_rgba(174,102,85,0.24)] disabled:cursor-wait disabled:opacity-70"
                  >
                    {status === "submitting" && <Loader2 className="h-4 w-4 animate-spin" />}
                    مشاهده نوبت‌های خالی
                  </button>
                )}
              </div>
            </div>

            {dateMode === "date" && (
              <div className="mt-2 md:grid md:grid-cols-4">
                <div className="md:col-start-2 md:col-span-2">
                  <FieldShell>
                    <label className="flex items-center gap-3 text-sm font-semibold text-[#5f4943]">
                      <span className="shrink-0">انتخاب تاریخ</span>
                      <input
                        type="date"
                        value={customDate}
                        onChange={(event) => setCustomDate(event.target.value)}
                        className="min-w-0 flex-1 bg-transparent text-[#312725] outline-none"
                      />
                    </label>
                  </FieldShell>
                </div>
              </div>
            )}

            <div className="mt-2 hidden grid-cols-2 gap-2.5 md:grid">
              <button
                type="submit"
                disabled={status === "submitting"}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#ae6655] px-5 text-sm font-bold leading-none text-white shadow-[0_10px_24px_rgba(174,102,85,0.24)] transition hover:bg-[#985545] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8f5144] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70"
              >
                {status === "submitting" && <Loader2 className="h-4 w-4 animate-spin" />}
                مشاهده نوبت‌های خالی
              </button>

              <Link
                href="/salons"
                className="inline-flex h-12 items-center justify-center rounded-2xl border border-[#b87362] bg-transparent px-5 text-sm font-bold leading-none text-[#7a493e] transition hover:bg-[#f8ece7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b87362] focus-visible:ring-offset-2"
              >
                مشاهده خدمات
              </Link>
            </div>

            <div className="mt-2 rounded-2xl border border-[#dfcbc2] bg-white px-4 py-2.5 text-[13px] font-medium leading-6 text-[#51413c]">
              {availabilityLoading ? (
                <span className="inline-flex items-center gap-2 font-semibold text-[#5e453e]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  در حال دریافت زمان‌های واقعی...
                </span>
              ) : availabilityMessage ? (
                <span>{availabilityMessage}</span>
              ) : (
                <span>زمان‌ها و قیمت‌های واقعی پس از جست‌وجو، مستقیماً از اطلاعات ارائه‌دهندگان نمایش داده می‌شوند.</span>
              )}
            </div>

            {error ? <p className="mt-2 text-sm font-semibold text-rose-700">{error}</p> : null}
          </form>
        </div>
      </section>

      <datalist id="hero-service-suggestions">
        {services.map((item) => (
          <option key={item} value={item} />
        ))}
      </datalist>
      <datalist id="hero-city-suggestions">
        {supportedCities.map((item) => (
          <option key={item} value={item} />
        ))}
      </datalist>
    </div>
  )
}
