"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import {
  Bell,
  CalendarDays,
  ChevronDown,
  Heart,
  Home,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  MessageCircle,
  Search,
  Sparkles,
  Star,
  Store,
  UserRound,
  Wallet,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type MenuLink = {
  label: string
  href: string
}

type MenuSection = {
  title: string
  links: MenuLink[]
}

type MegaMenu = {
  label: string
  href: string
  eyebrow: string
  description: string
  sections: MenuSection[]
}

const AUTH_STORAGE_KEY = "luxe-beauty-authenticated"
const CITY_STORAGE_KEY = "luxe-beauty-city"

const popularCities = ["تهران", "کرج", "مشهد", "اصفهان", "شیراز", "تبریز", "قم", "اهواز", "رشت"]

const desktopNavigation: MegaMenu[] = [
  {
    label: "خدمات",
    href: "/salons",
    eyebrow: "رزرو بر اساس نیاز شما",
    description: "خدمت مناسب را پیدا کنید و زمان‌های آزاد ارائه‌دهندگان را مقایسه کنید.",
    sections: [
      {
        title: "گروه خدمات",
        links: [
          { label: "بانوان", href: "/salons?audience=women" },
          { label: "آقایان", href: "/salons?audience=men" },
          { label: "کودکان", href: "/salons?audience=children" },
        ],
      },
      {
        title: "رزرو ویژه",
        links: [
          { label: "خدمات در منزل", href: "/salons?service=home" },
          { label: "عروس و داماد", href: "/salons?service=wedding" },
          { label: "مشاهده همه خدمات", href: "/salons" },
        ],
      },
    ],
  },
  {
    label: "سالن‌ها و متخصصان",
    href: "/salons",
    eyebrow: "انتخاب مطمئن‌تر",
    description: "برترین سالن‌ها و متخصصان مستقل را بر اساس موقعیت، امتیاز و نمونه‌کار ببینید.",
    sections: [
      {
        title: "سالن‌ها",
        links: [
          { label: "سالن‌های نزدیک من", href: "/salons?sort=nearby" },
          { label: "سالن‌های برتر", href: "/salons?sort=top" },
          { label: "سالن‌های زنانه", href: "/salons?type=women" },
          { label: "آرایشگاه‌های مردانه", href: "/salons?type=men" },
          { label: "آرایشگاه کودک", href: "/salons?type=children" },
        ],
      },
      {
        title: "متخصصان",
        links: [
          { label: "متخصصان برتر", href: "/salons?provider=specialist&sort=top" },
          { label: "متخصصان مستقل", href: "/salons?provider=independent" },
          { label: "مراکز خدمات در منزل", href: "/salons?provider=home-service" },
        ],
      },
    ],
  },
  {
    label: "نوبت امروز",
    href: "/salons?availability=today",
    eyebrow: "برای همین امروز",
    description: "زمان‌های خالی نزدیک را سریع ببینید و بدون تماس تلفنی رزرو کنید.",
    sections: [
      {
        title: "رزرو سریع",
        links: [
          { label: "نوبت‌های خالی امروز", href: "/salons?availability=today" },
          { label: "نوبت فوری", href: "/salons?availability=urgent" },
        ],
      },
      {
        title: "زمان‌های پیشنهادی",
        links: [
          { label: "اولین زمان‌های آزاد", href: "/salons?sort=first-available" },
          { label: "نوبت‌های آخر هفته", href: "/salons?availability=weekend" },
        ],
      },
    ],
  },
  {
    label: "تخفیف‌ها",
    href: "/salons?offer=discount",
    eyebrow: "پیشنهادهای به‌صرفه",
    description: "تخفیف‌ها و پکیج‌های فعال را بر اساس شهر و خدمت مقایسه کنید.",
    sections: [
      {
        title: "تخفیف‌های فعال",
        links: [
          { label: "تخفیف‌های امروز", href: "/salons?offer=today" },
          { label: "اولین رزرو", href: "/salons?offer=first-booking" },
          { label: "ساعات کم‌تقاضا", href: "/salons?offer=off-peak" },
        ],
      },
      {
        title: "پیشنهادها",
        links: [
          { label: "پیشنهادهای ویژه", href: "/salons?offer=special" },
          { label: "پکیج‌ها", href: "/salons?offer=packages" },
        ],
      },
    ],
  },
  {
    label: "شهرها",
    href: "/salons",
    eyebrow: "زیبایی در نزدیکی شما",
    description: "شهر را انتخاب کنید تا سالن‌ها، متخصصان و زمان‌های آزاد همان منطقه نمایش داده شوند.",
    sections: [
      {
        title: "شهرهای محبوب",
        links: [
          { label: "تهران", href: "/salons?city=تهران" },
          { label: "کرج", href: "/salons?city=کرج" },
          { label: "مشهد", href: "/salons?city=مشهد" },
          { label: "اصفهان", href: "/salons?city=اصفهان" },
          { label: "شیراز", href: "/salons?city=شیراز" },
        ],
      },
      {
        title: "شهرهای بیشتر",
        links: [
          { label: "تبریز", href: "/salons?city=تبریز" },
          { label: "قم", href: "/salons?city=قم" },
          { label: "اهواز", href: "/salons?city=اهواز" },
          { label: "رشت", href: "/salons?city=رشت" },
          { label: "مشاهده همه شهرها", href: "/salons" },
        ],
      },
    ],
  },
  {
    label: "نمونه‌کارها",
    href: "/salons?view=portfolio",
    eyebrow: "قبل از انتخاب ببینید",
    description: "نمونه‌کارها را بر اساس سبک و خدمت مرور کنید و ارائه‌دهنده مناسب را پیدا کنید.",
    sections: [
      {
        title: "دسته‌بندی‌ها",
        links: [
          { label: "مو", href: "/salons?portfolio=hair" },
          { label: "ناخن", href: "/salons?portfolio=nails" },
          { label: "میکاپ", href: "/salons?portfolio=makeup" },
          { label: "عروس", href: "/salons?portfolio=bride" },
        ],
      },
      {
        title: "بیشتر ببینید",
        links: [
          { label: "پوست", href: "/salons?portfolio=skin" },
          { label: "مردانه", href: "/salons?portfolio=men" },
          { label: "قبل و بعد", href: "/salons?portfolio=before-after" },
        ],
      },
    ],
  },
  {
    label: "مجله",
    href: "/magazine",
    eyebrow: "مجله زیبایی",
    description: "راهنماهای کاربردی برای انتخاب خدمت، مراقبت روزمره و رشد کسب‌وکار زیبایی.",
    sections: [
      {
        title: "مراقبت و زیبایی",
        links: [
          { label: "مراقبت مو", href: "/magazine?category=hair" },
          { label: "ناخن", href: "/magazine?category=nails" },
          { label: "آرایش و میکاپ", href: "/magazine?category=makeup" },
          { label: "مراقبت پوست غیرپزشکی", href: "/magazine?category=skin-care" },
        ],
      },
      {
        title: "راهنماها",
        links: [
          { label: "راهنمای انتخاب سالن", href: "/magazine?category=salon-guide" },
          { label: "آموزش ارائه‌دهندگان", href: "/magazine?category=providers" },
        ],
      },
    ],
  },
  {
    label: "پشتیبانی",
    href: "/contact",
    eyebrow: "همراه شما در رزرو",
    description: "برای مدیریت نوبت، بازپرداخت یا ثبت شکایت، مسیر مناسب را سریع پیدا کنید.",
    sections: [
      {
        title: "مدیریت نوبت",
        links: [
          { label: "راهنمای رزرو", href: "/support/booking-guide" },
          { label: "پیگیری نوبت", href: "/dashboard/appointments" },
          { label: "لغو و تغییر زمان", href: "/support/change-booking" },
        ],
      },
      {
        title: "پرداخت و پیگیری",
        links: [
          { label: "بازپرداخت", href: "/support/refund" },
          { label: "ثبت شکایت", href: "/support/complaint" },
        ],
      },
      {
        title: "راهنما",
        links: [
          { label: "سؤالات پرتکرار", href: "/support/faq" },
          { label: "تماس با ما", href: "/contact" },
        ],
      },
    ],
  },
]

const providerLinks: MenuLink[] = [
  { label: "ثبت سالن زیبایی", href: "/salon-register?type=beauty-salon" },
  { label: "ثبت آرایشگاه مردانه", href: "/salon-register?type=barbershop" },
  { label: "ثبت متخصص مستقل", href: "/salon-register?type=independent" },
  { label: "ثبت متخصص خدمات در منزل", href: "/salon-register?type=home-service" },
  { label: "ورود ارائه‌دهندگان", href: "/salon-dashboard" },
  { label: "مشاهده تعرفه‌ها", href: "/pricing" },
]

const accountLinks = [
  { label: "داشبورد", href: "/dashboard", icon: LayoutDashboard },
  { label: "نوبت‌های من", href: "/dashboard/appointments", icon: CalendarDays },
  { label: "پیام‌ها", href: "/dashboard/messages", icon: MessageCircle },
  { label: "کیف پول", href: "/dashboard/wallet", icon: Wallet },
  { label: "علاقه‌مندی‌ها", href: "/dashboard/favorites", icon: Heart },
  { label: "نظرات من", href: "/dashboard/reviews", icon: Star },
  { label: "پشتیبانی", href: "/contact", icon: MessageCircle },
]

const mobileNavigation: MenuLink[] = [
  { label: "خدمات", href: "/salons" },
  { label: "سالن‌ها", href: "/salons?provider=salon" },
  { label: "متخصصان", href: "/salons?provider=specialist" },
  { label: "نوبت امروز", href: "/salons?availability=today" },
  { label: "تخفیف‌ها", href: "/salons?offer=discount" },
  { label: "شهرها", href: "/salons" },
  { label: "نمونه‌کارها", href: "/salons?view=portfolio" },
  { label: "مجله", href: "/magazine" },
  { label: "پشتیبانی", href: "/contact" },
  { label: "ثبت سالن یا متخصص", href: "/salon-register" },
]

const bottomNavigation = [
  { label: "خانه", href: "/", icon: Home },
  { label: "جست‌وجو", href: "/salons", icon: Search },
  { label: "نوبت‌ها", href: "/dashboard/appointments", icon: CalendarDays },
  { label: "علاقه‌مندی‌ها", href: "/dashboard/favorites", icon: Heart },
  { label: "حساب من", href: "/dashboard", icon: UserRound },
]

function Brand() {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="لوکس بیوتی، صفحه اصلی">
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm shadow-primary/20">
        <Sparkles className="h-5 w-5" />
      </span>
      <span className="hidden text-lg font-black tracking-tight text-foreground sm:block xl:hidden 2xl:block">لوکس بیوتی</span>
    </Link>
  )
}

function HeaderIconLink({
  href,
  label,
  children,
  badge,
}: {
  href: string
  label: string
  children: React.ReactNode
  badge?: boolean
}) {
  return (
    <Link
      href={href}
      title={label}
      aria-label={label}
      className="relative flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground"
    >
      {children}
      {badge && <span className="absolute left-2 top-2 h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />}
    </Link>
  )
}

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeMenuLabel, setActiveMenuLabel] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [selectedCity, setSelectedCity] = useState("تهران")

  const activeMenu = useMemo(
    () => desktopNavigation.find((item) => item.label === activeMenuLabel) ?? null,
    [activeMenuLabel],
  )

  useEffect(() => {
    setIsAuthenticated(window.localStorage.getItem(AUTH_STORAGE_KEY) === "true")
    setSelectedCity(window.localStorage.getItem(CITY_STORAGE_KEY) || "تهران")

    const syncAuth = () => {
      setIsAuthenticated(window.localStorage.getItem(AUTH_STORAGE_KEY) === "true")
    }

    window.addEventListener("storage", syncAuth)
    window.addEventListener("luxe-beauty-auth-change", syncAuth)

    return () => {
      window.removeEventListener("storage", syncAuth)
      window.removeEventListener("luxe-beauty-auth-change", syncAuth)
    }
  }, [])

  useEffect(() => {
    if (!mobileMenuOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [mobileMenuOpen])

  const chooseCity = (city: string) => {
    setSelectedCity(city)
    window.localStorage.setItem(CITY_STORAGE_KEY, city)
  }

  const logout = () => {
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
    setIsAuthenticated(false)
    window.dispatchEvent(new Event("luxe-beauty-auth-change"))
    window.location.assign("/")
  }

  return (
    <>
      <header
        className="fixed inset-x-0 top-0 z-50 border-b border-border/70 bg-background/95 shadow-sm backdrop-blur-xl"
        onMouseLeave={() => setActiveMenuLabel(null)}
      >
        <div className="mx-auto hidden h-16 max-w-[1600px] items-center justify-between gap-3 px-4 xl:flex 2xl:px-8">
          <div className="flex shrink-0 items-center gap-3">
            <Brand />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-3 text-right text-sm hover:border-primary/40 hover:bg-secondary/60"
                >
                  <MapPin className="h-4 w-4 shrink-0 text-primary" />
                  <span className="leading-tight">
                    <span className="block font-semibold text-foreground">{selectedCity}</span>
                    <span className="hidden text-[10px] text-muted-foreground 2xl:block">انتخاب شهر و محله</span>
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 p-2">
                <DropdownMenuLabel>شهر شما</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="grid grid-cols-2 gap-1">
                  {popularCities.map((city) => (
                    <DropdownMenuItem key={city} onSelect={() => chooseCity(city)} className="justify-center">
                      {city}
                    </DropdownMenuItem>
                  ))}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/salons" className="justify-center font-medium text-primary">
                    مشاهده همه شهرها
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <nav className="flex min-w-0 flex-1 items-stretch justify-center self-stretch" aria-label="منوی اصلی">
            {desktopNavigation.map((item) => {
              const isActive = activeMenuLabel === item.label

              return (
                <button
                  key={item.label}
                  type="button"
                  aria-expanded={isActive}
                  onMouseEnter={() => setActiveMenuLabel(item.label)}
                  onFocus={() => setActiveMenuLabel(item.label)}
                  onClick={() => setActiveMenuLabel(isActive ? null : item.label)}
                  className={`relative flex items-center gap-1 whitespace-nowrap px-2 text-[11px] font-semibold transition-colors xl:px-3 xl:text-xs 2xl:px-4 2xl:text-sm ${
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.label}
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isActive ? "rotate-180" : ""}`} />
                  {isActive && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary" />}
                </button>
              )
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-1">
            <HeaderIconLink href="/salons" label="جست‌وجو">
              <Search className="h-5 w-5" />
            </HeaderIconLink>
            <HeaderIconLink href="/dashboard/favorites" label="علاقه‌مندی‌ها">
              <Heart className="h-5 w-5" />
            </HeaderIconLink>
            <HeaderIconLink href="/dashboard/appointments" label="نوبت‌های من">
              <CalendarDays className="h-5 w-5" />
            </HeaderIconLink>
            <HeaderIconLink href="/dashboard/notifications" label="اعلان‌ها" badge>
              <Bell className="h-5 w-5" />
            </HeaderIconLink>

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2 px-2 xl:px-3">
                    <UserRound className="h-4 w-4" />
                    <span className="hidden 2xl:inline">حساب من</span>
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-2">
                  <DropdownMenuLabel>حساب کاربری</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {accountLinks.map((item) => (
                    <DropdownMenuItem key={item.label} asChild>
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onSelect={logout}>
                    <LogOut className="h-4 w-4" />
                    خروج
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/auth/login">
                <Button variant="ghost" size="sm" className="whitespace-nowrap px-2 xl:px-3">
                  ورود / ثبت‌نام
                </Button>
              </Link>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="mr-1 gap-2 whitespace-nowrap shadow-sm shadow-primary/20">
                  <Store className="h-4 w-4" />
                  <span className="hidden xl:inline">ثبت سالن یا متخصص</span>
                  <span className="xl:hidden">ثبت ارائه‌دهنده</span>
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-2">
                <DropdownMenuLabel>همکاری با لوکس بیوتی</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {providerLinks.map((item, index) => (
                  <div key={item.label}>
                    {index === 4 && <DropdownMenuSeparator />}
                    <DropdownMenuItem asChild>
                      <Link href={item.href}>{item.label}</Link>
                    </DropdownMenuItem>
                  </div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 xl:hidden">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label={mobileMenuOpen ? "بستن منو" : "باز کردن منو"}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-secondary"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <Brand />
          </div>

          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex h-10 max-w-24 items-center gap-1 rounded-xl px-2 text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <MapPin className="h-4 w-4 shrink-0 text-primary" />
                  <span className="truncate">{selectedCity}</span>
                  <ChevronDown className="h-3 w-3 shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-2">
                <DropdownMenuLabel>انتخاب شهر</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="grid grid-cols-2 gap-1">
                  {popularCities.map((city) => (
                    <DropdownMenuItem key={city} onSelect={() => chooseCity(city)} className="justify-center">
                      {city}
                    </DropdownMenuItem>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            <Link
              href="/salons"
              aria-label="جست‌وجو"
              className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-secondary"
            >
              <Search className="h-5 w-5" />
            </Link>
          </div>
        </div>

        {activeMenu && (
          <div className="absolute inset-x-0 top-full hidden border-t border-border bg-card shadow-xl shadow-foreground/5 xl:block">
            <div className="mx-auto grid max-w-7xl grid-cols-[minmax(250px,0.8fr)_2fr] gap-10 px-8 py-7">
              <div className="rounded-2xl bg-primary/5 p-5">
                <span className="text-xs font-bold text-primary">{activeMenu.eyebrow}</span>
                <h2 className="mt-2 text-xl font-black text-foreground">{activeMenu.label}</h2>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{activeMenu.description}</p>
                <Link
                  href={activeMenu.href}
                  onClick={() => setActiveMenuLabel(null)}
                  className="mt-5 inline-flex items-center text-sm font-bold text-primary hover:underline"
                >
                  مشاهده همه
                </Link>
              </div>

              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {activeMenu.sections.map((section) => (
                  <div key={section.title}>
                    <h3 className="text-sm font-black text-foreground">{section.title}</h3>
                    <ul className="mt-3 space-y-1">
                      {section.links.map((link) => (
                        <li key={link.label}>
                          <Link
                            href={link.href}
                            onClick={() => setActiveMenuLabel(null)}
                            className="block rounded-lg px-2 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
                          >
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 xl:hidden">
          <button
            type="button"
            aria-label="بستن منو"
            className="absolute inset-0 bg-foreground/35 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="absolute bottom-16 right-0 top-16 flex w-[min(88vw,360px)] flex-col border-l border-border bg-card shadow-2xl">
            <div className="border-b border-border p-4">
              {isAuthenticated ? (
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-2xl bg-secondary p-3"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <UserRound className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-bold">حساب من</span>
                    <span className="block text-xs text-muted-foreground">داشبورد و نوبت‌ها</span>
                  </span>
                </Link>
              ) : (
                <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full">ورود / ثبت‌نام</Button>
                </Link>
              )}
            </div>

            <nav className="flex-1 overflow-y-auto p-3" aria-label="منوی موبایل">
              <ul className="space-y-1">
                {mobileNavigation.map((item, index) => (
                  <li key={item.label}>
                    {index === mobileNavigation.length - 1 && <div className="my-3 border-t border-border" />}
                    <Link
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold hover:bg-secondary ${
                        index === mobileNavigation.length - 1 ? "bg-primary/10 text-primary" : "text-foreground"
                      }`}
                    >
                      {item.label}
                      {index === mobileNavigation.length - 1 && <Store className="h-4 w-4" />}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {isAuthenticated && (
              <div className="border-t border-border p-3">
                <button
                  type="button"
                  onClick={logout}
                  className="flex w-full items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4" />
                  خروج از حساب
                </button>
              </div>
            )}
          </aside>
        </div>
      )}

      <nav
        className="fixed inset-x-0 bottom-0 z-50 grid h-16 grid-cols-5 border-t border-border bg-background/95 px-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(0,0,0,0.06)] backdrop-blur-xl xl:hidden"
        aria-label="دسترسی سریع موبایل"
      >
        {bottomNavigation.map((item, index) => (
          <Link
            key={item.label}
            href={item.href}
            className={`flex flex-col items-center justify-center gap-1 text-[10px] font-semibold ${
              index === 0 ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </>
  )
}
