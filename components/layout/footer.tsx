import Link from "next/link"
import { ArrowUpLeft, Clock3, MapPin, Phone, Sparkles } from "lucide-react"

const footerLinks = {
  company: [
    { name: "درباره لوکس بیوتی", href: "/about" },
    { name: "تماس با ما", href: "/contact" },
    { name: "همکاری با ما", href: "/salon-register" },
    { name: "فرصت‌های شغلی", href: "/careers" },
    { name: "مجله زیبایی", href: "/magazine" },
    { name: "شهرهای تحت پوشش", href: "/cities" },
  ],
  customers: [
    { name: "راهنمای رزرو", href: "/support/booking-guide" },
    { name: "نوبت‌های من", href: "/dashboard/appointments" },
    { name: "پیگیری نوبت", href: "/dashboard/appointments" },
    { name: "لغو و تغییر زمان", href: "/support/change-booking" },
    { name: "بازپرداخت", href: "/support/refund" },
    { name: "تخفیف‌ها", href: "/salons?discount=1" },
    { name: "باشگاه مشتریان", href: "/club" },
    { name: "سؤالات پرتکرار", href: "/support#faq" },
    { name: "ثبت شکایت", href: "/support/tickets" },
  ],
  providers: [
    { name: "ثبت سالن یا متخصص", href: "/salon-register" },
    { name: "ورود ارائه‌دهندگان", href: "/salon-dashboard" },
    { name: "امکانات پنل", href: "/salon-register#features" },
    { name: "تعرفه‌ها", href: "/pricing" },
    { name: "مدیریت چندشعبه‌ای", href: "/salon-register?type=multi-branch" },
    { name: "تبلیغات و جایگاه ویژه", href: "/salon-register#advertising" },
    { name: "درخواست مشاوره", href: "/contact?subject=provider-consultation" },
    { name: "پشتیبانی ارائه‌دهندگان", href: "/support/providers" },
  ],
  services: [
    { name: "کوتاهی مو", href: "/salons?service=کوتاهی مو" },
    { name: "رنگ و هایلایت", href: "/salons?service=رنگ و هایلایت" },
    { name: "کراتین مو", href: "/salons?service=کراتین مو" },
    { name: "ناخن", href: "/salons?service=کاشت ناخن" },
    { name: "میکاپ و عروس", href: "/salons?service=میکاپ و شینیون" },
    { name: "اصلاح مردانه", href: "/salons?service=اصلاح مردانه" },
    { name: "خدمات کودک", href: "/salons?audience=kids" },
    { name: "خدمات در منزل", href: "/salons?delivery=home" },
  ],
  cities: ["تهران", "کرج", "مشهد", "اصفهان", "شیراز", "تبریز", "قم", "اهواز", "رشت"].map((city) => ({
    name: city,
    href: `/salons?city=${city}`,
  })),
  legal: [
    { name: "قوانین استفاده", href: "/terms" },
    { name: "حریم خصوصی", href: "/privacy" },
    { name: "شرایط رزرو", href: "/terms#booking" },
    { name: "لغو و بازپرداخت", href: "/terms#refund" },
    { name: "قوانین خدمات در منزل", href: "/terms#home-services" },
    { name: "قوانین نظرات", href: "/terms#reviews" },
    { name: "سیاست کوکی", href: "/privacy#cookies" },
    { name: "حذف حساب", href: "/privacy#delete-account" },
    { name: "رسیدگی به شکایت", href: "/support/tickets" },
  ],
}

function FooterColumn({ title, links }: { title: string; links: { name: string; href: string }[] }) {
  return (
    <div>
      <h3 className="text-sm font-bold text-[#f2d8ad]">{title}</h3>
      <ul className="mt-5 space-y-3">
        {links.map((link) => (
          <li key={`${title}-${link.name}`}>
            <Link href={link.href} className="text-sm leading-6 text-[#cdb9ac]/62 transition-colors hover:text-[#efd09c] focus-visible:outline-none focus-visible:text-[#efd09c]">
              {link.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-[#ddb981]/16 bg-[#160d0b] pb-24 text-[#fff0dc] lg:pb-0">
      <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-[44rem] -translate-x-1/2 rounded-full bg-[#b98955]/[0.07] blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-4 py-16 lg:px-8 lg:py-20">
        <div className="grid gap-12 md:grid-cols-2 xl:grid-cols-[1.35fr_repeat(6,1fr)]">
          <div className="md:col-span-2 xl:col-span-1">
            <Link href="/" className="inline-flex items-center gap-3" aria-label="صفحه اصلی لوکس بیوتی">
              <span className="flex h-12 w-12 items-center justify-center rounded-[18px] border border-[#e1bd83]/22 bg-[#c1935c]/12 text-[#edca92]">
                <Sparkles className="h-5 w-5" strokeWidth={1.5} />
              </span>
              <span>
                <span className="block font-serif text-2xl tracking-[0.08em] text-[#fff0dc]">LUXE BEAUTY</span>
                <span className="mt-1 block text-[9px] font-semibold tracking-[0.25em] text-[#d3ad72]">ONLINE BEAUTY BOOKING</span>
              </span>
            </Link>
            <p className="mt-6 max-w-sm text-sm leading-7 text-[#cdb9ac]/62">
              پلتفرم جست‌وجو، مقایسه و رزرو آنلاین خدمات زیبایی برای بانوان، آقایان، کودکان و خدمات در منزل.
            </p>
            <div className="mt-6 space-y-3 text-sm text-[#d2beb0]/68">
              <a href="tel:09399496078" className="flex items-center gap-3 transition hover:text-[#efd09c]">
                <Phone className="h-4 w-4 text-[#d9b579]" />
                ۰۹۳۹۹۴۹۶۰۷۸
              </a>
              <p className="flex items-start gap-3 leading-6">
                <Clock3 className="mt-1 h-4 w-4 shrink-0 text-[#d9b579]" />
                شنبه تا پنجشنبه ۹ تا ۲۱<br />جمعه و تعطیلات ۱۰ تا ۱۸
              </p>
              <p className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-[#d9b579]" />
                نشانی فقط پس از ثبت اطلاعات رسمی نمایش داده می‌شود.
              </p>
            </div>
            <p className="mt-6 text-xs leading-6 text-[#ad998d]/48">شبکه‌های اجتماعی تنها پس از ثبت لینک معتبر در پنل نمایش داده می‌شوند.</p>
          </div>

          <FooterColumn title="لوکس بیوتی" links={footerLinks.company} />
          <FooterColumn title="مشتریان" links={footerLinks.customers} />
          <FooterColumn title="ارائه‌دهندگان" links={footerLinks.providers} />
          <FooterColumn title="خدمات محبوب" links={footerLinks.services} />
          <FooterColumn title="شهرهای محبوب" links={footerLinks.cities} />
          <FooterColumn title="حقوقی" links={footerLinks.legal} />
        </div>

        <div className="mt-14 grid gap-4 border-t border-[#ddb981]/12 pt-8 text-xs text-[#bca89a]/55 md:grid-cols-[1fr_auto] md:items-center">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <p>کلیه حقوق این سامانه متعلق به لوکس بیوتی است.</p>
            <Link href="/status" className="transition hover:text-[#efd09c]">وضعیت سرویس</Link>
            <Link href="/privacy#cookies" className="transition hover:text-[#efd09c]">تنظیمات کوکی</Link>
            <Link href="/accessibility" className="transition hover:text-[#efd09c]">دسترس‌پذیری</Link>
            <Link href="/sitemap.xml" className="transition hover:text-[#efd09c]">نقشه سایت</Link>
          </div>
          <Link href="/support" className="inline-flex items-center gap-2 font-bold text-[#d8b57b] transition hover:text-[#efd09c]">
            مرکز راهنما و پشتیبانی
            <ArrowUpLeft className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </footer>
  )
}
