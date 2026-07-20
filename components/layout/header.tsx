"use client"

import Link from "next/link"
import { useEffect, useState, type ReactNode } from "react"
import { ChevronDown, Heart, Menu, Search, UserRound, X } from "lucide-react"

type MenuLink = {
  label: string
  href: string
}

type MenuSection = {
  title: string
  links: MenuLink[]
}

type NavigationItem = {
  label: string
  href: string
  eyebrow: string
  description: string
  sections: MenuSection[]
}

const AUTH_STORAGE_KEY = "luxe-beauty-authenticated"

const navigation: NavigationItem[] = [
  {
    label: "خدمات",
    href: "/salons",
    eyebrow: "انتخاب خدمت",
    description: "خدمت موردنظرتان را انتخاب کنید و بهترین زمان‌های آزاد را ببینید.",
    sections: [
      {
        title: "گروه خدمات",
        links: [
          { label: "خدمات بانوان", href: "/salons?audience=women" },
          { label: "خدمات آقایان", href: "/salons?audience=men" },
          { label: "خدمات کودکان", href: "/salons?audience=children" },
        ],
      },
      {
        title: "رزرو ویژه",
        links: [
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
    eyebrow: "انتخاب مطمئن",
    description: "سالن‌ها و متخصصان را بر اساس امتیاز، موقعیت و نمونه‌کار مقایسه کنید.",
    sections: [
      {
        title: "سالن‌ها",
        links: [
          { label: "سالن‌های نزدیک من", href: "/salons?sort=nearby" },
          { label: "سالن‌های برتر", href: "/salons?sort=top" },
          { label: "سالن‌های زنانه", href: "/salons?type=women" },
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
    eyebrow: "رزرو سریع",
    description: "نوبت‌های خالی امروز و اولین زمان‌های آزاد را سریع پیدا کنید.",
    sections: [
      {
        title: "برای امروز",
        links: [
          { label: "نوبت‌های خالی امروز", href: "/salons?availability=today" },
          { label: "نوبت فوری", href: "/salons?availability=urgent" },
        ],
      },
      {
        title: "زمان پیشنهادی",
        links: [
          { label: "اولین زمان آزاد", href: "/salons?sort=first-available" },
          { label: "آخر هفته", href: "/salons?availability=weekend" },
        ],
      },
    ],
  },
  {
    label: "تخفیف‌ها",
    href: "/salons?offer=discount",
    eyebrow: "پیشنهادهای ویژه",
    description: "تخفیف‌ها و پکیج‌های فعال را برای شهر و خدمت موردنظر ببینید.",
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
        title: "پکیج‌ها",
        links: [
          { label: "پیشنهادهای ویژه", href: "/salons?offer=special" },
          { label: "همه پکیج‌ها", href: "/salons?offer=packages" },
        ],
      },
    ],
  },
  {
    label: "شهرها",
    href: "/salons",
    eyebrow: "نزدیک شما",
    description: "سالن‌ها و متخصصان فعال شهر خودتان را پیدا کنید.",
    sections: [
      {
        title: "شهرهای محبوب",
        links: [
          { label: "تهران", href: "/salons?city=تهران" },
          { label: "کرج", href: "/salons?city=کرج" },
          { label: "مشهد", href: "/salons?city=مشهد" },
        ],
      },
      {
        title: "شهرهای بیشتر",
        links: [
          { label: "اصفهان", href: "/salons?city=اصفهان" },
          { label: "شیراز", href: "/salons?city=شیراز" },
          { label: "همه شهرها", href: "/salons" },
        ],
      },
    ],
  },
  {
    label: "نمونه‌کارها",
    href: "/salons?view=portfolio",
    eyebrow: "قبل از انتخاب ببینید",
    description: "نمونه‌کارهای واقعی را بر اساس سبک و نوع خدمت مرور کنید.",
    sections: [
      {
        title: "دسته‌بندی‌ها",
        links: [
          { label: "مو", href: "/salons?portfolio=hair" },
          { label: "ناخن", href: "/salons?portfolio=nails" },
          { label: "میکاپ", href: "/salons?portfolio=makeup" },
        ],
      },
      {
        title: "بیشتر ببینید",
        links: [
          { label: "عروس", href: "/salons?portfolio=bride" },
          { label: "پوست", href: "/salons?portfolio=skin" },
          { label: "قبل و بعد", href: "/salons?portfolio=before-after" },
        ],
      },
    ],
  },
  {
    label: "مجله",
    href: "/magazine",
    eyebrow: "مجله زیبایی",
    description: "راهنماها و مطالب کاربردی مراقبت و زیبایی را بخوانید.",
    sections: [
      {
        title: "مراقبت و زیبایی",
        links: [
          { label: "مراقبت مو", href: "/magazine?category=hair" },
          { label: "ناخن", href: "/magazine?category=nails" },
          { label: "آرایش و میکاپ", href: "/magazine?category=makeup" },
        ],
      },
      {
        title: "راهنماها",
        links: [
          { label: "انتخاب سالن", href: "/magazine?category=salon-guide" },
          { label: "آموزش ارائه‌دهندگان", href: "/magazine?category=providers" },
        ],
      },
    ],
  },
  {
    label: "پشتیبانی",
    href: "/contact",
    eyebrow: "همراه شما",
    description: "برای رزرو، پرداخت یا پیگیری نوبت از راهنمای لوکس بیوتی استفاده کنید.",
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
        title: "ارتباط با ما",
        links: [
          { label: "سؤالات پرتکرار", href: "/support/faq" },
          { label: "تماس با ما", href: "/contact" },
        ],
      },
    ],
  },
]

function LuxeBeautyMark() {
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[15px] border border-[#edc8bd] bg-[#fffaf8] shadow-[0_3px_12px_rgba(166,96,78,0.12)]">
      <svg viewBox="0 0 48 48" className="h-10 w-10" aria-hidden="true">
        <path
          d="M13.5 35.5c5.4-1.5 8.4-6.8 8.4-14.7V10.5m0 10.4c4.2-6.4 10.8-8.2 14-4.5 3.4 4-1 8-6.6 8.1 6.4.2 10.5 4.7 7 9-4.1 5.2-12.8 1.7-14.4-5.3"
          fill="none"
          stroke="#c98270"
          strokeWidth="1.55"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M17 12.2c-3.5 3.2-4.6 7.2-3.1 10.6 1.3 3 4.4 4.3 7.7 3.2"
          fill="none"
          stroke="#dfaa9a"
          strokeWidth="1.05"
          strokeLinecap="round"
        />
        <path d="M10.8 36.4c6.7 1.2 13.7-.6 18.4-5" fill="none" stroke="#e6b8aa" strokeWidth=".9" strokeLinecap="round" />
      </svg>
    </span>
  )
}

function Brand() {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="لوکس بیوتی، صفحه اصلی">
      <LuxeBeautyMark />
      <span className="hidden min-w-[82px] leading-none sm:block">
        <span className="block whitespace-nowrap text-[18px] font-black tracking-[-0.035em] text-[#191919]">لوکس بیوتی</span>
        <span className="mt-1.5 block whitespace-nowrap text-[9px] font-semibold tracking-[0.18em] text-[#c77c69]" dir="ltr">
          LUXE BEAUTY
        </span>
      </span>
    </Link>
  )
}

function HeaderIconLink({ href, label, children }: { href: string; label: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      title={label}
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-full text-[#66707c] transition-colors hover:bg-[#f4efed] hover:text-[#a85f50]"
    >
      {children}
    </Link>
  )
}

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeMenuLabel, setActiveMenuLabel] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const activeMenu = navigation.find((item) => item.label === activeMenuLabel) ?? null

  useEffect(() => {
    const syncAuth = () => {
      setIsAuthenticated(window.localStorage.getItem(AUTH_STORAGE_KEY) === "true")
    }

    syncAuth()
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

  return (
    <>
      <header
        className="fixed inset-x-0 top-0 z-50 border-b border-[#e8ebef] bg-[#fbfcfd]/95 backdrop-blur-xl"
        onMouseLeave={() => setActiveMenuLabel(null)}
      >
        <div className="mx-auto hidden h-16 max-w-[1800px] items-center gap-4 px-6 xl:flex 2xl:px-10">
          <Brand />

          <nav className="mx-2 flex min-w-0 flex-1 items-stretch justify-center self-stretch" aria-label="منوی اصلی">
            {navigation.map((item) => {
              const isActive = activeMenuLabel === item.label

              return (
                <button
                  key={item.label}
                  type="button"
                  aria-expanded={isActive}
                  onMouseEnter={() => setActiveMenuLabel(item.label)}
                  onFocus={() => setActiveMenuLabel(item.label)}
                  onClick={() => setActiveMenuLabel(isActive ? null : item.label)}
                  className={`relative flex items-center gap-1 whitespace-nowrap px-2 text-[12px] font-semibold transition-colors 2xl:px-3.5 2xl:text-[13px] ${
                    isActive ? "text-[#a85f50]" : "text-[#59616d] hover:text-[#20252b]"
                  }`}
                >
                  <span>{item.label}</span>
                  <ChevronDown className={`h-3.5 w-3.5 stroke-[2.2] transition-transform ${isActive ? "rotate-180" : ""}`} />
                  {isActive && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-[#c77c69]" />}
                </button>
              )
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-1" dir="rtl">
            <HeaderIconLink href="/salons" label="جست‌وجو">
              <Search className="h-[21px] w-[21px] stroke-[2]" />
            </HeaderIconLink>
            <HeaderIconLink href="/dashboard/favorites" label="علاقه‌مندی‌ها">
              <Heart className="h-[22px] w-[22px] stroke-[2]" />
            </HeaderIconLink>
            <Link
              href={isAuthenticated ? "/dashboard" : "/auth/login"}
              className="mr-1 flex h-10 items-center gap-2 rounded-full border border-[#ecc2b7] bg-[#fff8f5] px-4 text-[13px] font-bold text-[#a65d4f] shadow-[0_2px_10px_rgba(166,93,79,0.06)] transition-colors hover:border-[#dca594] hover:bg-[#fff3ee]"
            >
              <UserRound className="h-[18px] w-[18px] stroke-[1.9]" />
              <span>{isAuthenticated ? "حساب من" : "ورود / ثبت‌نام"}</span>
            </Link>
          </div>
        </div>

        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 xl:hidden">
          <Brand />
          <div className="flex items-center gap-1" dir="rtl">
            <HeaderIconLink href="/salons" label="جست‌وجو">
              <Search className="h-5 w-5" />
            </HeaderIconLink>
            <button
              type="button"
              aria-label={mobileMenuOpen ? "بستن منو" : "باز کردن منو"}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-[#59616d] hover:bg-[#f4efed]"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {activeMenu && (
          <div className="absolute inset-x-0 top-full hidden border-t border-[#eceef1] bg-white/98 shadow-[0_18px_45px_rgba(32,38,44,0.10)] xl:block">
            <div className="mx-auto grid max-w-6xl grid-cols-[260px_1fr] gap-10 px-8 py-7">
              <div className="rounded-2xl border border-[#f0ddd7] bg-[#fff9f7] p-5">
                <span className="text-xs font-bold text-[#b66c59]">{activeMenu.eyebrow}</span>
                <h2 className="mt-2 text-lg font-black text-[#242424]">{activeMenu.label}</h2>
                <p className="mt-2 text-sm leading-7 text-[#747b84]">{activeMenu.description}</p>
                <Link href={activeMenu.href} className="mt-4 inline-flex text-sm font-bold text-[#a85f50] hover:text-[#88493e]">
                  مشاهده همه
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-8">
                {activeMenu.sections.map((section) => (
                  <div key={section.title}>
                    <h3 className="border-b border-[#eceef1] pb-3 text-sm font-black text-[#30343a]">{section.title}</h3>
                    <div className="mt-3 grid gap-1">
                      {section.links.map((link) => (
                        <Link
                          key={link.label}
                          href={link.href}
                          className="rounded-lg px-3 py-2 text-sm font-medium text-[#656d77] transition-colors hover:bg-[#fff5f1] hover:text-[#a85f50]"
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 top-16 z-40 xl:hidden">
          <button
            type="button"
            aria-label="بستن منو"
            className="absolute inset-0 bg-black/25 backdrop-blur-[2px]"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="absolute inset-y-0 right-0 w-[min(88vw,360px)] overflow-y-auto border-l border-[#eceef1] bg-white p-4 shadow-2xl">
            <Link
              href={isAuthenticated ? "/dashboard" : "/auth/login"}
              onClick={() => setMobileMenuOpen(false)}
              className="mb-4 flex h-11 items-center justify-center gap-2 rounded-full border border-[#ecc2b7] bg-[#fff8f5] text-sm font-bold text-[#a65d4f]"
            >
              <UserRound className="h-5 w-5" />
              {isAuthenticated ? "حساب من" : "ورود / ثبت‌نام"}
            </Link>
            <nav className="grid gap-1" aria-label="منوی موبایل">
              {navigation.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between rounded-xl px-3 py-3 text-sm font-bold text-[#4e5661] hover:bg-[#fff5f1] hover:text-[#a85f50]"
                >
                  <span>{item.label}</span>
                  <ChevronDown className="h-4 w-4 rotate-90" />
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      )}
    </>
  )
}
