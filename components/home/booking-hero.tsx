"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react"
import { CalendarDays, Check, ChevronDown, Clock3, Loader2, MapPin, Search } from "lucide-react"

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

function HeroWave() {
  return (
    <svg
      viewBox="0 0 1440 150"
      className="block h-[74px] w-full sm:h-[86px] lg:h-[102px]"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="M0 42C108 72 215 86 348 82C500 77 604 30 752 31C880 31 994 76 1130 88C1257 99 1360 88 1440 66V150H0V42Z"
        fill="#2c1c18"
      />
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
  const selected = options.find((option) => option.value === value)?.label || "انتخاب کنید"

  return (
    <div
      className={`relative min-w-0 border-[#d6b993]/30 ${
        divider ? "border-b md:border-b-0 md:border-r" : "border-b md:border-b-0"
      }`}
    >
      <button
        type="button"
        dir="rtl"
        onClick={onToggle}
        aria-expanded={open}
        className="group flex min-h-[68px] w-full items-center gap-3 px-4 text-right transition hover:bg-[#c89a75]/10 focus-visible:bg-[#c89a75]/15 focus-visible:outline-none sm:px-5 md:h-[104px] md:flex-col md:justify-center md:gap-1.5 md:px-3 md:text-center"
      >
        <span className="shrink-0 text-[#c79339] drop-shadow-[0_2px_8px_rgba(74,42,29,0.34)]">{icon}</span>
        <span className="min-w-0 flex-1 md:flex-none">
          <span className="block text-[10px] font-bold tracking-[0.12em] text-[#f0d5ad] md:text-[11px]">{label}</span>
          <span className={`mt-0.5 block truncate text-sm font-bold ${value ? "text-[#fff4df]" : "text-[#ead5c4]"}`}>{selected}</span>
        </span>
        <ChevronDown
          className={`h-[17px] w-[17px] shrink-0 text-[#e5c18a] transition-transform md:absolute md:bottom-4 md:left-4 ${open ? "rotate-180" : ""}`}
          strokeWidth={1.7}
        />
      </button>

      {open ? (
        <div className="absolute inset-x-2 top-[calc(100%+10px)] z-50 rounded-[22px] border border-[#d8b98d]/35 bg-[#3b2722]/90 p-2 shadow-[0_24px_58px_rgba(28,15,12,0.42)] backdrop-blur-xl">
          <p className="px-3 pb-1 pt-1 text-right text-[11px] font-bold text-[#efcf9d]">{label}</p>
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
                    active ? "bg-[#b8875f]/35 text-[#fff2dc]" : "text-[#f1dfd2] hover:bg-[#b8875f]/18"
                  }`}
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
  const [status, setStatus] = useState<"idle" | "submitting">("idle")
  const [error, setError] = useState("")

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
    setStatus("submitting")
    router.push(`/salons?${params.toString()}`)
  }

  return (
    <div className="relative bg-[#2c1c18]">
      <section className="relative isolate min-h-[850px] overflow-visible sm:min-h-[700px] md:h-[640px] md:min-h-0 lg:h-[690px] xl:h-[720px]">
        <div
          className="absolute inset-0 -z-30 bg-cover bg-[position:center_60%] blur-[1px] sm:bg-[position:center_64%] lg:bg-[position:center_67%]"
          style={{ backgroundImage: "url('/hero.png')" }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-0 -z-20 bg-[linear-gradient(180deg,rgba(22,12,10,0.36)_0%,rgba(28,15,12,0.24)_28%,rgba(34,18,14,0.28)_60%,rgba(25,13,11,0.46)_100%)]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_42%,rgba(255,245,230,0.08),rgba(14,8,7,0.10)_58%,rgba(10,6,5,0.24)_100%)]"
          aria-hidden="true"
        />

        <div className="relative z-20 mx-auto flex h-full max-w-7xl items-start justify-center px-4 pb-16 pt-28 sm:px-6 sm:pb-20 sm:pt-32 lg:px-8 lg:pb-20">
          <div className="w-full pt-8 sm:pt-10">
            <div className="mx-auto mb-5 flex max-w-5xl justify-center text-center sm:mb-6">
              <Link
                href="/"
                className="inline-flex flex-col items-center text-[#fff1d3] drop-shadow-[0_5px_18px_rgba(48,25,18,0.42)]"
                aria-label="Luxe Beauty"
              >
                <span className="font-serif text-[28px] tracking-[0.12em] sm:text-[34px] lg:text-[40px]">LUXE BEAUTY</span>
                <span className="mt-2 text-[9px] font-semibold tracking-[0.34em] text-[#f3dfbd]/95 sm:text-[10px]">CURATED BEAUTY</span>
                <span className="mt-2 text-[9px] font-semibold tracking-[0.24em] text-[#f7e5c4] sm:text-[10px]">PREMIUM SERVICES. TIMELESS YOU.</span>
              </Link>
            </div>

            <form
              onSubmit={submitSearch}
              className="mx-auto w-full max-w-6xl rounded-[32px] border border-[#d6b98f]/35 bg-[linear-gradient(180deg,rgba(70,43,35,0.34)_0%,rgba(43,27,23,0.26)_100%)] p-3 shadow-[0_28px_72px_rgba(28,15,12,0.30),inset_0_1px_0_rgba(234,205,164,0.16)] backdrop-blur-[24px] backdrop-saturate-150 sm:p-4"
            >
              <div
                ref={dropdownRoot}
                className="grid overflow-visible rounded-[24px] border border-[#e0c59c]/30 bg-[linear-gradient(180deg,rgba(94,61,49,0.32)_0%,rgba(55,35,30,0.25)_100%)] shadow-[inset_0_1px_0_rgba(238,210,170,0.15),0_10px_30px_rgba(32,18,14,0.18)] backdrop-blur-[18px] sm:grid-cols-2 md:grid-cols-[repeat(4,minmax(0,1fr))_88px]"
              >
                <DropdownField
                  icon={<Search className="h-[20px] w-[20px]" strokeWidth={1.65} />}
                  label="خدمت"
                  value={service}
                  options={services.map((item) => ({ value: item, label: item }))}
                  open={openField === "service"}
                  onToggle={() => setOpenField(openField === "service" ? null : "service")}
                  onSelect={(value) => {
                    setService(value)
                    setOpenField(null)
                  }}
                />
                <DropdownField
                  divider
                  icon={<MapPin className="h-[20px] w-[20px]" strokeWidth={1.65} />}
                  label="شهر"
                  value={location}
                  options={supportedCities.map((item) => ({ value: item, label: item }))}
                  open={openField === "location"}
                  onToggle={() => setOpenField(openField === "location" ? null : "location")}
                  onSelect={(value) => {
                    setLocation(value)
                    setOpenField(null)
                  }}
                />
                <DropdownField
                  divider
                  icon={<CalendarDays className="h-[20px] w-[20px]" strokeWidth={1.65} />}
                  label="تاریخ"
                  value={dateMode}
                  options={dateOptions}
                  open={openField === "date"}
                  onToggle={() => setOpenField(openField === "date" ? null : "date")}
                  onSelect={(value) => {
                    setDateMode(value)
                    setOpenField(null)
                  }}
                />
                <DropdownField
                  divider
                  icon={<Clock3 className="h-[20px] w-[20px]" strokeWidth={1.65} />}
                  label="بازه زمانی"
                  value={dayPart}
                  options={rangeOptions}
                  open={openField === "range"}
                  onToggle={() => setOpenField(openField === "range" ? null : "range")}
                  onSelect={(value) => {
                    setDayPart(value)
                    setOpenField(null)
                  }}
                />

                <div className="flex items-center justify-center p-2.5 sm:col-span-2 md:col-span-1 md:p-0">
                  <button
                    type="submit"
                    disabled={status === "submitting"}
                    className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#e9ca83_0%,#b9843e_58%,#8f612b_100%)] px-5 text-sm font-bold text-white shadow-[0_14px_34px_rgba(103,65,25,0.34)] transition hover:-translate-y-0.5 hover:brightness-105 disabled:opacity-70 md:h-[68px] md:w-[68px] md:rounded-full md:px-0"
                    aria-label="مشاهده نوبت‌های خالی"
                  >
                    {status === "submitting" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-6 w-6 transition-transform group-hover:scale-105" strokeWidth={1.8} />}
                    <span className="md:sr-only">مشاهده نوبت‌های خالی</span>
                  </button>
                </div>
              </div>

              {dateMode === "date" ? (
                <div className="mt-3 rounded-[22px] border border-[#d9bd92]/30 bg-[#4b3028]/28 px-4 py-3 backdrop-blur-[16px]">
                  <label className="flex items-center gap-3 text-sm font-bold text-[#f0dcc5]">
                    <span>انتخاب تاریخ</span>
                    <input
                      type="date"
                      value={customDate}
                      onChange={(event) => setCustomDate(event.target.value)}
                      className="min-w-0 flex-1 bg-transparent text-[#fff0dc] outline-none"
                    />
                  </label>
                </div>
              ) : null}

              {error ? <p className="mt-2 rounded-xl bg-[#3f2722]/85 px-3 py-2 text-sm font-bold text-rose-200">{error}</p> : null}
            </form>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-[-1px] z-10 leading-none">
          <HeroWave />
        </div>
      </section>
    </div>
  )
}
