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

      <main className="flex-1 pt-16">
        <HeroSlider />

        <section className="relative overflow-hidden py-16 sm:py-20">
          <div className="pointer-events-none absolute right-[-10rem] top-[-6rem] h-80 w-80 rounded-full bg-[#f3ddd7]/50 blur-3xl" />
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <span className="inline-flex rounded-full bg-[#fff1ed] px-3 py-1.5 text-xs font-black text-[#a45f53]">انتخاب سریع</span>
                <h2 className="mt-3 text-3xl font-black text-foreground sm:text-4xl">خدمات محبوب</h2>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">خدمت موردنظر را انتخاب کنید و زمان‌های آزاد بهترین متخصصان را ببینید.</p>
              </div>
              <Link href="/salons" className="inline-flex items-center gap-2 text-sm font-black text-[#a45f53]">
                مشاهده همه خدمات
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-9 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
              {services.map((service) => (
                <Link
                  key={service.name}
                  href={service.href}
                  className="group relative overflow-hidden rounded-[1.75rem] border border-[#eadbd6] bg-white/80 p-5 text-center shadow-[0_12px_35px_rgba(78,49,42,0.05)] transition duration-300 hover:-translate-y-1.5 hover:border-[#dfb7ae] hover:shadow-[0_22px_50px_rgba(117,71,61,0.12)]"
                >
                  <span className="absolute -left-8 -top-8 h-24 w-24 rounded-full bg-[#fff1ed] transition group-hover:scale-125" />
                  <span className="relative mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#fff5f2] to-[#efd7d1] text-[#a45f53] shadow-inner transition group-hover:from-[#ad665a] group-hover:to-[#c9897d] group-hover:text-white">
                    <service.icon className="h-6 w-6" />
                  </span>
                  <span className="relative mt-4 block text-sm font-black text-foreground">{service.name}</span>
                  <span className="relative mt-1 block text-[11px] text-muted-foreground">{service.count}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-[#eadbd6]/70 bg-gradient-to-b from-[#fffaf8] to-[#fff5f1] py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="grid gap-5 lg:grid-cols-3">
              {benefits.map((benefit, index) => (
                <div key={benefit.title} className="relative overflow-hidden rounded-[2rem] border border-white bg-white/75 p-7 shadow-[0_18px_45px_rgba(82,48,41,0.07)] backdrop-blur">
                  <span className="absolute left-5 top-4 text-6xl font-black text-[#f4e4df]">۰{index + 1}</span>
                  <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-[#a45f53] text-white shadow-lg shadow-[#a45f53]/20">
                    <benefit.icon className="h-6 w-6" />
                  </span>
                  <h3 className="relative mt-5 text-lg font-black text-foreground">{benefit.title}</h3>
                  <p className="relative mt-2 text-sm leading-7 text-muted-foreground">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <span className="inline-flex rounded-full bg-[#fff1ed] px-3 py-1.5 text-xs font-black text-[#a45f53]">پیشنهاد لوکس بیوتی</span>
                <h2 className="mt-3 text-3xl font-black text-foreground sm:text-4xl">سالن‌های منتخب</h2>
              </div>
              <Link href="/salons" className="hidden items-center gap-2 text-sm font-black text-[#a45f53] sm:flex">
                مشاهده همه
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-9 grid gap-5 md:grid-cols-3">
              {salons.map((salon) => (
                <Link key={salon.name} href="/salons" className="group overflow-hidden rounded-[2rem] border border-[#eadbd6] bg-white shadow-[0_14px_40px_rgba(75,45,39,0.07)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_25px_60px_rgba(75,45,39,0.14)]">
                  <div className="relative h-56 overflow-hidden">
                    <img src={salon.image} alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#2f1a17]/45 via-transparent to-transparent" />
                    <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-white/60 bg-white/80 px-3 py-1.5 text-xs font-black text-foreground shadow-sm backdrop-blur-xl">
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
          <div className="relative mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 overflow-hidden rounded-[2.25rem] border border-[#e7c9c1] bg-gradient-to-l from-[#9d5c51] via-[#b97569] to-[#d69c91] px-6 py-10 text-center text-white shadow-[0_25px_70px_rgba(112,64,54,0.2)] md:flex-row md:text-right lg:px-10">
            <Sparkles className="absolute -left-5 -top-5 h-36 w-36 text-white/10" />
            <div className="relative">
              <span className="text-xs font-black text-white/70">برای صاحبان کسب‌وکار زیبایی</span>
              <h2 className="mt-2 text-2xl font-black">خدماتت را به هزاران مشتری معرفی کن</h2>
              <p className="mt-2 text-sm leading-7 text-white/75">صفحه حرفه‌ای بساز، نمونه‌کار منتشر کن و نوبت‌ها را آنلاین مدیریت کن.</p>
            </div>
            <Link href="/salon-register" className="relative shrink-0">
              <Button size="lg" className="h-12 gap-2 rounded-2xl bg-white px-7 font-black text-[#8f5147] shadow-xl hover:bg-[#fff5f2]">
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
