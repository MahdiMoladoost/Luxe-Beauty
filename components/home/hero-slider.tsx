"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Search, Store } from "lucide-react"

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
    eyebrow: "برای همه سلیقه‌ها",
    title: "از میکاپ تا خدمات آقایان",
    description: "خدمات بانوان، آقایان، عروس و داماد و متخصصان مستقل را هوشمندانه انتخاب کن.",
  },
]

export function HeroSlider() {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length)
    }, 5500)

    return () => window.clearInterval(timer)
  }, [])

  const goToPrevious = () => {
    setActiveIndex((current) => (current - 1 + slides.length) % slides.length)
  }

  const goToNext = () => {
    setActiveIndex((current) => (current + 1) % slides.length)
  }

  return (
    <section className="relative h-[480px] overflow-hidden bg-[#fff8f5] sm:h-[500px] lg:h-[520px]">
      {slides.map((slide, index) => (
        <div
          key={slide.image}
          className={`absolute inset-0 transition-opacity duration-700 ${index === activeIndex ? "opacity-100" : "pointer-events-none opacity-0"}`}
          aria-hidden={index !== activeIndex}
        >
          <img
            src={slide.image}
            alt=""
            className="h-full w-full object-cover object-center"
            fetchPriority={index === 0 ? "high" : "auto"}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-white/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-white/35 via-transparent to-white/10" />
        </div>
      ))}

      <div className="relative z-10 mx-auto h-full max-w-[1500px] px-4 sm:px-6 lg:px-10">
        <div className="flex h-full items-center pb-14 pt-6">
          <div className="mr-auto w-full max-w-xl text-right">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#edd6cf] bg-white/90 px-4 py-2 text-xs font-bold text-[#a9695e] shadow-sm backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {slides[activeIndex].eyebrow}
            </div>

            <h1 className="mt-4 text-balance text-3xl font-black leading-[1.25] text-[#171717] sm:text-4xl lg:text-5xl">
              {slides[activeIndex].title}
            </h1>

            <p className="mt-3 max-w-lg text-sm leading-7 text-[#555] sm:text-base">
              {slides[activeIndex].description}
            </p>

            <div className="mt-6 rounded-3xl border border-white/80 bg-white/90 p-2.5 shadow-[0_18px_50px_rgba(105,73,63,0.12)] backdrop-blur-md">
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl bg-[#f7f7f8] px-4">
                  <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <Input
                    aria-label="جست‌وجوی سالن یا خدمت"
                    placeholder="نام سالن، متخصص یا خدمت..."
                    className="h-11 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                  />
                </div>
                <Link href="/salons" className="shrink-0">
                  <Button className="h-11 w-full rounded-2xl px-7 shadow-lg shadow-primary/20 sm:w-auto">
                    جست‌وجو
                  </Button>
                </Link>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Link href="/salons?availability=today" className="rounded-full bg-white/90 px-4 py-2 text-xs font-bold text-foreground shadow-sm backdrop-blur hover:bg-white">
                نوبت‌های امروز
              </Link>
              <Link href="/salons?offer=discount" className="rounded-full bg-white/90 px-4 py-2 text-xs font-bold text-foreground shadow-sm backdrop-blur hover:bg-white">
                تخفیف‌های فعال
              </Link>
              <Link href="/salon-register" className="inline-flex items-center gap-2 rounded-full border border-[#dca99d] bg-[#fff6f3]/90 px-4 py-2 text-xs font-black text-[#a45f53] shadow-sm backdrop-blur transition hover:bg-white">
                <Store className="h-4 w-4" />
                ثبت سالن یا متخصص
              </Link>
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        aria-label="اسلاید قبلی"
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-white/75 text-foreground shadow-lg backdrop-blur transition hover:bg-white md:flex"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        aria-label="اسلاید بعدی"
        onClick={goToNext}
        className="absolute right-4 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-white/75 text-foreground shadow-lg backdrop-blur transition hover:bg-white md:flex"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <div className="absolute bottom-14 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
        {slides.map((slide, index) => (
          <button
            key={slide.image}
            type="button"
            aria-label={`نمایش اسلاید ${index + 1}`}
            onClick={() => setActiveIndex(index)}
            className={`h-2.5 rounded-full transition-all ${index === activeIndex ? "w-8 bg-[#b66f62]" : "w-2.5 bg-[#b66f62]/35 hover:bg-[#b66f62]/60"}`}
          />
        ))}
      </div>

      <svg
        aria-hidden="true"
        className="absolute -bottom-px left-0 z-20 h-[76px] w-full"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
      >
        <path
          className="fill-background"
          d="M0 69C166 126 327 115 486 69C664 18 798 24 963 76C1129 128 1281 118 1440 61V120H0V69Z"
        />
      </svg>
    </section>
  )
}
