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
    description: "سالن‌ها و متخصصان را بر اساس موقعیت، امتیاز و نمونه‌کار مقایسه کنید.",
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
        title: "تخفیف‌ها",
        links: [
          { label: "تخفیف‌های امروز", href: "/salons?offer=today" },
          { label: "اولین رزرو", href: "/salons?offer=first-booking" },
          { label: "ساعات کم‌تقاضا", href: "/salons?offer=off-peak" },
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
    description: "شهر را انتخاب کنید تا گزینه‌های همان منطقه نمایش داده شوند.",
    sections: [
      {
        title: "شهرهای محبوب",
        links: popularCities.map((city) => ({
          label: city,
          href: `/salons?city=${encodeURIComponent(city)}`,
        })),
      },
      {
        title: "همه شهرها",
        links: [{ label: "مشاهده همه شهرها", href: "/salons" }],
      },
    ],
  },
  {
    label: "نمونه‌کارها",
    href: "/salons?view=portfolio",
    eyebrow: "قبل از انتخاب ببینید",
    description: "نمونه‌کارها را بر اساس سبک و خدمت مرور کنید.",
    sections: [
      {
        title: "دسته‌بندی‌ها",
        links: [
          { label: "مو", href: "/salons?portfolio=hair" },
          { label: "ناخن", href: "/salons?portfolio=nails" },
          { label: "میکاپ", href: "/salons?portfolio=makeup" },
          { label: "عروس", href: "/salons?portfolio=bride" },
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
    description: "راهنماهای کاربردی مراقبت و انتخاب خدمات زیبایی.",
    sections: [
      {
        title: "مراقبت و زیبایی",
        links: [
          { label: "مراقبت مو", href: "/magazine?category=hair" },
          { label: "ناخن", href: "/magazine?category=nails" },
          { label: "آرایش و میکاپ", href: "/magazine?category=makeup" },
          { label: "مراقبت پوست غیرپزشکی", href: "/magazine?category=skin-care" },
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
    description: "برای مدیریت نوبت، بازپرداخت یا ثبت شکایت مسیر مناسب را پیدا کنید.",
    sections: [
      {
        title: "راهنما و پیگیری",
        links: [
          { label: "راهنمای رزرو", href: "/support/booking-guide" },
          { label: "پیگیری نوبت", href: "/dashboard/appointments" },
          { label: "لغو و تغییر زمان", href: "/support/change-booking" },
          { label: "بازپرداخت", href: "/support/refund" },
          { label: "ثبت شکایت", href: "/support/complaint" },
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
]

const mobileNavigation = [
  { label: "خدمات", href: "/salons" },
  { label: "سالن‌ها", href: "/salons?type=salon" },
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
    <Link
      href="/"
      aria-label="لوکس بیوتی، صفحه اصلی"
      className="flex min-w-0 shrink-0 items-center gap-2.5"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white ring-1 ring-[#ead0c9] shadow-sm">
        <img
          src="/luxe-beauty-mark.webp"
          alt=""
          className="h-11 w-11 object-contain"
        />
      </span>
      <span className="hidden min-w-0 leading-none 2xl:block">
        <span className="block whitespace-nowrap text-lg font-black text-foreground">
          لوکس بیوتی
        </span>
        <span dir="ltr" className="mt-1 block text-[10px] tracking-[0.18em] text-[#bf8478]">
          LUXE BEAUTY
        </span>
      </span>
    </Link>
  )
}

function HeaderIconLink({ href, label, badge, children }: { href: string; label: string; badge?: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} aria-label={label} title={label} className="relative flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
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

  const activeMenu = useMemo(() => desktopNavigation.find((item) => item.label === activeMenuLabel) ?? null, [activeMenuLabel])

  useEffect(() => {
    setSelectedCity(window.localStorage.getItem(CITY_STORAGE_KEY) || "تهران")
    let cancelled = false
    void fetch("/api/auth/me", { credentials: "include", cache: "no-store" })
      .then((response) => { if (!cancelled) setIsAuthenticated(response.ok) })
      .catch(() => { if (!cancelled) setIsAuthenticated(false) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!mobileMenuOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = previousOverflow }
  }, [mobileMenuOpen])

  function chooseCity(city: string) {
    setSelectedCity(city)
    window.localStorage.setItem(CITY_STORAGE_KEY, city)
  }

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include", headers: { "content-type": "application/json" } })
    } finally {
      window.location.assign("/")
    }
  }

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border/70 bg-background/95 shadow-[0_6px_24px_rgba(15,23,42,0.05)] backdrop-blur-xl" onMouseLeave={() => setActiveMenuLabel(null)}>
        <div className="mx-auto hidden h-16 max-w-[1840px] items-center gap-4 px-6 2xl:flex">
          <div className="flex shrink-0 items-center gap-3">
            <Brand />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="flex h-11 items-center gap-2 rounded-2xl border border-border bg-card px-3 text-right shadow-sm transition-colors hover:border-[#d9a297]/70 hover:bg-secondary/60">
                  <MapPin className="h-4 w-4 shrink-0 text-primary" />
                  <span className="leading-tight"><span className="block text-sm font-bold text-foreground">{selectedCity}</span><span className="block text-[9px] text-muted-foreground">انتخاب شهر و محله</span></span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-60 rounded-2xl p-2">
                <DropdownMenuLabel>شهر شما</DropdownMenuLabel><DropdownMenuSeparator />
                <div className="grid grid-cols-2 gap-1">{popularCities.map((city) => <DropdownMenuItem key={city} onSelect={() => chooseCity(city)} className="justify-center rounded-xl">{city}</DropdownMenuItem>)}</div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link href="/salons" className="justify-center rounded-xl font-bold text-primary">مشاهده همه شهرها</Link></DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <nav className="flex min-w-0 flex-1 items-center justify-center gap-0.5 rounded-2xl border border-border/70 bg-card/70 p-1 shadow-sm" aria-label="منوی اصلی">
            {desktopNavigation.map((item) => {
              const isActive = activeMenuLabel === item.label
              return (
                <button key={item.label} type="button" aria-expanded={isActive} onMouseEnter={() => setActiveMenuLabel(item.label)} onFocus={() => setActiveMenuLabel(item.label)} onClick={() => setActiveMenuLabel(isActive ? null : item.label)} className={`flex h-10 items-center gap-1 whitespace-nowrap rounded-xl px-3 text-xs font-bold transition-colors ${isActive ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"}`}>
                  {item.label}<ChevronDown className={`h-3.5 w-3.5 transition-transform ${isActive ? "rotate-180" : ""}`} />
                </button>
              )
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <div className="flex items-center gap-0.5 rounded-2xl border border-border bg-card p-1 shadow-sm">
              <HeaderIconLink href="/salons" label="جست‌وجو"><Search className="h-5 w-5" /></HeaderIconLink>
              <HeaderIconLink href="/dashboard/favorites" label="علاقه‌مندی‌ها"><Heart className="h-5 w-5" /></HeaderIconLink>
              <HeaderIconLink href="/dashboard/appointments" label="نوبت‌های من"><CalendarDays className="h-5 w-5" /></HeaderIconLink>
              <HeaderIconLink href="/dashboard/notifications" label="اعلان‌ها" badge><Bell className="h-5 w-5" /></HeaderIconLink>
            </div>
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="h-11 gap-2 rounded-2xl px-3"><UserRound className="h-4 w-4" />حساب من<ChevronDown className="h-3.5 w-3.5" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2">
                  <DropdownMenuLabel>حساب کاربری</DropdownMenuLabel><DropdownMenuSeparator />
                  {accountLinks.map((item) => <DropdownMenuItem key={item.label} asChild className="rounded-xl"><Link href={item.href}><item.icon className="h-4 w-4" />{item.label}</Link></DropdownMenuItem>)}
                  <DropdownMenuSeparator /><DropdownMenuItem variant="destructive" onSelect={() => void logout()} className="rounded-xl"><LogOut className="h-4 w-4" />خروج</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : <Link href="/auth/login"><Button variant="ghost" size="sm" className="h-11 rounded-2xl px-3 font-bold">ورود / ثبت‌نام</Button></Link>}
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button size="sm" className="h-11 gap-2 rounded-2xl px-4 shadow-md shadow-primary/15"><Store className="h-4 w-4" />ثبت سالن یا متخصص<ChevronDown className="h-3.5 w-3.5" /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 rounded-2xl p-2"><DropdownMenuLabel>همکاری با لوکس بیوتی</DropdownMenuLabel><DropdownMenuSeparator />{providerLinks.map((item, index) => <div key={item.label}>{index === 4 && <DropdownMenuSeparator />}<DropdownMenuItem asChild className="rounded-xl"><Link href={item.href}>{item.label}</Link></DropdownMenuItem></div>)}</DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 2xl:hidden">
          <div className="flex min-w-0 items-center gap-2"><button type="button" aria-label={mobileMenuOpen ? "بستن منو" : "باز کردن منو"} aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen((open) => !open)} className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-secondary">{mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}</button><Brand /></div>
          <div className="flex items-center gap-1">
            <DropdownMenu><DropdownMenuTrigger asChild><button type="button" className="flex h-10 max-w-28 items-center gap-1 rounded-xl px-2 text-xs font-bold text-muted-foreground hover:bg-secondary hover:text-foreground"><MapPin className="h-4 w-4 shrink-0 text-primary" /><span className="truncate">{selectedCity}</span><ChevronDown className="h-3 w-3 shrink-0" /></button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-56 rounded-2xl p-2"><DropdownMenuLabel>انتخاب شهر</DropdownMenuLabel><DropdownMenuSeparator /><div className="grid grid-cols-2 gap-1">{popularCities.map((city) => <DropdownMenuItem key={city} onSelect={() => chooseCity(city)} className="justify-center rounded-xl">{city}</DropdownMenuItem>)}</div></DropdownMenuContent></DropdownMenu>
            <Link href="/salons" aria-label="جست‌وجو" className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-secondary"><Search className="h-5 w-5" /></Link>
          </div>
        </div>

        {activeMenu && (
          <div className="absolute inset-x-0 top-full hidden border-t border-border bg-background/98 shadow-2xl shadow-foreground/5 2xl:block">
            <div className="mx-auto grid max-w-[1540px] grid-cols-[280px_minmax(0,1fr)] gap-6 px-6 py-6">
              <div className="rounded-3xl border border-[#ecd8d2] bg-[#fff8f6] p-6"><span className="text-xs font-black text-[#b8796e]">{activeMenu.eyebrow}</span><h2 className="mt-2 text-xl font-black text-foreground">{activeMenu.label}</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">{activeMenu.description}</p><Link href={activeMenu.href} onClick={() => setActiveMenuLabel(null)} className="mt-5 inline-flex rounded-xl bg-white px-4 py-2 text-sm font-black text-primary shadow-sm">مشاهده همه</Link></div>
              <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">{activeMenu.sections.map((section) => <div key={section.title} className="rounded-3xl border border-border bg-card p-5"><h3 className="text-sm font-black text-foreground">{section.title}</h3><ul className="mt-3 grid gap-1 sm:grid-cols-2">{section.links.map((link) => <li key={link.label}><Link href={link.href} onClick={() => setActiveMenuLabel(null)} className="block rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground">{link.label}</Link></li>)}</ul></div>)}</div>
            </div>
          </div>
        )}
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 2xl:hidden">
          <button type="button" aria-label="بستن منو" className="absolute inset-0 bg-foreground/35 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <aside className="absolute bottom-16 right-0 top-16 flex w-[min(88vw,360px)] flex-col border-l border-border bg-card shadow-2xl">
            <div className="border-b border-border p-4">{isAuthenticated ? <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 rounded-2xl bg-secondary p-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground"><UserRound className="h-5 w-5" /></span><span><span className="block text-sm font-black">حساب من</span><span className="block text-xs text-muted-foreground">داشبورد و نوبت‌ها</span></span></Link> : <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}><Button className="w-full rounded-2xl">ورود / ثبت‌نام</Button></Link>}</div>
            <nav className="flex-1 overflow-y-auto p-3" aria-label="منوی موبایل"><ul className="space-y-1">{mobileNavigation.map((item, index) => <li key={item.label}>{index === mobileNavigation.length - 1 && <div className="my-3 border-t border-border" />}<Link href={item.href} onClick={() => setMobileMenuOpen(false)} className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-bold hover:bg-secondary ${index === mobileNavigation.length - 1 ? "bg-primary/10 text-primary" : "text-foreground"}`}>{item.label}{index === mobileNavigation.length - 1 && <Store className="h-4 w-4" />}</Link></li>)}</ul></nav>
            {isAuthenticated && <div className="border-t border-border p-3"><button type="button" onClick={() => void logout()} className="flex w-full items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold text-destructive hover:bg-destructive/10"><LogOut className="h-4 w-4" />خروج از حساب</button></div>}
          </aside>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-50 grid h-16 grid-cols-5 border-t border-border bg-background/95 px-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(0,0,0,0.06)] backdrop-blur-xl 2xl:hidden" aria-label="دسترسی سریع موبایل">{bottomNavigation.map((item, index) => <Link key={item.label} href={item.href} className={`flex flex-col items-center justify-center gap-1 text-[10px] font-bold ${index === 0 ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}><item.icon className="h-5 w-5" /><span>{item.label}</span></Link>)}</nav>
    </>
  )
}
