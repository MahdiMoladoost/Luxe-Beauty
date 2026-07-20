"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"

const mainMenu = [
  { title: "خدمات", items: ["بانوان", "آقایان", "کودکان", "خدمات در منزل", "عروس و داماد", "مشاهده همه خدمات"] },
  { title: "سالن‌ها و متخصصان", items: ["سالن‌های نزدیک من", "سالن‌های برتر", "سالن‌های زنانه", "آرایشگاه‌های مردانه", "آرایشگاه کودک", "متخصصان مستقل", "مراکز خدمات در منزل"] },
  { title: "نوبت امروز", items: ["نوبت‌های خالی امروز", "نوبت فوری", "اولین زمان‌های آزاد", "نوبت‌های آخر هفته"] },
  { title: "تخفیف‌ها", items: ["تخفیف‌های امروز", "اولین رزرو", "ساعات کم‌تقاضا", "پیشنهادهای ویژه", "پکیج‌ها"] },
  { title: "شهرها", items: ["تهران", "کرج", "مشهد", "اصفهان", "شیراز", "تبریز", "قم", "اهواز", "رشت", "مشاهده همه شهرها"] },
  { title: "نمونه‌کارها", items: ["مو", "ناخن", "میکاپ", "عروس", "پوست", "مردانه", "قبل و بعد"] },
  { title: "مجله زیبایی", items: ["مراقبت مو", "ناخن", "آرایش و میکاپ", "مراقبت پوست غیرپزشکی", "راهنمای انتخاب سالن", "آموزش ارائه‌دهندگان"] },
  { title: "پشتیبانی", items: ["راهنمای رزرو", "پیگیری نوبت", "لغو و تغییر زمان", "بازپرداخت", "ثبت شکایت", "سؤالات پرتکرار", "تماس با ما"] },
]

const mobileItems = ["خدمات", "سالن‌ها", "متخصصان", "نوبت امروز", "تخفیف‌ها", "شهرها", "نمونه‌کارها", "مجله", "پشتیبانی", "ثبت سالن یا متخصص"]

export function Header() {
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed top-0 right-0 left-0 z-50 glass border-b border-border/50">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-8">
        <div className="flex items-center gap-6">
          <button className="lg:hidden" onClick={() => setOpen(!open)} aria-label="menu">☰</button>
          <Link href="/" className="font-bold text-xl">لوکس بیوتی</Link>
          <div className="hidden lg:flex gap-5">
            {mainMenu.map((menu) => (
              <div key={menu.title} className="group relative">
                <button className="text-sm font-medium">{menu.title}</button>
                <div className="invisible group-hover:visible absolute top-8 right-0 w-72 rounded-xl bg-card p-4 shadow-xl border space-y-2">
                  {menu.items.map((item) => <Link key={item} href="#" className="block text-sm">{item}</Link>)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden lg:block text-sm">انتخاب شهر و محله</span>
          <span>⌕</span>
          <span className="hidden lg:block">♡</span>
          <span className="hidden lg:block">نوبت‌های من</span>
          <Link href="/auth/login"><Button variant="ghost">ورود / ثبت‌نام</Button></Link>
          <div className="hidden lg:block group relative">
            <Button>ثبت سالن یا متخصص</Button>
            <div className="invisible group-hover:visible absolute left-0 top-10 w-64 rounded-xl bg-card p-4 shadow-xl border space-y-2">
              {["ثبت سالن زیبایی", "ثبت آرایشگاه مردانه", "ثبت متخصص مستقل", "ثبت متخصص خدمات در منزل", "ورود ارائه‌دهندگان", "مشاهده تعرفه‌ها"].map(x => <Link key={x} href="#" className="block text-sm">{x}</Link>)}
            </div>
          </div>
        </div>
      </nav>

      {open && <div className="lg:hidden border-t p-4 bg-card space-y-3">
        {mobileItems.map(item => <Link key={item} href="#" className="block">{item}</Link>)}
      </div>}
    </header>
  )
}