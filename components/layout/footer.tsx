import Link from "next/link"
import { Clock3, Instagram, Linkedin, Mail, MapPin, MessageCircle, Phone, Send, ShieldCheck } from "lucide-react"

const columns = [
  {
    title: "لینک‌های سریع",
    links: [
      { name: "صفحه اصلی", href: "/" },
      { name: "جستجوی سالن‌ها", href: "/salons" },
      { name: "تخفیف‌ها", href: "/offers" },
      { name: "دسته‌بندی خدمات", href: "/categories" },
      { name: "مجله زیبایی", href: "/blog" },
      { name: "ثبت سالن", href: "/salon-register" },
    ],
  },
  {
    title: "راهنمای مشتریان",
    links: [
      { name: "نحوه رزرو نوبت", href: "/booking" },
      { name: "پرداخت بیعانه", href: "/faq" },
      { name: "لغو یا جابه‌جایی", href: "/faq" },
      { name: "قوانین بازگشت وجه", href: "/terms" },
      { name: "سوالات متداول", href: "/faq" },
      { name: "مرکز پشتیبانی", href: "/support" },
    ],
  },
  {
    title: "مخصوص سالن‌داران",
    links: [
      { name: "ثبت سالن", href: "/salon-register" },
      { name: "امکانات پنل سالن", href: "/salon-dashboard" },
      { name: "تعرفه همکاری", href: "/pricing" },
      { name: "قوانین همکاری", href: "/terms" },
      { name: "ورود سالن‌داران", href: "/auth/login" },
      { name: "پشتیبانی سالن", href: "/support" },
    ],
  },
]

const socialLinks = [
  { label: "اینستاگرام", href: "#", icon: Instagram },
  { label: "تلگرام", href: "#", icon: Send },
  { label: "لینکدین", href: "#", icon: Linkedin },
  { label: "واتساپ", href: "#", icon: MessageCircle },
]

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-14 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-lg font-black text-primary-foreground">ل</div>
              <div><span className="block text-xl font-black text-foreground">لوکس بیوتی</span><span className="text-xs text-muted-foreground">پلتفرم رزرو آنلاین زیبایی</span></div>
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-7 text-muted-foreground">پلتفرم آنلاین جستجو، مقایسه و رزرو نوبت آرایشگاه و خدمات زیبایی؛ همراه با پنل مشتری، سالن، آرایشگر و مدیریت پلتفرم.</p>
            <div className="mt-5 flex gap-2">{socialLinks.map((item) => <a key={item.label} href={item.href} aria-label={item.label} className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-muted-foreground transition hover:bg-primary hover:text-primary-foreground"><item.icon className="h-5 w-5" /></a>)}</div>
            <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-xs"><Link href="/about" className="text-muted-foreground hover:text-foreground">درباره ما</Link><Link href="/contact" className="text-muted-foreground hover:text-foreground">تماس با ما</Link><Link href="/privacy" className="text-muted-foreground hover:text-foreground">حریم خصوصی</Link><Link href="/terms" className="text-muted-foreground hover:text-foreground">قوانین</Link></div>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="font-black text-foreground">{column.title}</h3>
              <ul className="mt-4 space-y-3">{column.links.map((link) => <li key={`${column.title}-${link.name}`}><Link href={link.href} className="text-sm text-muted-foreground transition hover:text-foreground">{link.name}</Link></li>)}</ul>
            </div>
          ))}

          <div>
            <h3 className="font-black text-foreground">اطلاعات تماس</h3>
            <ul className="mt-4 space-y-4 text-sm text-muted-foreground">
              <li className="flex items-start gap-2"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span dir="ltr">021-91000000</span></li>
              <li className="flex items-start gap-2"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span dir="ltr">support@luxebeauty.ir</span></li>
              <li className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>تهران، دفتر مرکزی لوکس بیوتی</span></li>
              <li className="flex items-start gap-2"><Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>شنبه تا پنجشنبه، ۹ تا ۲۱</span></li>
            </ul>
            <Link href="/support" className="mt-5 inline-flex text-sm font-bold text-primary">ارسال درخواست پشتیبانی</Link>
          </div>
        </div>

        <div className="mt-12 grid gap-4 border-t border-border pt-8 md:grid-cols-[1fr_auto] md:items-center">
          <div className="flex flex-wrap items-center gap-3">
            {["نماد اعتماد", "ساماندهی", "پرداخت امن", "مجوز همکاری"].map((item) => <div key={item} className="flex h-12 items-center gap-2 rounded-xl border border-border bg-background px-3 text-[11px] font-bold text-muted-foreground"><ShieldCheck className="h-4 w-4 text-primary" />{item}</div>)}
          </div>
          <p className="text-sm text-muted-foreground">تمامی حقوق برای لوکس بیوتی محفوظ است — ۱۴۰۵</p>
        </div>
        <p className="mt-4 text-xs leading-6 text-muted-foreground">نمایش نمادها و مجوزها در محیط تولید فقط پس از دریافت مجوز واقعی و اتصال لینک استعلام مجاز است.</p>
      </div>
    </footer>
  )
}
