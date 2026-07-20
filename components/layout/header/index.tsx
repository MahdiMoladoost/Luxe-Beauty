"use client"

import Link from "next/link"
import { useEffect, useMemo, useState, type ReactNode } from "react"
import {
  ArrowUpLeft,
  CalendarDays,
  ChevronDown,
  Heart,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Search,
  Sparkles,
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
    description: "سالن‌ها و متخصصان را بر اساس امتیاز و نمونه‌کار مقایسه کنید.",
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
    description: "نوبت‌های خالی امروز و سریع‌ترین زمان‌های آزاد را ببینید.",
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
    description: "سالن‌ها و متخصصان شهرهای مختلف را مشاهده کنید.",
    sections: [
      {
        title: "شهرهای محبوب",
        links: [
          { label: "تهران", href: "/salons?city=تهران" },
          { label: "کرج", href: "/salons?city=کرج" },
          { label: "مشهد", href: "/salons?city=مشهد" },
          { label: "اصفهان", href: "/salons?city=اصفهان" },
          { label: "شیراز", href: "/salons?city=شیراز" },
          { label: "تبریز", href: "/salons?city=تبریز" },
          { label: "مشاهده همه شهرها", href: "/salons" },
        ],
      },
    ],
  },
  {
    label: "نمونه‌کارها",
    href: "/portfolio",
    description: "نمونه‌کارها را پیش از انتخاب سالن یا متخصص مرور کنید.",
    sections: [
      {
        title: "دسته‌بندی‌ها",
        links: [
          { label: "مو", href: "/portfolio?category=hair" },
          { label: "ناخن", href: "/portfolio?category=nails" },
          { label: "میکاپ", href: "/portfolio?category=makeup" },
          { label: "عروس", href: "/portfolio?category=bridal" },
          { label: "پوست", href: "/portfolio?category=skin" },
          { label: "قبل و بعد", href: "/portfolio?category=before-after" },
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
          { label: "مراقبت پوست", href: "/magazine?category=skin-care" },
          { label: "راهنمای انتخاب سالن", href: "/magazine?category=salon-guide" },
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
          { label: "سؤالات پرتکرار", href: "/support/faq" },
          { label: "تماس با ما", href: "/contact" },
        ],
      },
    ],
  },
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
  { label: "سالن‌ها و متخصصان", href: "/salons" },
  { label: "نوبت امروز", href: "/salons?availability=today" },
  { label: "تخفیف‌ها", href: "/salons?offer=discount" },
  { label: "شهرها", href: "/salons" },
  { label: "نمونه‌کارها", href: "/portfolio" },
  { label: "مجله", href: "/magazine" },
  { label: "پشتیبانی", href: "/contact" },
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
    <Link href="/" aria-label="لوکس بیوتی، صفحه اصلی" className="flex shrink-0 items-center gap-2.5">
      <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-white/80 ring-1 ring-white/90 shadow-[0_8px_24px_rgba(133,75,65,0.13)] backdrop-blur">
        <img src="/luxe-beauty-mark.svg" alt="" className="h-9 w-9 object-contain" />
      </span>
      <span className="leading-none">
        <span className="block whitespace-nowrap text-base font-black text-foreground">لوکس بیوتی</span>
        <span dir="ltr" className="mt-1 block text-[9px] tracking-[0.18em] text-[#b87569]">LUXE BEAUTY</span>
      </span>
    </Link>
  )
}

function IconLink({ href, label, children }: { href: string; label: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className="flex h-10 w-10 items-center justify-center rounded-full text-[#5f626b] transition hover:bg-white/80 hover:text-[#9d5e52] hover:shadow-sm"
    >
      {children}
    </Link>
  )
}

export function Header() {
  const [activeLabel, setActiveLabel] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const activeMenu = useMemo(() => menus.find((item) => item.label === activeLabel) ?? null, [activeLabel])

  useEffect(() => {
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

  async function logout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
      })
    } finally {
      window.location.assign("/")
    }
  }

  return (
    <>
      <header
        className="fixed inset-x-0 top-0 z-50 bg-white/65 shadow-[0_10px_35px_rgba(55,35,30,0.06)] backdrop-blur-2xl"
        onMouseLeave={() => setActiveLabel(null)}
      >
        <div className="mx-auto hidden h-16 max-w-[1880px] grid-cols-[190px_minmax(0,1fr)_190px] items-center gap-3 px-5 xl:grid 2xl:px-8">
          <div className="flex items-center justify-start">
            <Brand />
          </div>

          <nav className="flex min-w-0 items-center justify-center gap-0.5" aria-label="منوی اصلی">
            {menus.map((item) => {
              const active = item.label === activeLabel
              return (
                <button
                  key={item.label}
                  type="button"
                  aria-expanded={active}
                  onMouseEnter={() => setActiveLabel(item.label)}
                  onFocus={() => setActiveLabel(item.label)}
                  onClick={() => setActiveLabel(active ? null : item.label)}
                  className={`relative flex h-10 shrink-0 items-center gap-1 rounded-full px-2.5 text-[11px] font-bold transition 2xl:px-3.5 2xl:text-xs ${
                    active
                      ? "bg-white/85 text-[#8f5147] shadow-sm"
                      : "text-[#5e626b] hover:bg-white/55 hover:text-[#8f5147]"
                  }`}
                >
                  {item.label}
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${active ? "rotate-180" : ""}`} />
                  {active && <span className="absolute -bottom-0.5 left-1/2 h-1 w-6 -translate-x-1/2 rounded-full bg-[#c78376]" />}
                </button>
              )
            })}
          </nav>

          <div className="flex items-center justify-end gap-0.5">
            <IconLink href="/salons" label="جست‌وجو"><Search className="h-5 w-5" /></IconLink>
            <IconLink href="/dashboard/favorites" label="علاقه‌مندی‌ها"><Heart className="h-5 w-5" /></IconLink>

            {authenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-10 gap-1.5 rounded-full bg-white/55 px-3 text-[#6d443d] hover:bg-white/85">
                    <UserRound className="h-4 w-4" />
                    حساب من
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-3xl border-white/70 bg-white/85 p-2 shadow-2xl backdrop-blur-2xl">
                  <DropdownMenuLabel>حساب کاربری</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {accountLinks.map((item) => (
                    <DropdownMenuItem key={item.label} asChild className="rounded-2xl py-2.5">
                      <Link href={item.href}><item.icon className="h-4 w-4" />{item.label}</Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onSelect={() => void logout()} className="rounded-2xl py-2.5">
                    <LogOut className="h-4 w-4" />خروج
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/auth/login">
                <Button
                  size="sm"
                  className="h-10 gap-2 rounded-full border border-white/80 bg-white/75 px-4 font-black text-[#93564b] shadow-[0_8px_24px_rgba(130,73,63,0.12)] backdrop-blur hover:bg-white"
                >
                  <UserRound className="h-4 w-4" />
                  ورود / ثبت‌نام
                </Button>
              </Link>
            )}
          </div>
        </div>

        <div className="mx-auto flex h-16 items-center justify-between px-3 xl:hidden">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              aria-label={mobileOpen ? "بستن منو" : "باز کردن منو"}
              onClick={() => setMobileOpen((value) => !value)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/55 hover:bg-white/85"
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <Brand />
          </div>
          <div className="flex items-center gap-1">
            <IconLink href="/salons" label="جست‌وجو"><Search className="h-5 w-5" /></IconLink>
            <Link href={authenticated ? "/dashboard" : "/auth/login"} aria-label="حساب کاربری" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/70 text-[#a45f53] shadow-sm">
              <UserRound className="h-5 w-5" />
            </Link>
          </div>
        </div>

        <svg aria-hidden="true" className="pointer-events-none absolute -bottom-[18px] left-0 h-5 w-full drop-shadow-[0_6px_7px_rgba(68,42,36,0.04)]" viewBox="0 0 1440 24" preserveAspectRatio="none">
          <path className="fill-white/65" d="M0 0H1440V8C1220 24 1020 4 806 12C568 21 331 25 0 9V0Z" />
        </svg>

        {activeMenu && (
          <div className="absolute inset-x-0 top-full hidden pt-6 xl:block">
            <div className="mx-auto max-w-[1180px] px-5">
              <div className="grid grid-cols-[280px_minmax(0,1fr)] gap-3 rounded-[2rem] border border-white/80 bg-white/78 p-3 shadow-[0_28px_80px_rgba(58,35,30,0.16)] backdrop-blur-2xl">
                <div className="relative overflow-hidden rounded-[1.55rem] bg-gradient-to-br from-[#8f5147] via-[#b87366] to-[#d69a8e] p-6 text-white">
                  <Sparkles className="absolute -left-3 -top-3 h-24 w-24 text-white/10" />
                  <p className="relative text-xs font-black text-white/75">راهنمای انتخاب لوکس بیوتی</p>
                  <h2 className="relative mt-3 text-2xl font-black">{activeMenu.label}</h2>
                  <p className="relative mt-3 text-sm leading-7 text-white/80">{activeMenu.description}</p>
                  <Link
                    href={activeMenu.href}
                    onClick={() => setActiveLabel(null)}
                    className="relative mt-6 inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2.5 text-sm font-black text-[#8f5147] shadow-lg"
                  >
                    مشاهده همه
                    <ArrowUpLeft className="h-4 w-4" />
                  </Link>
                </div>

                <div className={`grid gap-3 ${activeMenu.sections.length > 1 ? "lg:grid-cols-2" : "grid-cols-1"}`}>
                  {activeMenu.sections.map((section) => (
                    <div key={section.title} className="rounded-[1.55rem] border border-[#eadbd6] bg-gradient-to-b from-white/90 to-[#fff8f6]/80 p-5">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-[#c78376]" />
                        <h3 className="text-sm font-black text-[#3f332f]">{section.title}</h3>
                      </div>
                      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                        {section.links.map((link) => (
                          <li key={link.label}>
                            <Link
                              href={link.href}
                              onClick={() => setActiveLabel(null)}
                              className="group flex items-center justify-between gap-2 rounded-2xl border border-transparent bg-white/75 px-3.5 py-3 text-sm font-bold text-[#66616a] transition hover:border-[#e9c8c0] hover:bg-white hover:text-[#92574c] hover:shadow-sm"
                            >
                              <span>{link.label}</span>
                              <ArrowUpLeft className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" />
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 xl:hidden">
          <button type="button" aria-label="بستن منو" className="absolute inset-0 bg-[#2b1714]/35 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute bottom-16 right-0 top-16 flex w-[min(88vw,360px)] flex-col border-l border-white/60 bg-white/82 shadow-2xl backdrop-blur-2xl">
            <div className="border-b border-[#eadbd6] p-4">
              {authenticated ? (
                <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-2xl bg-[#fff4f1] p-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#a45f53] text-white"><UserRound className="h-5 w-5" /></span>
                  <span><span className="block text-sm font-bold">حساب من</span><span className="block text-xs text-muted-foreground">داشبورد و نوبت‌ها</span></span>
                </Link>
              ) : (
                <Link href="/auth/login" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full rounded-2xl bg-[#a45f53]">ورود / ثبت‌نام</Button>
                </Link>
              )}
            </div>
            <nav className="flex-1 overflow-y-auto p-3" aria-label="منوی موبایل">
              <ul className="space-y-1">
                {mobileLinks.map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} onClick={() => setMobileOpen(false)} className="flex items-center rounded-2xl px-4 py-3 text-sm font-bold text-foreground hover:bg-[#fff4f1] hover:text-[#92574c]">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            {authenticated && (
              <div className="border-t border-[#eadbd6] p-3">
                <button type="button" onClick={() => void logout()} className="flex w-full items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold text-destructive hover:bg-destructive/10">
                  <LogOut className="h-4 w-4" />خروج از حساب
                </button>
              </div>
            )}
          </aside>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-50 grid h-16 grid-cols-5 border-t border-white/70 bg-white/80 px-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(0,0,0,0.06)] backdrop-blur-2xl xl:hidden" aria-label="دسترسی سریع موبایل">
        {bottomLinks.map((item, index) => (
          <Link key={item.label} href={item.href} className={`flex flex-col items-center justify-center gap-1 text-[10px] font-bold ${index === 0 ? "text-[#a45f53]" : "text-muted-foreground hover:text-foreground"}`}>
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </>
  )
}
