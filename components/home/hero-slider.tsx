"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  CalendarCheck2,
  ChevronLeft,
  ChevronRight,
  MapPinned,
  Search,
  Star,
  Store,
  UsersRound,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const slides = [
  {
    image: "/hero/slide-1.webp",
    eyebrow: "رزرو سریع و مطمئن",
    title: "زیبایی را ساده‌تر رزرو کن",
    description: "سالن‌ها و متخصصان برتر را مقایسه کن، نمونه‌کارها را ببین و بهترین زمان را آنلاین رزرو کن.",
  },
  {
    image: "/hero/slide-2.webp",
    eyebrow: "همه‌چیز در چند دقیقه",
    title: "نوبت دلخواهت همیشه در دسترس است",
    description: "از اولین زمان آزاد تا نوبت‌های فوری و تخفیف‌های امروز، همه را یک‌جا پیدا کن.",
  },
  {
    image: "/hero/slide-3.webp",
    eyebrow: "انتخابی مطمئن‌تر",
    title: "قبل از رزرو، نتیجه را ببین",
    description: "امتیازها، نظرهای واقعی و نمونه‌کار متخصصان را ببین و با اطمینان انتخاب کن.",
  },
]

const stats = [
  { value: "+۵,۰۰۰", label: "سالن و متخصص", icon: Store },
  { value: "+۱۵۰,۰۰۰", label: "رزرو موفق", icon: CalendarCheck2 },
  { value: "۳۱", label: "استان فعال", icon: MapPinned },
  { value: "۴.۸", label: "میانگین رضایت", icon: Star },
]

export function HeroSlider() {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length)
    }, 6000)

    return () => window.clearInterval(timer)
  }, [])

  const goToPrevious = () => {
    setActiveIndex((current) => (current - 1 + slides.length) % slides.length)
  }

  const goToNext = () => {
    setActiveIndex((current) => (current + 1) % slides.length)
  }

  return (
    <section className="relative h-[720px] overflow-hidden bg-[#b9796e] sm:h-[650px] lg:h-[620px]">
      {slides.map((slide, index) => (
        <div
          key={slide.image}
          className={`absolute inset-0 transition-opacity duration-1000 ${index === activeIndex ? "opacity-100" : "pointer-events-none opacity-0"}`}
          aria-hidden={index !== activeIndex}
        >
          <img
            src={slide.image}
            alt=""
            className="h-full w-full object-cover object-center [image-rendering:auto] [filter:contrast(1.08)_saturate(1.08)]"
            fetchPriority={index === 0 ? "high" : "auto"}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#3a201c]/85 via-[#6c433c]/48 to-[#4b2c27]/5" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#2e1916]/45 via-transparent to-[#2e1916]/10" />
          <div className="absolute inset-0 bg-[#b76f62]/10 mix-blend-multiply" />
        </div>
      ))}

      <div className="relative z-10 mx-auto h-full max-w-[1500px] px-4 sm:px-6 lg:px-10">
        <div className="flex h-full items-center pb-32 pt-10 sm:pb-36">
          <div className="mr-auto w-full max-w-[590px] rounded-[2.25rem] border border-white/20 bg-[#2e1916]/32 p-5 text-right text-white shadow-[0_30px_90px_rgba(42,20,17,0.22)] backdrop-blur-md sm:p-7 lg:p-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/12 px-4 py-2 text-xs font-black text-white shadow-sm backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.12)]" />
              {slides[activeIndex].eyebrow}
            </div>

            <h1 className="mt-5 text-balance text-3xl font-black leading-[1.25] text-white sm:text-4xl lg:text-[3.25rem]">
              {slides[activeIndex].title}
            </h1>

            <p className="mt-4 max-w-lg text-sm leading-7 text-white/78 sm:text-base">
              {slides[activeIndex].description}
            </p>

            <div className="mt-7 rounded-[1.6rem] border border-white/30 bg-white/92 p-2.5 shadow-[0_18px_55px_rgba(35,18,15,0.18)] backdrop-blur-xl">
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl bg-[#f7f3f2] px-4 text-[#4c4543]">
                  <Search className="h-5 w-5 shrink-0 text-[#9a6a61]" />
                  <Input
                    aria-label="جست‌وجوی سالن یا خدمت"
                    placeholder="نام سالن، متخصص یا خدمت..."
                    className="h-12 border-0 bg-transparent px-0 text-[#332c2a] shadow-none placeholder:text-[#89817e] focus-visible:ring-0"
                  />
                </div>
                <Link href="/salons" className="shrink-0">
                  <Button className="h-12 w-full rounded-2xl bg-[#a45f53] px-8 text-white shadow-lg shadow-[#713e35]/25 hover:bg-[#925247] sm:w-auto">
                    جست‌وجو
                  </Button>
                </Link>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Link href="/salons?availability=today" className="rounded-full border border-white/20 bg-white/13 px-4 py-2 text-xs font-bold text-white backdrop-blur transition hover:bg-white/22">
                نوبت‌های امروز
              </Link>
              <Link href="/salons?offer=discount" className="rounded-full border border-white/20 bg-white/13 px-4 py-2 text-xs font-bold text-white backdrop-blur transition hover:bg-white/22">
                تخفیف‌های فعال
              </Link>
              <Link href="/salon-register" className="inline-flex items-center gap-2 rounded-full border border-[#f1c8bf]/50 bg-[#fff4f1]/90 px-4 py-2 text-xs font-black text-[#8f5147] shadow-sm backdrop-blur transition hover:bg-white">
                <UsersRound className="h-4 w-4" />
                همکاری با لوکس بیوتی
              </Link>
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        aria-label="اسلاید قبلی"
        onClick={goToPrevious}
        className="absolute left-5 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-[#2f1a17]/25 text-white shadow-xl backdrop-blur-lg transition hover:bg-[#2f1a17]/45 md:flex"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        aria-label="اسلاید بعدی"
        onClick={goToNext}
        className="absolute right-5 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-[#2f1a17]/25 text-white shadow-xl backdrop-blur-lg transition hover:bg-[#2f1a17]/45 md:flex"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <div className="absolute bottom-[118px] left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 sm:bottom-[124px]">
        {slides.map((slide, index) => (
          <button
            key={slide.image}
            type="button"
            aria-label={`نمایش اسلاید ${index + 1}`}
            onClick={() => setActiveIndex(index)}
            className={`h-2.5 rounded-full border border-white/45 transition-all ${index === activeIndex ? "w-9 bg-white" : "w-2.5 bg-white/35 hover:bg-white/60"}`}
          />
        ))}
      </div>

      <div className="absolute bottom-5 left-1/2 z-40 w-[min(1120px,calc(100%-28px))] -translate-x-1/2 sm:bottom-6">
        <div className="grid grid-cols-2 overflow-hidden rounded-[2rem] border border-white/65 bg-white/82 shadow-[0_22px_60px_rgba(51,28,24,0.16)] backdrop-blur-2xl md:grid-cols-4">
          {stats.map((stat, index) => (
            <div key={stat.label} className={`flex items-center justify-center gap-3 px-3 py-4 sm:px-5 ${index > 0 ? "md:border-r md:border-[#e8d9d5]" : ""} ${index > 1 ? "border-t border-[#e8d9d5] md:border-t-0" : index === 1 ? "border-r border-[#e8d9d5] md:border-r" : ""}`}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#fff4f1] to-[#f1d9d3] text-[#9c5b50] shadow-inner">
                <stat.icon className={`h-5 w-5 ${stat.label === "میانگین رضایت" ? "fill-[#c88749] text-[#c88749]" : ""}`} />
              </span>
              <span className="text-right">
                <span className="block text-xl font-black tabular-nums text-[#2d2523] sm:text-2xl">{stat.value}</span>
                <span className="mt-0.5 block text-[11px] font-bold text-[#817876] sm:text-xs">{stat.label}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <svg aria-hidden="true" className="absolute -bottom-px left-0 z-20 h-[88px] w-full" viewBox="0 0 1440 120" preserveAspectRatio="none">
        <path className="fill-background" d="M0 62C195 117 363 109 532 67C729 18 897 20 1077 70C1212 108 1322 104 1440 73V120H0V62Z" />
      </svg>
    </section>
  )
}
