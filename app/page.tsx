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
    <div className="flex min-h-screen flex-col bg-background">
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

        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-foreground md:text-4xl">چرا سالن یاب؟</h2>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">امکانات منحصر به فردی که تجربه رزرو را متحول می‌کند</p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon
                return (
                  <div key={feature.title} className="group rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-foreground">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-card py-20">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h2 className="text-3xl font-bold text-foreground md:text-4xl">سالن‌های برتر</h2>
                <p className="mt-2 text-muted-foreground">محبوب‌ترین آرایشگاه‌های این هفته</p>
              </div>
              <Link href="/salons">
                <Button variant="outline" className="border-border hover:bg-secondary">
                  مشاهده همه
                  <ArrowLeft className="mr-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {featuredSalons.map((salon) => (
                <Link key={salon.id} href={`/salons/${salon.id}`} className="group overflow-hidden rounded-2xl border border-border bg-background transition-all hover:shadow-lg hover:shadow-primary/5">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img src={salon.image} alt={salon.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    {salon.isVerified && (
                      <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-accent px-2 py-1 text-xs text-accent-foreground">
                        <ShieldCheck className="h-3 w-3" />
                        تایید شده
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground">{salon.name}</h3>
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="h-4 w-4 fill-current text-amber-500" />
                        <span className="font-medium text-foreground">{salon.rating}</span>
                        <span className="text-muted-foreground">({salon.reviews})</span>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {salon.location}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {salon.services.slice(0, 2).map((service) => (
                        <span key={service} className="rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground">{service}</span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-foreground md:text-4xl">شهرهای محبوب</h2>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">آرایشگاه‌های نزدیک به خود را در سراسر ایران پیدا کنید</p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {cities.map((city) => (
                <Link key={city.name} href={`/salons?city=${city.name}`} className="group relative overflow-hidden rounded-2xl">
                  <div className="aspect-[3/2]">
                    <img src={city.image} alt={city.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                    <h3 className="text-lg font-semibold">{city.name}</h3>
                    <p className="text-sm text-white/80">{city.count}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-card py-20">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-foreground md:text-4xl">نظرات کاربران</h2>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">تجربه کاربران واقعی از استفاده از سالن یاب</p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {testimonials.map((testimonial) => (
                <div key={testimonial.name} className="rounded-2xl border border-border bg-background p-6">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, index) => <Star key={index} className="h-4 w-4 fill-current text-amber-500" />)}
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{testimonial.content}</p>
                  <div className="mt-6 flex items-center gap-3">
                    <img src={testimonial.avatar} alt={testimonial.name} className="h-10 w-10 rounded-full object-cover" />
                    <div>
                      <div className="font-medium text-foreground">{testimonial.name}</div>
                      <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-16 text-center md:px-16">
              <div className="absolute left-0 top-0 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

              <div className="relative">
                <h2 className="text-3xl font-bold text-primary-foreground md:text-4xl">صاحب آرایشگاه هستید؟</h2>
                <p className="mx-auto mt-4 max-w-2xl text-primary-foreground/80">
                  همین امروز آرایشگاه خود را در سالن یاب ثبت کنید و به هزاران مشتری جدید دسترسی پیدا کنید. اولین ماه کاملا رایگان است.
                </p>
                <div className="mt-8 flex flex-col items-center justify-center gap-4 md:flex-row">
                  <Link href="/salon-register">
                    <Button size="lg" variant="secondary" className="px-8">
                      ثبت رایگان آرایشگاه
                      <ArrowLeft className="mr-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/pricing">
                    <Button size="lg" variant="outline" className="border-primary-foreground/30 bg-transparent px-8 text-primary-foreground hover:bg-primary-foreground/10">
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
