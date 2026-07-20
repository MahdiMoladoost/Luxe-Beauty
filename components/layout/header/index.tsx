"use client"

import Link from "next/link"
import { useEffect, useMemo, useState, type ReactNode } from "react"
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

type MenuLink = { label: string; href: string }
type MegaMenu = {
  label: string
  href: string
  description: string
  sections: { title: string; links: MenuLink[] }[]
}

const CITY_KEY = "luxe-beauty-city"
const cities = ["تهران", "کرج", "مشهد", "اصفهان", "شیراز", "تبریز", "قم", "اهواز", "رشت"]

const menus: MegaMenu[] = [
  {
    label: "خدمات",
    href: "/salons",
    description: "خدمت موردنظر را انتخاب کنید و زمان‌های آزاد را مقایسه کنید.",
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
    description: "سالن‌ها و متخصصان را بر اساس موقعیت، امتیاز و نمونه‌کار ببینید.",
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
    description: "زمان‌های خالی امروز، نوبت فوری و اولین زمان آزاد را ببینید.",
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
    description: "تخفیف‌های فعال و پکیج‌های به‌صرفه را مقایسه کنید.",
    sections: [
      {
        title: "پیشنهادها",
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
    description: "شهر را انتخاب کنید تا گزینه‌های همان منطقه نمایش داده شوند.",
    sections: [
      {
        title: "شهرهای محبوب",
        links: [...cities.map((city) => ({ label: city, href: `/salons?city=${encodeURIComponent(city)}` })), { label: "مشاهده همه شهرها", href: "/salons" }],
      },
    ],
  },
  {
    label: "نمونه‌کارها",
    href: "/salons?view=portfolio",
    description: "نمونه‌کارها را پیش از انتخاب سالن یا متخصص مرور کنید.",
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
    description: "راهنماهای مراقبت، آرایش و انتخاب سالن را بخوانید.",
    sections: [
      {
        title: "مجله زیبایی",
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
    description: "برای رزرو، تغییر زمان، بازپرداخت یا شکایت راهنمایی بگیرید.",
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

const mobileLinks = [
  { label: "خدمات", href: "/salons" },
  { label: "سالن‌ها", href: "/salons?type=salons" },
  { label: "متخصصان", href: "/salons?provider=specialist" },
  { label: "نوبت امروز", href: "/salons?availability=today" },
  { label: "تخفیف‌ها", href: "/salons?offer=discount" },
  { label: "شهرها", href: "/salons" },
  { label: "نمونه‌کارها", href: "/salons?view=portfolio" },
  { label: "مجله", href: "/magazine" },
  { label: "پشتیبانی", href: "/contact" },
  { label: "ثبت سالن یا متخصص", href: "/salon-register" },
]

const bottomLinks = [
  { label: "خانه", href: "/", icon: Home },
  { label: "جست‌وجو", href: "/salons", icon: Search },
  { label: "نوبت‌ها", href: "/dashboard/appointments", icon: CalendarDays },
  { label: "علاقه‌مندی‌ها", href: "/dashboard/favorites", icon: Heart },
  { label: "حساب من", href: "/dashboard", icon: UserRound },
]

function Brand() {
  return (
    <Link href="/" aria-label="لوکس بیوتی، صفحه اصلی" className="flex shrink-0 items-center gap-3">
      <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-[#ead0c9] shadow-sm">
        <img src="/luxe-beauty-mark.svg" alt="" className="h-10 w-10 object-contain" />
      </span>
      <span className="leading-none">
        <span className="block whitespace-nowrap text-lg font-black text-foreground">لوکس بیوتی</span>
        <span dir="ltr" className="mt-1 block text-[10px] tracking-[0.18em] text-[#bf8478]">LUXE BEAUTY</span>
      </span>
    </Link>
  )
}

function IconLink({ href, label, badge, children }: { href: string; label: string; badge?: boolean; children: ReactNode }) {
  return (
    <Link href={href} aria-label={label} title={label} className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-secondary hover:text-foreground">
      {children}
      {badge && <span className="absolute left-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />}
    </Link>
  )
}

export function Header() {
  const [city, setCity] = useState("تهران")
  const [activeLabel, setActiveLabel] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const activeMenu = useMemo(() => menus.find((item) => item.label === activeLabel) ?? null, [activeLabel])

  useEffect(() => {
    setCity(window.localStorage.getItem(CITY_KEY) || "تهران")
    let cancelled = false
    void fetch("/api/auth/me", { credentials: "include", cache: "no-store" })
      .then((response) => { if (!cancelled) setAuthenticated(response.ok) })
      .catch(() => { if (!cancelled) setAuthenticated(false) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!mobileOpen) return
    const oldOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = oldOverflow }
  }, [mobileOpen])

  function chooseCity(nextCity: string) {
    setCity(nextCity)
    window.localStorage.setItem(CITY_KEY, nextCity)
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
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border/70 bg-background/95 shadow-[0_5px_22px_rgba(15,23,42,0.05)] backdrop-blur-xl" onMouseLeave={() => setActiveLabel(null)}>
        <div className="mx-auto hidden max-w-[1680px] px-6 xl:block 2xl:px-8">
          <div className="flex h-16 items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <Brand />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" className="flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-3 text-right shadow-sm hover:bg-secondary/60">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="leading-tight"><span className="block text-sm font-bold">{city}</span><span className="block text-[9px] text-muted-foreground">انتخاب شهر و محله</span></span>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-60 rounded-2xl p-2">
                  <DropdownMenuLabel>شهر شما</DropdownMenuLabel><DropdownMenuSeparator />
                  <div className="grid grid-cols-2 gap-1">{cities.map((item) => <DropdownMenuItem key={item} onSelect={() => chooseCity(item)} className="justify-center rounded-xl">{item}</DropdownMenuItem>)}</div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-xl border border-border bg-card p-1 shadow-sm">
                <IconLink href="/salons" label="جست‌وجو"><Search className="h-5 w-5" /></IconLink>
                <IconLink href="/dashboard/favorites" label="علاقه‌مندی‌ها"><Heart className="h-5 w-5" /></IconLink>
                <IconLink href="/dashboard/appointments" label="نوبت‌های من"><CalendarDays className="h-5 w-5" /></IconLink>
                <IconLink href="/dashboard/notifications" label="اعلان‌ها" badge><Bell className="h-5 w-5" /></IconLink>
              </div>

              {authenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="h-10 gap-2 rounded-xl"><UserRound className="h-4 w-4" />حساب من<ChevronDown className="h-3.5 w-3.5" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2">
                    <DropdownMenuLabel>حساب کاربری</DropdownMenuLabel><DropdownMenuSeparator />
                    {accountLinks.map((item) => <DropdownMenuItem key={item.label} asChild className="rounded-xl"><Link href={item.href}><item.icon className="h-4 w-4" />{item.label}</Link></DropdownMenuItem>)}
                    <DropdownMenuSeparator /><DropdownMenuItem variant="destructive" onSelect={() => void logout()} className="rounded-xl"><LogOut className="h-4 w-4" />خروج</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : <Link href="/auth/login"><Button variant="ghost" size="sm" className="h-10 rounded-xl font-bold">ورود / ثبت‌نام</Button></Link>}

              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button size="sm" className="h-10 gap-2 rounded-xl px-4 shadow-md shadow-primary/15"><Store className="h-4 w-4" />ثبت سالن یا متخصص<ChevronDown className="h-3.5 w-3.5" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 rounded-2xl p-2">
                  <DropdownMenuLabel>همکاری با لوکس بیوتی</DropdownMenuLabel><DropdownMenuSeparator />
                  {providerLinks.map((item, index) => <div key={item.label}>{index === 4 && <DropdownMenuSeparator />}<DropdownMenuItem asChild className="rounded-xl"><Link href={item.href}>{item.label}</Link></DropdownMenuItem></div>)}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <nav className="flex h-12 items-center justify-center gap-1 border-t border-border/60" aria-label="منوی اصلی">
            {menus.map((item) => {
              const active = item.label === activeLabel
              return <button key={item.label} type="button" aria-expanded={active} onMouseEnter={() => setActiveLabel(item.label)} onFocus={() => setActiveLabel(item.label)} onClick={() => setActiveLabel(active ? null : item.label)} className={`flex h-9 items-center gap-1 rounded-lg px-3 text-xs font-bold transition 2xl:px-4 2xl:text-sm ${active ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"}`}>{item.label}<ChevronDown className={`h-3.5 w-3.5 transition-transform ${active ? "rotate-180" : ""}`} /></button>
            })}
          </nav>
        </div>

        <div className="mx-auto flex h-16 items-center justify-between px-3 xl:hidden">
          <div className="flex min-w-0 items-center gap-2">
            <button type="button" aria-label={mobileOpen ? "بستن منو" : "باز کردن منو"} onClick={() => setMobileOpen((value) => !value)} className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-secondary">{mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}</button>
            <Brand />
          </div>
          <div className="flex items-center gap-1">
            <button type="button" className="flex h-10 items-center gap-1 rounded-xl px-2 text-xs font-bold text-muted-foreground" onClick={() => chooseCity(city)}><MapPin className="h-4 w-4 text-primary" /><span>{city}</span></button>
            <Link href="/salons" aria-label="جست‌وجو" className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-secondary"><Search className="h-5 w-5" /></Link>
          </div>
        </div>

        {activeMenu && <div className="absolute inset-x-0 top-full hidden border-t border-border bg-background/98 shadow-2xl xl:block">
          <div className="mx-auto grid max-w-[1460px] grid-cols-[260px_1fr] gap-6 px-6 py-6">
            <div className="rounded-3xl border border-[#ecd8d2] bg-[#fff8f6] p-6"><p className="text-xs font-black text-[#b8796e]">لوکس بیوتی</p><h2 className="mt-2 text-xl font-black">{activeMenu.label}</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">{activeMenu.description}</p><Link href={activeMenu.href} onClick={() => setActiveLabel(null)} className="mt-5 inline-flex rounded-xl bg-white px-4 py-2 text-sm font-black text-primary shadow-sm">مشاهده همه</Link></div>
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">{activeMenu.sections.map((section) => <div key={section.title} className="rounded-3xl border border-border bg-card p-5"><h3 className="text-sm font-black">{section.title}</h3><ul className="mt-3 grid gap-1 sm:grid-cols-2">{section.links.map((link) => <li key={link.label}><Link href={link.href} onClick={() => setActiveLabel(null)} className="block rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground">{link.label}</Link></li>)}</ul></div>)}</div>
          </div>
        </div>}
      </header>

      <div aria-hidden="true" className="hidden h-12 xl:block" />

      {mobileOpen && <div className="fixed inset-0 z-40 xl:hidden">
        <button type="button" aria-label="بستن منو" className="absolute inset-0 bg-foreground/35 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
        <aside className="absolute bottom-16 right-0 top-16 flex w-[min(88vw,360px)] flex-col border-l border-border bg-card shadow-2xl">
          <div className="border-b border-border p-4">{authenticated ? <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-2xl bg-secondary p-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground"><UserRound className="h-5 w-5" /></span><span><span className="block text-sm font-bold">حساب من</span><span className="block text-xs text-muted-foreground">داشبورد و نوبت‌ها</span></span></Link> : <Link href="/auth/login" onClick={() => setMobileOpen(false)}><Button className="w-full rounded-2xl">ورود / ثبت‌نام</Button></Link>}</div>
          <nav className="flex-1 overflow-y-auto p-3" aria-label="منوی موبایل"><ul className="space-y-1">{mobileLinks.map((item, index) => <li key={item.label}>{index === mobileLinks.length - 1 && <div className="my-3 border-t border-border" />}<Link href={item.href} onClick={() => setMobileOpen(false)} className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-bold hover:bg-secondary ${index === mobileLinks.length - 1 ? "bg-primary/10 text-primary" : "text-foreground"}`}>{item.label}{index === mobileLinks.length - 1 && <Store className="h-4 w-4" />}</Link></li>)}</ul></nav>
          {authenticated && <div className="border-t border-border p-3"><button type="button" onClick={() => void logout()} className="flex w-full items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold text-destructive hover:bg-destructive/10"><LogOut className="h-4 w-4" />خروج از حساب</button></div>}
        </aside>
      </div>}

      <nav className="fixed inset-x-0 bottom-0 z-50 grid h-16 grid-cols-5 border-t border-border bg-background/95 px-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(0,0,0,0.06)] backdrop-blur-xl xl:hidden" aria-label="دسترسی سریع موبایل">
        {bottomLinks.map((item, index) => <Link key={item.label} href={item.href} className={`flex flex-col items-center justify-center gap-1 text-[10px] font-bold ${index === 0 ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}><item.icon className="h-5 w-5" /><span>{item.label}</span></Link>)}
      </nav>
    </>
  )
}
