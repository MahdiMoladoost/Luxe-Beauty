import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}

function MapPinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function StarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

function ArrowLeftIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  )
}

function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function ShieldCheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </svg>
  )
}

function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function CreditCardIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  )
}

function CalendarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </svg>
  )
}

function ScissorsIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="6" cy="6" r="3" />
      <path d="M8.12 8.12 12 12" />
      <path d="M20 4 8.12 15.88" />
      <circle cx="6" cy="18" r="3" />
      <path d="M14.8 14.8 20 20" />
    </svg>
  )
}

function PaletteIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
      <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
      <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z" />
    </svg>
  )
}

function HeartIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  )
}

function GemIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 3h12l4 6-10 13L2 9Z" />
      <path d="M11 3 8 9l4 13 4-13-3-6" />
      <path d="M2 9h20" />
    </svg>
  )
}

function UserIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function SprayCanIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 3h.01" />
      <path d="M7 5h.01" />
      <path d="M11 7h.01" />
      <path d="M3 7h.01" />
      <path d="M7 9h.01" />
      <path d="M3 11h.01" />
      <rect width="4" height="4" x="15" y="5" />
      <path d="m19 9 2 2v10c0 .6-.4 1-1 1h-6c-.6 0-1-.4-1-1V11l2-2" />
      <path d="m13 14 8-2" />
      <path d="m13 19 8-2" />
    </svg>
  )
}

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
  { name: "کوتاهی مو", icon: ScissorsIcon, count: "2,450 سالن" },
  { name: "رنگ و هایلایت", icon: PaletteIcon, count: "1,890 سالن" },
  { name: "آرایش عروس", icon: HeartIcon, count: "987 سالن" },
  { name: "مانیکور و پدیکور", icon: GemIcon, count: "1,567 سالن" },
  { name: "مراقبت پوست", icon: SprayCanIcon, count: "1,234 سالن" },
  { name: "اصلاح آقایان", icon: UserIcon, count: "2,100 سالن" },
]

const cities = [
  { name: "تهران", count: "1,234 سالن", image: "https://images.unsplash.com/photo-1567449303078-57ad995bd329?w=300&h=200&fit=crop" },
  { name: "اصفهان", count: "456 سالن", image: "https://images.unsplash.com/photo-1565073624497-7144969d0a07?w=300&h=200&fit=crop" },
  { name: "شیراز", count: "389 سالن", image: "https://images.unsplash.com/photo-1576834241653-43b0e6d9b79d?w=300&h=200&fit=crop" },
  { name: "مشهد", count: "512 سالن", image: "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=300&h=200&fit=crop" },
]

const features = [
  {
    icon: ClockIcon,
    title: "رزرو آنلاین لحظه‌ای",
    description: "در هر ساعتی از شبانه‌روز، بدون نیاز به تماس تلفنی، نوبت خود را رزرو کنید.",
  },
  {
    icon: ShieldCheckIcon,
    title: "سالن‌های تایید شده",
    description: "تمام آرایشگاه‌ها توسط تیم کارشناسی ما بررسی و اعتبارسنجی شده‌اند.",
  },
  {
    icon: SparklesIcon,
    title: "نمونه‌کار و پورتفولیو",
    description: "قبل از رزرو، نمونه‌کارهای آرایشگران را مشاهده و مقایسه کنید.",
  },
  {
    icon: UsersIcon,
    title: "نظرات واقعی مشتریان",
    description: "بر اساس تجربیات واقعی کاربران، بهترین انتخاب را داشته باشید.",
  },
  {
    icon: CreditCardIcon,
    title: "پرداخت امن آنلاین",
    description: "امکان پرداخت آنلاین امن با درگاه‌های معتبر بانکی ایران.",
  },
  {
    icon: CalendarIcon,
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
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
          <div className="absolute top-20 right-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-20 left-20 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
          
          <div className="relative mx-auto max-w-7xl px-4 py-24 lg:px-8 lg:py-32">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                بیش از 5,000 آرایشگاه فعال در سراسر ایران
              </div>
              
              <h1 className="mx-auto mt-8 max-w-4xl text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
                پلتفرم هوشمند رزرو
                <span className="block mt-2 gradient-text">خدمات زیبایی</span>
              </h1>
              
              <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground leading-relaxed">
                جستجو، مقایسه و رزرو آنلاین بهترین آرایشگاه‌ها و سالن‌های زیبایی.
                تجربه‌ای متفاوت از دنیای زیبایی با سالن یاب.
              </p>
              
              {/* Search Box */}
              <div className="mx-auto mt-10 max-w-3xl">
                <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-xl shadow-primary/5 md:flex-row md:items-center">
                  <div className="flex flex-1 items-center gap-3 rounded-xl bg-secondary/50 px-4 py-3">
                    <SearchIcon className="h-5 w-5 text-muted-foreground shrink-0" />
                    <Input 
                      type="text" 
                      placeholder="نام سالن یا نوع خدمت..." 
                      className="border-0 bg-transparent p-0 text-foreground placeholder:text-muted-foreground focus-visible:ring-0"
                    />
                  </div>
                  <div className="flex flex-1 items-center gap-3 rounded-xl bg-secondary/50 px-4 py-3">
                    <MapPinIcon className="h-5 w-5 text-muted-foreground shrink-0" />
                    <Input 
                      type="text" 
                      placeholder="شهر یا منطقه..." 
                      className="border-0 bg-transparent p-0 text-foreground placeholder:text-muted-foreground focus-visible:ring-0"
                    />
                  </div>
                  <Link href="/salons" className="shrink-0">
                    <Button size="lg" className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground px-8">
                      جستجو
                      <ArrowLeftIcon className="mr-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-16 grid grid-cols-2 gap-8 md:grid-cols-4">
                {[
                  { value: "5,000+", label: "آرایشگاه فعال" },
                  { value: "150,000+", label: "رزرو موفق" },
                  { value: "31", label: "استان" },
                  { value: "4.8", label: "میانگین امتیاز" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className="text-3xl font-bold text-foreground tabular-nums md:text-4xl">{stat.value}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="border-y border-border bg-card py-20">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-foreground md:text-4xl">خدمات محبوب</h2>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                انواع خدمات آرایشگاهی و زیبایی را جستجو و رزرو کنید
              </p>
            </div>
            
            <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
              {services.map((service) => (
                <Link 
                  key={service.name} 
                  href={`/salons?service=${service.name}`}
                  className="group flex flex-col items-center rounded-2xl border border-border bg-background p-6 text-center transition-all hover:border-primary hover:shadow-lg hover:shadow-primary/5"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <service.icon />
                  </div>
                  <span className="mt-4 font-medium text-foreground">{service.name}</span>
                  <span className="mt-1 text-xs text-muted-foreground">{service.count}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-foreground md:text-4xl">چرا سالن یاب؟</h2>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                امکانات منحصر به فردی که تجربه رزرو را متحول می‌کند
              </p>
            </div>
            
            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div 
                  key={feature.title}
                  className="group rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-foreground">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Salons */}
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
                  <ArrowLeftIcon className="mr-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            
            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {featuredSalons.map((salon) => (
                <Link 
                  key={salon.id} 
                  href={`/salons/${salon.id}`}
                  className="group overflow-hidden rounded-2xl border border-border bg-background transition-all hover:shadow-lg hover:shadow-primary/5"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img 
                      src={salon.image} 
                      alt={salon.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {salon.isVerified && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-accent px-2 py-1 text-xs text-accent-foreground">
                        <ShieldCheckIcon className="h-3 w-3" />
                        تایید شده
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground">{salon.name}</h3>
                      <div className="flex items-center gap-1 text-sm">
                        <StarIcon className="h-4 w-4 text-amber-500" />
                        <span className="font-medium text-foreground">{salon.rating}</span>
                        <span className="text-muted-foreground">({salon.reviews})</span>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPinIcon className="h-4 w-4" />
                      {salon.location}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {salon.services.slice(0, 2).map((service) => (
                        <span 
                          key={service}
                          className="rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground"
                        >
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Cities Section */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-foreground md:text-4xl">شهرهای محبوب</h2>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                آرایشگاه‌های نزدیک به خود را در سراسر ایران پیدا کنید
              </p>
            </div>
            
            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {cities.map((city) => (
                <Link 
                  key={city.name}
                  href={`/salons?city=${city.name}`}
                  className="group relative overflow-hidden rounded-2xl"
                >
                  <div className="aspect-[3/2]">
                    <img 
                      src={city.image} 
                      alt={city.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  </div>
                  <div className="absolute bottom-0 right-0 left-0 p-4 text-white">
                    <h3 className="text-lg font-semibold">{city.name}</h3>
                    <p className="text-sm text-white/80">{city.count}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="border-y border-border bg-card py-20">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-foreground md:text-4xl">نظرات کاربران</h2>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                تجربه کاربران واقعی از استفاده از سالن یاب
              </p>
            </div>
            
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {testimonials.map((testimonial) => (
                <div 
                  key={testimonial.name}
                  className="rounded-2xl border border-border bg-background p-6"
                >
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon key={i} className="h-4 w-4 text-amber-500" />
                    ))}
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    {testimonial.content}
                  </p>
                  <div className="mt-6 flex items-center gap-3">
                    <img 
                      src={testimonial.avatar} 
                      alt={testimonial.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
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

        {/* CTA Section */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-16 text-center md:px-16">
              <div className="absolute top-0 left-0 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
              
              <div className="relative">
                <h2 className="text-3xl font-bold text-primary-foreground md:text-4xl">
                  صاحب آرایشگاه هستید؟
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-primary-foreground/80">
                  همین امروز آرایشگاه خود را در سالن یاب ثبت کنید و به هزاران مشتری جدید دسترسی پیدا کنید.
                  اولین ماه کاملا رایگان است.
                </p>
                <div className="mt-8 flex flex-col items-center justify-center gap-4 md:flex-row">
                  <Link href="/salon-register">
                    <Button size="lg" variant="secondary" className="px-8">
                      ثبت رایگان آرایشگاه
                      <ArrowLeftIcon className="mr-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/pricing">
                    <Button 
                      size="lg" 
                      variant="outline" 
                      className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 px-8"
                    >
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
