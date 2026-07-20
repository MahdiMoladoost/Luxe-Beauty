import Link from "next/link"
import { Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const stats = [
  { value: "+۵,۰۰۰", label: "سالن و متخصص" },
  { value: "+۱۵۰,۰۰۰", label: "رزرو موفق" },
  { value: "۳۱", label: "استان فعال" },
  { value: "۴.۸", label: "میانگین رضایت" },
]

export function HeroSlider() {
  return (
    <section className="relative overflow-hidden bg-[#fffaf8]">
      <div className="relative mx-auto h-[560px] max-w-[1920px] overflow-hidden lg:h-[590px]">
        <img
          src="/hero/slide-3.webp"
          alt="خدمات زیبایی لوکس بیوتی برای بانوان و آقایان"
          className="absolute inset-0 h-full w-full object-cover object-center"
          fetchPriority="high"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-white/18 via-white/8 to-transparent" />
        <div className="absolute inset-y-0 left-0 w-[58%] bg-gradient-to-r from-white/96 via-white/78 to-transparent" />

        <div className="relative z-10 mx-auto flex h-full max-w-[1500px] items-center px-5 pb-16 pt-8 lg:px-10">
          <div className="w-full max-w-[520px] text-right">
            <span className="inline-flex items-center rounded-full border border-[#eadbd6] bg-white/88 px-3.5 py-2 text-[11px] font-bold text-[#9b5d52] shadow-sm backdrop-blur-xl">
              رزرو آنلاین خدمات زیبایی
            </span>

            <h1 className="mt-5 text-balance text-4xl font-black leading-[1.28] text-[#201b19] sm:text-5xl lg:text-[3.4rem]">
              انتخاب ظریف، رزرو مطمئن
            </h1>

            <p className="mt-4 max-w-md text-sm leading-8 text-[#625b58] sm:text-base">
              نمونه‌کارها، امتیازها و زمان‌های آزاد سالن‌ها و متخصصان را مقایسه کن و بدون تماس نوبت بگیر.
            </p>

            <div className="mt-7 max-w-[500px] rounded-[1.35rem] border border-[#e9dfdc] bg-white/90 p-2 shadow-[0_16px_45px_rgba(82,52,45,0.1)] backdrop-blur-xl">
              <div className="flex items-center gap-2">
                <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl bg-[#faf8f7] px-4">
                  <Search className="h-[18px] w-[18px] shrink-0 text-[#a16a60]" />
                  <Input
                    aria-label="جست‌وجوی سالن، متخصص یا خدمت"
                    placeholder="نام سالن، متخصص یا خدمت..."
                    className="h-11 border-0 bg-transparent px-0 text-sm shadow-none placeholder:text-[#958d89] focus-visible:ring-0"
                  />
                </div>
                <Link href="/salons" className="shrink-0">
                  <Button className="h-11 rounded-2xl bg-[#a45f53] px-7 text-sm font-black text-white shadow-sm hover:bg-[#925247]">
                    جست‌وجو
                  </Button>
                </Link>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-bold">
              <Link href="/salons?availability=today" className="rounded-full border border-[#eadbd6] bg-white/82 px-3.5 py-2 text-[#554e4b] backdrop-blur hover:bg-white">
                نوبت امروز
              </Link>
              <Link href="/salons?offer=discount" className="rounded-full border border-[#eadbd6] bg-white/82 px-3.5 py-2 text-[#554e4b] backdrop-blur hover:bg-white">
                تخفیف‌های فعال
              </Link>
              <Link href="/salon-register" className="rounded-full border border-[#deb7ae] bg-[#fff5f2]/88 px-3.5 py-2 text-[#98594e] backdrop-blur hover:bg-white">
                همکاری با لوکس بیوتی
              </Link>
            </div>
          </div>
        </div>

        <svg aria-hidden="true" className="absolute -bottom-px left-0 z-20 h-[54px] w-full" viewBox="0 0 1440 80" preserveAspectRatio="none">
          <path className="fill-background" d="M0 42C215 72 389 68 565 43C757 16 925 15 1104 46C1236 68 1343 67 1440 52V80H0V42Z" />
        </svg>
      </div>

      <div className="relative z-30 mx-auto -mt-7 max-w-[980px] px-4 pb-4">
        <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-[#eadfdc] bg-white/92 shadow-[0_12px_32px_rgba(67,43,37,0.08)] backdrop-blur-xl md:grid-cols-4">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={`px-4 py-3.5 text-center ${index % 2 === 1 ? "border-r border-[#eee5e2]" : ""} ${index >= 2 ? "border-t border-[#eee5e2] md:border-t-0" : ""} ${index > 0 ? "md:border-r md:border-[#eee5e2]" : ""}`}
            >
              <div className="text-lg font-black tabular-nums text-[#2e2826] sm:text-xl">{stat.value}</div>
              <div className="mt-0.5 text-[11px] font-medium text-[#827a76]">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
