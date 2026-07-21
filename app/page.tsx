import Link from "next/link"
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  CreditCard,
  Gem,
  Heart,
  MapPin,
  Palette,
  Scissors,
  ShieldCheck,
  Sparkles,
  SprayCan,
  Star,
  UserRound,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { BookingHero } from "@/components/home/booking-hero"

const featuredSalons = [
  {
    id: 1,
    name: "سالن زیبایی گلریز",
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop",
    rating: 4.9,
    reviews: 234,
    location: "تهران، ولیعصر",
    services: ["کوتاهی مو", "رنگ مو", "آرایش عروس"],
    isVerified: true,
  },
  {
    id: 2,
    name: "آرایشگاه مدرن استایل",
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=300&fit=crop",
    rating: 4.8,
    reviews: 189,
    location: "تهران، سعادت آباد",
    services: ["اصلاح صورت", "کوتاهی مو", "مراقبت پوست"],
    isVerified: true,
  },
  {
    id: 3,
    name: "سالن آرایش رز",
    image: "https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?w=400&h=300&fit=crop",
    rating: 4.7,
    reviews: 156,
    location: "اصفهان، چهارباغ",
    services: ["مانیکور", "پدیکور", "کراتین مو"],
    isVerified: false,
  },
  {
    id: 4,
    name: "بیوتی سنتر پرستیژ",
    image: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=400&h=300&fit=crop",
    rating: 4.9,
    reviews: 312,
    location: "تهران، جردن",
    services: ["میکاپ", "شینیون", "اکستنشن مژه"],
    isVerified: true,
  },
]

const services = [
  { name: "کوتاهی مو", icon: Scissors, count: "2,450 سالن" },
  { name: "رنگ و هایلایت", icon: Palette, count: "1,890 سالن" },
  { name: "آرایش عروس", icon: Heart, count: "987 سالن" },
  { name: "مانیکور و پدیکور", icon: Gem, count: "1,567 سالن" },
  { name: "مراقبت پوست", icon: SprayCan, count: "1,234 سالن" },
  { name: "اصلاح آقایان", icon: UserRound, count: "2,100 سالن" },
]

const cities = [
  { name: "تهران", count: "1,234 سالن", image: "https://images.unsplash.com/photo-1567449303078-57ad995bd329?w=300&h=200&fit=crop" },
  { name: "اصفهان", count: "456 سالن", image: "https://images.unsplash.com/photo-1565073624497-7144969d0a07?w=300&h=200&fit=crop" },
  { name: "شیراز", count: "389 سالن", image: "https://images.unsplash.com/photo-1576834241653-43b0e6d9b79d?w=300&h=200&fit=crop" },
  { name: "مشهد", count: "512 سالن", image: "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=300&h=200&fit=crop" },
]

const features = [
  {
    icon: Clock3,
    title: "رزرو آنلاین لحظه‌ای",
    description: "در هر ساعتی از شبانه‌روز، بدون نیاز به تماس تلفنی، نوبت خود را رزرو کنید.",
  },
  {
    icon: ShieldCheck,
    title: "سالن‌های تایید شده",
    description: "تمام آرایشگاه‌ها توسط تیم کارشناسی ما بررسی و اعتبارسنجی شده‌اند.",
  },
  {
    icon: Sparkles,
    title: "نمونه‌کار و پورتفولیو",
    description: "قبل از رزرو، نمونه‌کارهای آرایشگران را مشاهده و مقایسه کنید.",
  },
  {
    icon: Users,
    title: "نظرات واقعی مشتریان",
    description: "بر اساس تجربیات واقعی کاربران، بهترین انتخاب را داشته باشید.",
  },
  {
    icon: CreditCard,
    title: "پرداخت امن آنلاین",
    description: "امکان پرداخت آنلاین امن با درگاه‌های معتبر بانکی ایران.",
  },
  {
    icon: CalendarDays,
    title: "یادآوری هوشمند",
    description: "سیستم یادآوری خودکار برای جلوگیری از فراموشی نوبت شما.",
  },
]

const testimonials = [
  {
    name: "سارا محمدی",
    role: "کاربر دائمی",
    content: "از زمانی که از سالن یاب استفاده می‌کنم، دیگر نیازی به زنگ زدن و هماهنگی ندارم. خیلی راحت و سریع نوبت می‌گیرم.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
  },
  {
    name: "مریم رضایی",
    role: "صاحب سالن زیبایی",
    content: "سالن یاب باعث شد مشتری‌های جدید زیادی پیدا کنم. سیستم مدیریت نوبت‌ها هم خیلی حرفه‌ای و کاربردی است.",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
  },
  {
    name: "نیلوفر احمدی",
    role: "کاربر جدید",
    content: "قبلا همیشه برای پیدا کردن آرایشگاه خوب مشکل داشتم. الان با نظرات و امتیازها راحت تصمیم می‌گیرم.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
  },
]

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#211411]">
      <Header />

      <main className="flex-1 pt-16">
        <BookingHero />

        <section className="relative isolate -mt-[2px] overflow-hidden bg-[#3b2722] pb-20 pt-6 sm:pb-24 sm:pt-8">
          <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mx-auto mb-5 flex w-fit items-center gap-3 text-[#e9c98f]">
                <span className="h-px w-10 bg-gradient-to-r from-transparent to-[#e9c98f]" />
                <span className="text-[10px] font-semibold tracking-[0.34em] sm:text-xs">LUXE BEAUTY SERVICES</span>
                <span className="h-px w-10 bg-gradient-to-l from-transparent to-[#e9c98f]" />
              </div>
              <h2 className="font-serif text-3xl font-medium text-[#fff4df] drop-shadow-[0_3px_14px_rgba(0,0,0,0.22)] md:text-5xl">خدمات محبوب</h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#ead8ca]/80 sm:text-base">تجربه‌ای دقیق، لوکس و حرفه‌ای برای انتخاب و رزرو محبوب‌ترین خدمات زیبایی</p>
            </div>

            <div className="mt-12 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-6">
              {services.map((service, index) => {
                const Icon = service.icon
                return (
                  <Link
                    key={service.name}
                    href={`/salons?service=${service.name}`}
                    className="group relative min-h-[190px] overflow-hidden rounded-[26px] border border-[#e1c398]/25 bg-[linear-gradient(160deg,rgba(255,255,255,0.13)_0%,rgba(255,255,255,0.045)_100%)] p-5 text-center shadow-[0_18px_45px_rgba(15,8,6,0.22),inset_0_1px_0_rgba(255,255,255,0.14)] backdrop-blur-[18px] transition-all duration-500 hover:-translate-y-2 hover:border-[#e7c891]/55 hover:bg-[linear-gradient(160deg,rgba(255,255,255,0.20)_0%,rgba(255,255,255,0.08)_100%)] hover:shadow-[0_28px_60px_rgba(15,8,6,0.34),0_0_0_1px_rgba(229,194,139,0.08)]"
                  >
                    <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-[#f4d8a7]/70 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    <span className="absolute left-4 top-3 font-serif text-[10px] tracking-[0.18em] text-[#e5c18a]/45">{String(index + 1).padStart(2, "0")}</span>
                    <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] border border-[#e5c18a]/30 bg-[linear-gradient(145deg,rgba(227,190,133,0.28),rgba(103,65,48,0.20))] text-[#f1cf94] shadow-[0_12px_30px_rgba(17,9,7,0.24),inset_0_1px_0_rgba(255,244,220,0.18)] transition-all duration-500 group-hover:scale-110 group-hover:border-[#f0d09a]/60 group-hover:text-[#fff0ce] group-hover:shadow-[0_16px_38px_rgba(17,9,7,0.32),0_0_26px_rgba(212,166,102,0.16)]">
                      <Icon className="h-7 w-7" strokeWidth={1.65} />
                    </div>
                    <h3 className="mt-5 text-sm font-bold text-[#fff5e8] transition-colors group-hover:text-white sm:text-[15px]">{service.name}</h3>
                    <p className="mt-2 text-xs font-medium text-[#d8c2b2]/75">{service.count}</p>
                    <div className="mx-auto mt-4 h-px w-8 bg-[#d4ae77]/35 transition-all duration-500 group-hover:w-14 group-hover:bg-[#e7c48d]/70" />
                  </Link>
                )
              })}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-[#2b1b17] py-20 sm:py-24">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#dfbd87]/25 to-transparent" />
          <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-[42rem] -translate-x-1/2 rounded-full bg-[#c8985f]/[0.08] blur-3xl" />
          <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mx-auto mb-5 flex w-fit items-center gap-3 text-[#d8b57d]">
                <span className="h-px w-10 bg-gradient-to-r from-transparent to-[#d8b57d]" />
                <span className="text-[10px] font-semibold tracking-[0.34em] sm:text-xs">THE LUXE STANDARD</span>
                <span className="h-px w-10 bg-gradient-to-l from-transparent to-[#d8b57d]" />
              </div>
              <h2 className="font-serif text-3xl font-medium text-[#fff2dc] md:text-5xl">چرا لوکس بیوتی؟</h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#d9c5b7]/75 sm:text-base">از انتخاب تا رزرو، هر جزئیات برای تجربه‌ای مطمئن، آسان و شایستهٔ شما طراحی شده است.</p>
            </div>

            <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <article
                    key={feature.title}
                    className="group relative overflow-hidden rounded-[28px] border border-[#d9b77f]/20 bg-[linear-gradient(145deg,rgba(255,255,255,0.10),rgba(255,255,255,0.035))] p-6 shadow-[0_20px_55px_rgba(12,6,5,0.20),inset_0_1px_0_rgba(255,255,255,0.10)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-1.5 hover:border-[#e5c28b]/45 hover:shadow-[0_28px_70px_rgba(12,6,5,0.32)] sm:p-7"
                  >
                    <span className="absolute left-5 top-4 font-serif text-xs tracking-[0.2em] text-[#cda86f]/35">{String(index + 1).padStart(2, "0")}</span>
                    <div className="flex h-14 w-14 items-center justify-center rounded-[19px] border border-[#d9b77f]/25 bg-[#c39762]/15 text-[#edcc96] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] transition duration-500 group-hover:scale-105 group-hover:bg-[#c39762]/25 group-hover:text-[#fff0ce]">
                      <Icon className="h-6 w-6" strokeWidth={1.55} />
                    </div>
                    <h3 className="mt-6 text-lg font-bold text-[#fff2e1]">{feature.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-[#d9c7bc]/70">{feature.description}</p>
                    <div className="mt-6 h-px w-10 bg-[#cda86f]/30 transition-all duration-500 group-hover:w-20 group-hover:bg-[#e1be84]/60" />
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-[#3b2722] py-20 sm:py-24">
          <div className="pointer-events-none absolute -right-28 top-24 h-80 w-80 rounded-full bg-[#c29560]/10 blur-3xl" />
          <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <div className="mb-4 flex items-center gap-3 text-[#dbba84]">
                  <span className="h-px w-10 bg-gradient-to-r from-transparent to-[#dbba84]" />
                  <span className="text-[10px] font-semibold tracking-[0.34em] sm:text-xs">SELECTED DESTINATIONS</span>
                </div>
                <h2 className="font-serif text-3xl font-medium text-[#fff1dd] md:text-5xl">سالن‌های برتر</h2>
                <p className="mt-4 text-sm leading-7 text-[#ddc9bb]/75 sm:text-base">مجموعه‌ای منتخب از حرفه‌ای‌ترین سالن‌ها با بالاترین امتیاز و رضایت مشتریان.</p>
              </div>
              <Link href="/salons">
                <Button className="h-12 rounded-full border border-[#dfbd87]/35 bg-transparent px-6 text-[#f3d7a7] shadow-none transition hover:border-[#f0cf96]/60 hover:bg-[#e0b979]/10 hover:text-[#fff0d2]">
                  مشاهده همه سالن‌ها
                  <ArrowLeft className="mr-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {featuredSalons.map((salon) => (
                <Link
                  key={salon.id}
                  href={`/salons/${salon.id}`}
                  className="group relative overflow-hidden rounded-[28px] border border-[#d8b37b]/20 bg-[#281914]/70 shadow-[0_24px_65px_rgba(12,6,5,0.28)] transition-all duration-500 hover:-translate-y-2 hover:border-[#e6c189]/45 hover:shadow-[0_34px_80px_rgba(12,6,5,0.42)]"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img src={salon.image} alt={salon.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#21130f] via-[#21130f]/20 to-transparent" />
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    {salon.isVerified ? (
                      <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full border border-[#f0d099]/35 bg-[#2b1914]/65 px-3 py-1.5 text-[11px] font-bold text-[#f2d29e] backdrop-blur-md">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        تایید شده
                      </div>
                    ) : null}
                    <div className="absolute bottom-4 left-4 flex items-center gap-1 rounded-full border border-white/20 bg-black/25 px-2.5 py-1 text-xs text-white backdrop-blur-md">
                      <Star className="h-3.5 w-3.5 fill-[#e8bd75] text-[#e8bd75]" />
                      <span className="font-bold">{salon.rating}</span>
                      <span className="text-white/60">({salon.reviews})</span>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-[#fff1df] transition-colors group-hover:text-white">{salon.name}</h3>
                    <div className="mt-2 flex items-center gap-1.5 text-sm text-[#d4bfb1]/70">
                      <MapPin className="h-4 w-4 text-[#d5ad72]" />
                      {salon.location}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {salon.services.slice(0, 2).map((service) => (
                        <span key={service} className="rounded-full border border-[#d8b37b]/18 bg-[#d3aa70]/10 px-2.5 py-1 text-[11px] font-medium text-[#e2cab9]">{service}</span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-[#241612] py-20 sm:py-24">
          <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-[38rem] -translate-x-1/2 rounded-full bg-[#b88c58]/[0.07] blur-3xl" />
          <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mx-auto mb-5 flex w-fit items-center gap-3 text-[#d8b57d]">
                <span className="h-px w-10 bg-gradient-to-r from-transparent to-[#d8b57d]" />
                <span className="text-[10px] font-semibold tracking-[0.34em] sm:text-xs">BEAUTY ACROSS IRAN</span>
                <span className="h-px w-10 bg-gradient-to-l from-transparent to-[#d8b57d]" />
              </div>
              <h2 className="font-serif text-3xl font-medium text-[#fff1dc] md:text-5xl">شهرهای محبوب</h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#d9c4b5]/70 sm:text-base">بهترین خدمات زیبایی را در نزدیک‌ترین نقطه به خود کشف کنید.</p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {cities.map((city, index) => (
                <Link
                  key={city.name}
                  href={`/salons?city=${city.name}`}
                  className="group relative min-h-[290px] overflow-hidden rounded-[30px] border border-[#d9b77f]/22 shadow-[0_24px_65px_rgba(8,4,3,0.32)]"
                >
                  <img src={city.image} alt={city.name} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1b0f0c] via-[#1b0f0c]/38 to-[#1b0f0c]/5" />
                  <div className="absolute inset-0 border-[10px] border-transparent transition-all duration-500 group-hover:border-[#e2bd82]/10" />
                  <span className="absolute left-5 top-5 font-serif text-xs tracking-[0.2em] text-white/50">{String(index + 1).padStart(2, "0")}</span>
                  <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                    <div className="mb-3 h-px w-10 bg-[#e4c087]/65 transition-all duration-500 group-hover:w-20" />
                    <h3 className="font-serif text-2xl font-medium">{city.name}</h3>
                    <p className="mt-1 text-sm text-white/65">{city.count}</p>
                    <span className="mt-4 inline-flex items-center text-xs font-semibold text-[#efce98] opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100">
                      مشاهده سالن‌ها
                      <ArrowLeft className="mr-2 h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-[#3b2722] py-20 sm:py-24">
          <div className="pointer-events-none absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-[#c1945e]/[0.08] blur-3xl" />
          <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mx-auto mb-5 flex w-fit items-center gap-3 text-[#dab780]">
                <span className="h-px w-10 bg-gradient-to-r from-transparent to-[#dab780]" />
                <span className="text-[10px] font-semibold tracking-[0.34em] sm:text-xs">CLIENT STORIES</span>
                <span className="h-px w-10 bg-gradient-to-l from-transparent to-[#dab780]" />
              </div>
              <h2 className="font-serif text-3xl font-medium text-[#fff1dc] md:text-5xl">نظرات کاربران</h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#ddc9bb]/70 sm:text-base">تجربه‌های واقعی از انتخاب‌های زیبا و رزروهای بی‌دردسر.</p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {testimonials.map((testimonial, testimonialIndex) => (
                <article
                  key={testimonial.name}
                  className="relative overflow-hidden rounded-[30px] border border-[#d8b37b]/20 bg-[linear-gradient(145deg,rgba(255,255,255,0.10),rgba(255,255,255,0.035))] p-6 shadow-[0_24px_65px_rgba(12,6,5,0.24),inset_0_1px_0_rgba(255,255,255,0.10)] backdrop-blur-xl sm:p-7"
                >
                  <div className="absolute -left-2 -top-8 font-serif text-[110px] leading-none text-[#e1bd84]/[0.09]">“</div>
                  <div className="relative flex gap-1 text-[#e7bd79]">
                    {[...Array(5)].map((_, index) => <Star key={index} className="h-4 w-4 fill-current" />)}
                  </div>
                  <p className="relative mt-5 text-sm leading-8 text-[#ead8ca]/78">{testimonial.content}</p>
                  <div className="relative mt-7 flex items-center gap-3 border-t border-[#d7b17a]/15 pt-5">
                    <div className="rounded-full border border-[#e2be84]/35 p-1">
                      <img src={testimonial.avatar} alt={testimonial.name} className="h-11 w-11 rounded-full object-cover" />
                    </div>
                    <div>
                      <div className="font-bold text-[#fff1df]">{testimonial.name}</div>
                      <div className="mt-0.5 text-xs text-[#cfb8a9]/65">{testimonial.role}</div>
                    </div>
                    <span className="mr-auto font-serif text-xs tracking-[0.18em] text-[#d1aa70]/35">{String(testimonialIndex + 1).padStart(2, "0")}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-[#21130f] px-4 py-20 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="relative overflow-hidden rounded-[36px] border border-[#e1bd84]/25 bg-[radial-gradient(circle_at_50%_0%,rgba(202,153,92,0.22),transparent_42%),linear-gradient(135deg,#4a2f27_0%,#2d1b17_55%,#20120f_100%)] px-6 py-14 text-center shadow-[0_35px_90px_rgba(8,4,3,0.42),inset_0_1px_0_rgba(255,255,255,0.10)] sm:px-10 sm:py-16 md:px-16">
              <div className="pointer-events-none absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-[#f0ce95]/70 to-transparent" />
              <div className="pointer-events-none absolute -left-20 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full border border-[#d4ab70]/10" />
              <div className="pointer-events-none absolute -right-20 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full border border-[#d4ab70]/10" />

              <div className="relative mx-auto max-w-3xl">
                <div className="mx-auto mb-5 flex w-fit items-center gap-3 text-[#e2be85]">
                  <span className="h-px w-10 bg-gradient-to-r from-transparent to-[#e2be85]" />
                  <span className="text-[10px] font-semibold tracking-[0.34em] sm:text-xs">GROW WITH LUXE BEAUTY</span>
                  <span className="h-px w-10 bg-gradient-to-l from-transparent to-[#e2be85]" />
                </div>
                <h2 className="font-serif text-3xl font-medium text-[#fff1dc] md:text-5xl">صاحب سالن زیبایی هستید؟</h2>
                <p className="mx-auto mt-5 max-w-2xl text-sm leading-8 text-[#e0ccbe]/75 sm:text-base">
                  سالن خود را به ویترین حرفه‌ای لوکس بیوتی اضافه کنید، مدیریت رزروها را ساده‌تر کنید و به مشتریان بیشتری دسترسی داشته باشید.
                </p>
                <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <Link href="/salon-register">
                    <Button size="lg" className="h-[52px] rounded-full bg-[linear-gradient(135deg,#f0d39b_0%,#c7944f_58%,#9e6d31_100%)] px-8 font-bold text-[#2b190f] shadow-[0_16px_40px_rgba(137,88,38,0.32)] transition hover:-translate-y-0.5 hover:brightness-105">
                      ثبت رایگان سالن
                      <ArrowLeft className="mr-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/pricing">
                    <Button size="lg" variant="outline" className="h-[52px] rounded-full border-[#e3bf88]/35 bg-transparent px-8 text-[#f0d7ae] transition hover:border-[#f0cf98]/60 hover:bg-[#e4bd80]/10 hover:text-[#fff1d5]">
                      مشاهده تعرفه‌ها
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
