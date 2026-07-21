"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react"
import { CalendarDays, ChevronDown, Crosshair, Loader2, Map, MapPin, Search } from "lucide-react"

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
    <div className="h-full rounded-2xl border border-[#dfcbc2] bg-white px-4 py-3 shadow-[0_1px_0_rgba(58,37,31,0.03)]">
      {children}
    </div>
  )
}

function HeroWave() {
  return (
    <svg
      viewBox="0 0 1440 140"
      className="block h-[58px] w-full sm:h-[68px] lg:h-[76px]"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="M0 42C108 72 215 86 348 82C500 77 604 30 752 31C880 31 994 76 1130 88C1257 99 1360 88 1440 66V140H0V42Z"
        fill="var(--background)"
      />
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
  const [status, setStatus] = useState<"idle" | "locating" | "submitting">("idle")
  const [error, setError] = useState("")
  const [availability, setAvailability] = useState<AvailabilitySummary | null>(null)
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    const savedCity = window.localStorage.getItem(CITY_STORAGE_KEY)
    if (savedCity) setLocation(savedCity)
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

    window.localStorage.setItem(CITY_STORAGE_KEY, location)

    const params = new URLSearchParams({
      service: normalizedService,
      location,
      availability: dateMode,
      dayPart,
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
  const inputClassName =
    "mt-1 w-full bg-transparent text-sm font-semibold text-[#312725] outline-none placeholder:text-[#6f5b54] placeholder:opacity-100"

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
          <div className="w-full max-w-[570px] rounded-[28px] bg-white/40 px-4 py-3 backdrop-blur-[2px] sm:px-5 sm:py-4 lg:bg-white/28">
            <h1
              dir="rtl"
              className="text-right font-sans text-[1.45rem] font-extrabold leading-[1.55] tracking-[-0.018em] text-[#342421] sm:text-[1.85rem] sm:leading-[1.5] lg:text-[2.2rem] lg:leading-[1.48]"
            >
              <span className="block">بهترین سالن‌ها و متخصصان زیبایی</span>
              <span className="block">را پیدا کن و آنلاین نوبت بگیر</span>
            </h1>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-[-1px] z-0 leading-none">
          <HeroWave />
        </div>

        <div className="absolute inset-x-0 bottom-0 z-20 translate-y-[48%] px-4 sm:px-6 lg:px-8">
          <form
            onSubmit={submitSearch}
            className="mx-auto max-w-6xl rounded-[30px] border border-[#dcc3b8] bg-[#fffaf7] p-3 shadow-[0_30px_80px_rgba(54,35,30,0.20),0_8px_24px_rgba(54,35,30,0.10)] sm:p-4"
          >
            <div className="hidden gap-3 md:grid md:grid-cols-3">
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
                      placeholder="کراتین، کاشت ناخن..."
                      className={inputClassName}
                      autoComplete="off"
                    />
                  </span>
                </label>
              </FieldShell>

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
                      className={inputClassName}
                    />
                  </span>
                </label>
              </FieldShell>

              <FieldShell>
                <div className="flex items-start gap-3">
                  <CalendarDays className="mt-1 h-5 w-5 shrink-0 text-[#a85f4f]" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-bold text-[#704b42]">چه زمانی؟</span>
                    <div className="mt-2 grid grid-cols-[minmax(0,1fr)_96px] overflow-hidden rounded-xl border border-[#dfcbc2] bg-[#fffdfb]">
                      <label className="min-w-0 px-3 py-2">
                        <span className="block text-[10px] font-semibold text-[#735f58]">زمان</span>
                        <select
                          value={dateMode}
                          onChange={(event) => setDateMode(event.target.value)}
                          className="mt-0.5 w-full bg-transparent text-sm font-semibold text-[#312725] outline-none"
                        >
                          <option value="first-available">اولین نوبت خالی</option>
                          <option value="today">امروز</option>
                          <option value="tomorrow">فردا</option>
                          <option value="weekend">آخر هفته</option>
                          <option value="date">انتخاب تاریخ</option>
                        </select>
                      </label>
                      <label className="border-r border-[#dfcbc2] px-3 py-2">
                        <span className="block text-[10px] font-semibold text-[#735f58]">بازه</span>
                        <select
                          value={dayPart}
                          onChange={(event) => setDayPart(event.target.value)}
                          className="mt-0.5 w-full bg-transparent text-sm font-semibold text-[#312725] outline-none"
                        >
                          <option value="any">همه</option>
                          <option value="morning">صبح</option>
                          <option value="noon">ظهر</option>
                          <option value="evening">عصر</option>
                        </select>
                      </label>
                    </div>
                  </span>
                </div>
              </FieldShell>
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
                        placeholder="مثلاً کراتین در غرب تهران"
                        className={inputClassName}
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
                          className={inputClassName}
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
                    <span className="mb-2 block text-[11px] font-bold text-[#704b42]">زمان موردنظر</span>
                    <select
                      value={dateMode}
                      onChange={(event) => setDateMode(event.target.value)}
                      className="w-full bg-transparent text-sm font-semibold text-[#312725] outline-none"
                    >
                      <option value="first-available">اولین نوبت خالی</option>
                      <option value="today">امروز</option>
                      <option value="tomorrow">فردا</option>
                      <option value="weekend">آخر هفته</option>
                      <option value="date">انتخاب تاریخ</option>
                    </select>
                  </FieldShell>

                  <FieldShell>
                    <span className="mb-2 block text-[11px] font-bold text-[#704b42]">بازه زمانی</span>
                    <select
                      value={dayPart}
                      onChange={(event) => setDayPart(event.target.value)}
                      className="w-full bg-transparent text-sm font-semibold text-[#312725] outline-none"
                    >
                      <option value="any">همه بازه‌ها</option>
                      <option value="morning">صبح</option>
                      <option value="noon">ظهر</option>
                      <option value="evening">عصر</option>
                    </select>
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
                    className="inline-flex h-12 flex-1 items-center justify-center rounded-2xl bg-[#ae6655] px-5 text-sm font-bold leading-none text-white shadow-[0_10px_26px_rgba(174,102,85,0.28)]"
                  >
                    مرحله بعد
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={status === "submitting"}
                    className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#ae6655] px-5 text-sm font-bold leading-none text-white shadow-[0_10px_26px_rgba(174,102,85,0.28)] disabled:cursor-wait disabled:opacity-70"
                  >
                    {status === "submitting" && <Loader2 className="h-4 w-4 animate-spin" />}
                    مشاهده نوبت‌های خالی
                  </button>
                )}
              </div>
            </div>

            {dateMode === "date" && (
              <div className="mt-3 md:grid md:grid-cols-3 md:gap-3">
                <div className="md:col-start-3">
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

            <div className="mt-3 hidden grid-cols-3 gap-3 md:grid">
              <button
                type="submit"
                disabled={status === "submitting"}
                className="col-span-2 inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#ae6655] px-5 text-sm font-bold leading-none text-white shadow-[0_12px_30px_rgba(174,102,85,0.30)] transition hover:bg-[#985545] disabled:cursor-wait disabled:opacity-70"
              >
                {status === "submitting" && <Loader2 className="h-4 w-4 animate-spin" />}
                مشاهده نوبت‌های خالی
              </button>

              <Link
                href="/salons"
                className="inline-flex h-14 items-center justify-center rounded-2xl border border-[#d8beb3] bg-white px-5 text-sm font-bold leading-none text-[#674942] transition hover:bg-[#f9efea]"
              >
                مشاهده خدمات
              </Link>
            </div>

            <div className="mt-3 rounded-2xl border border-[#ead8d0] bg-white px-4 py-2.5 text-xs font-medium leading-6 text-[#66544e]">
              {availabilityLoading ? (
                <span className="inline-flex items-center gap-2 font-semibold text-[#674d45]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  در حال دریافت زمان‌های واقعی...
                </span>
              ) : availabilityMessage ? (
                <span>{availabilityMessage}</span>
              ) : (
                <span>زمان‌های واقعی و قیمت‌ها پس از جست‌وجو از اطلاعات ارائه‌دهندگان نمایش داده می‌شوند.</span>
              )}
            </div>

            {error ? <p className="mt-2 text-sm font-semibold text-rose-700">{error}</p> : null}
          </form>
        </div>
      </section>

      <datalist id="hero-service-suggestions">
        {services.map((item) => <option key={item} value={item} />)}
      </datalist>
      <datalist id="hero-city-suggestions">
        {supportedCities.map((item) => <option key={item} value={item} />)}
      </datalist>
    </div>
  )
}
