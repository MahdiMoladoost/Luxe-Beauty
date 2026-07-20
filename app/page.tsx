import Link from "next/link"
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Heart,
  Home,
  Palette,
  Scissors,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  UserRound,
} from "lucide-react"

import { Footer } from "@/components/layout/footer"
import { Header } from "@/components/layout/header"
import { HeroSlider } from "@/components/home/hero-slider"
import { Button } from "@/components/ui/button"

const services = [
  { name: "مو و استایل", count: "+۱۲۰۰ ارائه‌دهنده", icon: Scissors, href: "/salons?service=hair" },
  { name: "ناخن", count: "+۸۵۰ ارائه‌دهنده", icon: Sparkles, href: "/salons?service=nails" },
  { name: "آرایش و میکاپ", count: "+۶۴۰ ارائه‌دهنده", icon: Palette, href: "/salons?service=makeup" },
  { name: "مراقبت زیبایی", count: "+۵۲۰ ارائه‌دهنده", icon: Heart, href: "/salons?service=beauty-care" },
  { name: "خدمات آقایان", count: "+۷۱۰ ارائه‌دهنده", icon: UserRound, href: "/salons?audience=men" },
  { name: "خدمات در منزل", count: "+۳۲۰ متخصص", icon: Home, href: "/salons?service=home" },
]

const benefits = [
  {
    icon: ShieldCheck,
    title: "انتخاب مطمئن",
    description: "امتیازها، نظرات واقعی و نمونه‌کارها را قبل از رزرو مقایسه کنید.",
  },
  {
    icon: CalendarDays,
    title: "رزرو بدون تماس",
    description: "زمان‌های آزاد را آنلاین ببینید و نوبت خود را در چند مرحله کوتاه ثبت کنید.",
  },
  {
    icon: CheckCircle2,
    title: "پیگیری یکپارچه",
    description: "نوبت‌ها، پرداخت‌ها و تغییر زمان را از حساب کاربری مدیریت کنید.",
  },
]

const salons = [
  {
    name: "سالن زیبایی آترین",
    location: "تهران، زعفرانیه",
    rating: "۴.۹",
    image: "/hero/slide-1.webp",
  },
  {
    name: "استودیو زیبایی رز",
    location: "تهران، سعادت‌آباد",
    rating: "۴.۸",
    image: "/hero/slide-2.webp",
  },
  {
    name: "خانه زیبایی ماه",
    location: "کرج، عظیمیه",
    rating: "۴.۹",
    image: "/hero/slide-3.webp",
  },
]

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1 pt-16 2xl:pt-[72px]">
        <HeroSlider />

        <section className="relative z-30 -mt-1 pb-10">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 px-4 md:grid-cols-4 lg:px-8">
            {[
              { value: "+۵,۰۰۰", label: "سالن و متخصص" },
              { value: "+۱۵۰,۰۰۰", label: "رزرو موفق" },
              { value: "۳۱", label: "استان فعال" },
              { value: "۴.۸", label: "میانگین رضایت" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-border/70 bg-card px-4 py-4 text-center shadow-sm">
                <div className="text-2xl font-black tabular-nums text-foreground">{stat.value}</div>
                <div className="mt-1 text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="py-14 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <span className="text-sm font-black text-primary">انتخاب سریع</span>
                <h2 className="mt-2 text-3xl font-black text-foreground">خدمات محبوب</h2>
                <p className="mt-2 text-sm text-muted-foreground">خدمت موردنظر را انتخاب کنید و زمان‌های آزاد را ببینید.</p>
              </div>
              <Link href="/salons" className="inline-flex items-center gap-2 text-sm font-bold text-primary">
                مشاهده همه خدمات
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
              {services.map((service) => (
                <Link
                  key={service.name}
                  href={service.href}
                  className="group rounded-3xl border border-border bg-card p-5 text-center transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5"
                >
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                    <service.icon className="h-6 w-6" />
                  </span>
                  <span className="mt-4 block text-sm font-black text-foreground">{service.name}</span>
                  <span className="mt-1 block text-[11px] text-muted-foreground">{service.count}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-border/70 bg-secondary/35 py-14 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="grid gap-5 lg:grid-cols-3">
              {benefits.map((benefit) => (
                <div key={benefit.title} className="rounded-3xl border border-border/70 bg-background p-6 shadow-sm">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <benefit.icon className="h-6 w-6" />
                  </span>
                  <h3 className="mt-5 text-lg font-black text-foreground">{benefit.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-14 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <span className="text-sm font-black text-primary">پیشنهاد لوکس بیوتی</span>
                <h2 className="mt-2 text-3xl font-black text-foreground">سالن‌های منتخب</h2>
              </div>
              <Link href="/salons" className="hidden items-center gap-2 text-sm font-bold text-primary sm:flex">
                مشاهده همه
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {salons.map((salon) => (
                <Link key={salon.name} href="/salons" className="group overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                  <div className="relative h-52 overflow-hidden">
                    <img src={salon.image} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 text-xs font-black text-foreground shadow-sm backdrop-blur">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      {salon.rating}
                    </span>
                  </div>
                  <div className="p-5">
                    <h3 className="font-black text-foreground">{salon.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{salon.location}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-16 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 overflow-hidden rounded-[2rem] border border-[#ecd6cf] bg-gradient-to-l from-[#fff4f0] via-white to-[#fff9f7] px-6 py-9 text-center md:flex-row md:text-right lg:px-10">
            <div>
              <span className="text-xs font-black text-[#a45f53]">برای صاحبان کسب‌وکار زیبایی</span>
              <h2 className="mt-2 text-2xl font-black text-foreground">خدماتت را به هزاران مشتری معرفی کن</h2>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">صفحه حرفه‌ای بساز، نمونه‌کار منتشر کن و نوبت‌ها را آنلاین مدیریت کن.</p>
            </div>
            <Link href="/salon-register" className="shrink-0">
              <Button size="lg" className="h-12 gap-2 rounded-2xl px-7 shadow-lg shadow-primary/20">
                <Store className="h-5 w-5" />
                ثبت سالن یا متخصص
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
