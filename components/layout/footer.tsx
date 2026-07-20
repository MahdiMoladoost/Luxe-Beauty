import Link from "next/link"
import { Instagram, Linkedin, Send, Sparkles, Twitter } from "lucide-react"

const footerLinks = {
  platform: [
    { name: "جست‌وجوی سالن و متخصص", href: "/salons" },
    { name: "نوبت‌های خالی امروز", href: "/salons?availability=today" },
    { name: "ثبت سالن یا متخصص", href: "/salon-register" },
    { name: "تعرفه‌ها و پلن‌ها", href: "/pricing" },
  ],
  support: [
    { name: "راهنمای رزرو", href: "/support/booking-guide" },
    { name: "پیگیری نوبت", href: "/dashboard/appointments" },
    { name: "لغو و تغییر زمان", href: "/support/change-booking" },
    { name: "بازپرداخت و شکایت", href: "/support/refund" },
    { name: "تماس با ما", href: "/contact" },
  ],
  company: [
    { name: "درباره ما", href: "/about" },
    { name: "همکاری با ما", href: "/careers" },
    { name: "مجله زیبایی", href: "/magazine" },
    { name: "ورود ارائه‌دهندگان", href: "/salon-dashboard" },
  ],
  legal: [
    { name: "قوانین و مقررات", href: "/terms" },
    { name: "حریم خصوصی", href: "/privacy" },
    { name: "شرایط استفاده", href: "/terms-of-use" },
    { name: "مجوزها", href: "/licenses" },
  ],
}

const socialLinks = [
  { name: "اینستاگرام", href: "#", icon: Instagram },
  { name: "توییتر", href: "#", icon: Twitter },
  { name: "لینکدین", href: "#", icon: Linkedin },
  { name: "تلگرام", href: "#", icon: Send },
]

function FooterColumn({
  title,
  links,
}: {
  title: string
  links: { name: string; href: string }[]
}) {
  return (
    <div>
      <h3 className="text-sm font-bold text-foreground">{title}</h3>
      <ul className="mt-4 space-y-3">
        {links.map((link) => (
          <li key={link.name}>
            <Link
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
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
    <footer className="border-t border-border bg-card pb-16 lg:pb-0">
      <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm shadow-primary/20">
                <Sparkles className="h-5 w-5" />
              </span>
              <span className="text-xl font-black text-foreground">لوکس بیوتی</span>
            </Link>
            <p className="mt-6 max-w-sm text-sm leading-7 text-muted-foreground">
              پلتفرم جست‌وجو، مقایسه و رزرو آنلاین خدمات زیبایی برای بانوان، آقایان، کودکان و خدمات در منزل.
            </p>
            <div className="mt-6 flex items-center gap-3">
              {socialLinks.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  aria-label={item.name}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  <item.icon className="h-5 w-5" />
                </Link>
              ))}
            </div>
          </div>

          <FooterColumn title="لوکس بیوتی" links={footerLinks.platform} />
          <FooterColumn title="پشتیبانی" links={footerLinks.support} />
          <FooterColumn title="شرکت" links={footerLinks.company} />
          <FooterColumn title="قوانین" links={footerLinks.legal} />
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-6 border-t border-border pt-8 lg:flex-row">
          <div className="flex flex-col items-center gap-4 lg:flex-row lg:gap-8">
            <p className="text-sm text-muted-foreground">تمامی حقوق محفوظ است — لوکس بیوتی ۱۴۰۵</p>
            <div className="flex items-center gap-4">
              <div className="flex h-8 w-12 items-center justify-center rounded bg-secondary">
                <span className="text-[10px] text-muted-foreground">E-Namad</span>
              </div>
              <div className="flex h-8 w-12 items-center justify-center rounded bg-secondary">
                <span className="text-[10px] text-muted-foreground">Samandehi</span>
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">رزرو مطمئن، انتخاب آگاهانه</p>
        </div>
      </div>
    </footer>
  )
}
