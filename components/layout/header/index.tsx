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
    description: "دسته‌بندی‌های اصلی خدمات زیبایی",
    sections: [
      {
        title: "دسته‌بندی خدمات",
        links: [
          { label: "بانوان", href: "/salons?audience=women" },
          { label: "آقایان", href: "/salons?audience=men" },
          { label: "کودکان", href: "/salons?audience=children" },
          { label: "خدمات در منزل", href: "/salons?service=home" },
          { label: "عروس و داماد", href: "/salons?service=wedding" },
          { label: "همه خدمات", href: "/salons" },
        ],
      },
    ],
  },
  {
    label: "سالن‌ها و متخصصان",
    href: "/salons",
    description: "پیدا کردن بهترین ارائه‌دهندگان",
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
          { label: "خدمات در منزل", href: "/salons?provider=home-service" },
        ],
      },
    ],
  },
  {
    label: "نوبت امروز",
    href: "/salons?availability=today",
    description: "سریع‌ترین زمان‌های قابل رزرو",
    sections: [
      {
        title: "رزرو سریع",
        links: [
          { label: "نوبت‌های خالی امروز", href: "/salons?availability=today" },
          { label: "نوبت فوری", href: "/salons?availability=urgent" },
          { label: "اولین زمان آزاد", href: "/salons?sort=first-available" },
          { label: "آخر هفته", href: "/salons?availability=weekend" },
        ],
      },
    ],
  },
  {
    label: "تخفیف‌ها",
    href: "/salons?offer=discount",
    description: "پیشنهادهای اقتصادی و ویژه",
    sections: [
      {
        title: "پیشنهادها",
        links: [
          { label: "تخفیف‌های امروز", href: "/salons?offer=today" },
          { label: "اولین رزرو", href: "/salons?offer=first-booking" },
          { label: "ساعات کم‌تقاضا", href: "/salons?offer=off-peak" },
          { label: "پکیج‌ها", href: "/salons?offer=packages" },
        ],
      },
    ],
  },
  {
    label: "شهرها",
    href: "/salons",
    description: "جست‌وجوی خدمات در شهرهای مختلف",
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
        ],
      },
    ],
  },
  {
    label: "نمونه‌کارها",
    href: "/portfolio",
    description: "مشاهده نتیجه کار پیش از انتخاب",
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
    description: "راهنماهای کاربردی زیبایی",
    sections: [
      {
        title: "موضوعات",
        links: [
          { label: "مراقبت مو", href: "/magazine?category=hair" },
          { label: "ناخن", href: "/magazine?category=nails" },
          { label: "آرایش و میکاپ", href: "/magazine?category=makeup" },
          { label: "مراقبت پوست", href: "/magazine?category=skin-care" },
          { label: "انتخاب سالن", href: "/magazine?category=salon-guide" },
        ],
      },
    ],
  },
  {
    label: "پشتیبانی",
    href: "/contact",
    description: "راهنمای رزرو و پیگیری",
    sections: [
      {
        title: "راهنما",
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

const mobileLinks = menus.map((item) => ({ label: item.label, href: item.href }))

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
      <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-[#ead8d3]">
        <img src="/luxe-beauty-mark.svg" alt="" className="h-8 w-8 object-contain" />
      </span>
      <span className="leading-none">
        <span className="block whitespace-nowrap text-[15px] font-black text-[#25201e]">لوکس بیوتی</span>
        <span dir="ltr" className="mt-1 block text-[8px] tracking-[0.18em] text-[#bd7d70]">LUXE BEAUTY</span>
      </span>
    </Link>
  )
}

function IconLink({ href, label, children }: { href: string; label: string; children: ReactNode }) {
  return (
    <Link href={href} aria-label={label} title={label} className="flex h-9 w-9 items-center justify-center rounded-full text-[#686b73] transition hover:bg-[#f7efec] hover:text-[#9b5d52]">
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
        className="fixed inset-x-0 top-0 z-50 border-b border-[#ece6e3] bg-white/88 shadow-[0_5px_24px_rgba(52,37,32,0.045)] backdrop-blur-2xl"
        onMouseLeave={() => setActiveLabel(null)}
      >
        <div className="mx-auto hidden h-16 max-w-[1720px] grid-cols-[180px_minmax(0,1fr)_180px] items-center gap-4 px-5 xl:grid 2xl:px-8">
          <div className="justify-self-start"><Brand /></div>

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
                  className={`flex h-9 shrink-0 items-center gap-1 rounded-full px-2.5 text-[11px] font-bold transition 2xl:px-3.5 2xl:text-xs ${
                    active ? "bg-[#f7efec] text-[#91564c]" : "text-[#60636b] hover:bg-[#faf6f4] hover:text-[#91564c]"
                  }`}
                >
                  {item.label}
                  <ChevronDown className={`h-3 w-3 transition-transform ${active ? "rotate-180" : ""}`} />
                </button>
              )
            })}
          </nav>

          <div className="flex items-center justify-end gap-0.5">
            <IconLink href="/salons" label="جست‌وجو"><Search className="h-[19px] w-[19px]" /></IconLink>
            <IconLink href="/dashboard/favorites" label="علاقه‌مندی‌ها"><Heart className="h-[19px] w-[19px]" /></IconLink>

            {authenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-9 gap-1.5 rounded-full px-3 text-xs text-[#6b4942] hover:bg-[#f7efec]">
                    <UserRound className="h-4 w-4" />
                    حساب من
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl border-[#ece2df] bg-white/96 p-2 shadow-xl backdrop-blur-xl">
                  <DropdownMenuLabel>حساب کاربری</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {accountLinks.map((item) => (
                    <DropdownMenuItem key={item.label} asChild className="rounded-xl py-2.5">
                      <Link href={item.href}><item.icon className="h-4 w-4" />{item.label}</Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onSelect={() => void logout()} className="rounded-xl py-2.5">
                    <LogOut className="h-4 w-4" />خروج
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/auth/login">
                <Button variant="outline" size="sm" className="h-9 gap-1.5 rounded-full border-[#e6c8c1] bg-white/80 px-3.5 text-xs font-black text-[#92574c] shadow-none hover:bg-[#fff6f3]">
                  <UserRound className="h-4 w-4" />
                  ورود / ثبت‌نام
                </Button>
              </Link>
            )}
          </div>
        </div>

        <div className="mx-auto flex h-16 items-center justify-between px-3 xl:hidden">
          <div className="flex min-w-0 items-center gap-2">
            <button type="button" aria-label={mobileOpen ? "بستن منو" : "باز کردن منو"} onClick={() => setMobileOpen((value) => !value)} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#f7efec]">
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Brand />
          </div>
          <div className="flex items-center gap-1">
            <IconLink href="/salons" label="جست‌وجو"><Search className="h-5 w-5" /></IconLink>
            <Link href={authenticated ? "/dashboard" : "/auth/login"} aria-label="حساب کاربری" className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f8efec] text-[#98594e]">
              <UserRound className="h-4.5 w-4.5" />
            </Link>
          </div>
        </div>

        {activeMenu && (
          <div className="absolute inset-x-0 top-full hidden pt-3 xl:block">
            <div className="mx-auto max-w-[980px] px-4">
              <div className="rounded-[1.5rem] border border-[#eae1de] bg-white/96 p-5 shadow-[0_24px_65px_rgba(58,39,33,0.13)] backdrop-blur-2xl">
                <div className="flex items-center justify-between gap-4 border-b border-[#eee7e4] pb-4">
                  <div>
                    <h2 className="text-base font-black text-[#312b29]">{activeMenu.label}</h2>
                    <p className="mt-1 text-xs text-[#817a77]">{activeMenu.description}</p>
                  </div>
                  <Link href={activeMenu.href} onClick={() => setActiveLabel(null)} className="inline-flex items-center gap-1.5 rounded-full bg-[#f8efec] px-3.5 py-2 text-xs font-black text-[#92574c] hover:bg-[#f3e5e1]">
                    مشاهده همه
                    <ArrowUpLeft className="h-3.5 w-3.5" />
                  </Link>
                </div>

                <div className={`mt-4 grid gap-6 ${activeMenu.sections.length > 1 ? "md:grid-cols-2" : "grid-cols-1"}`}>
                  {activeMenu.sections.map((section) => (
                    <section key={section.title}>
                      <h3 className="text-xs font-black text-[#3c3532]">{section.title}</h3>
                      <ul className="mt-3 grid gap-x-5 gap-y-1 sm:grid-cols-2">
                        {section.links.map((link) => (
                          <li key={link.label}>
                            <Link
                              href={link.href}
                              onClick={() => setActiveLabel(null)}
                              className="group flex items-center justify-between rounded-lg px-2 py-2 text-[13px] font-medium text-[#6f6966] transition hover:bg-[#fbf6f4] hover:text-[#92574c]"
                            >
                              <span>{link.label}</span>
                              <ArrowUpLeft className="h-3 w-3 opacity-0 transition group-hover:opacity-100" />
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 xl:hidden">
          <button type="button" aria-label="بستن منو" className="absolute inset-0 bg-[#241916]/25 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute bottom-16 right-0 top-16 flex w-[min(86vw,340px)] flex-col border-l border-[#eee5e2] bg-white/96 shadow-2xl backdrop-blur-xl">
            <div className="border-b border-[#eee5e2] p-4">
              <Link href={authenticated ? "/dashboard" : "/auth/login"} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-xl bg-[#fbf5f3] p-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#a45f53] text-white"><UserRound className="h-4.5 w-4.5" /></span>
                <span className="text-sm font-black">{authenticated ? "حساب من" : "ورود / ثبت‌نام"}</span>
              </Link>
            </div>
            <nav className="flex-1 overflow-y-auto p-3" aria-label="منوی موبایل">
              <ul className="space-y-0.5">
                {mobileLinks.map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} onClick={() => setMobileOpen(false)} className="flex items-center rounded-xl px-4 py-3 text-sm font-bold text-[#4f4946] hover:bg-[#fbf5f3] hover:text-[#92574c]">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            {authenticated && (
              <div className="border-t border-[#eee5e2] p-3">
                <button type="button" onClick={() => void logout()} className="flex w-full items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-destructive hover:bg-destructive/10">
                  <LogOut className="h-4 w-4" />خروج از حساب
                </button>
              </div>
            )}
          </aside>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-50 grid h-16 grid-cols-5 border-t border-[#eee5e2] bg-white/94 px-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(0,0,0,0.04)] backdrop-blur-xl xl:hidden" aria-label="دسترسی سریع موبایل">
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
