import Link from "next/link"

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}

function TwitterIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
    </svg>
  )
}

function LinkedInIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  )
}

function TelegramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  )
}

const footerLinks = {
  platform: [
    { name: "جستجوی آرایشگاه", href: "/salons" },
    { name: "ثبت‌نام آرایشگاه", href: "/salon-register" },
    { name: "تعرفه‌ها و پلن‌ها", href: "/pricing" },
    { name: "اپلیکیشن موبایل", href: "#" },
  ],
  support: [
    { name: "مرکز راهنمایی", href: "#" },
    { name: "سوالات متداول", href: "#" },
    { name: "تماس با پشتیبانی", href: "/contact" },
    { name: "گزارش مشکل", href: "#" },
  ],
  company: [
    { name: "درباره ما", href: "#" },
    { name: "فرصت‌های شغلی", href: "#" },
    { name: "وبلاگ", href: "#" },
    { name: "اخبار و رویدادها", href: "#" },
  ],
  legal: [
    { name: "قوانین و مقررات", href: "#" },
    { name: "حریم خصوصی", href: "#" },
    { name: "شرایط استفاده", href: "#" },
    { name: "مجوزها", href: "#" },
  ],
}

const socialLinks = [
  { name: "اینستاگرام", href: "#", icon: InstagramIcon },
  { name: "توییتر", href: "#", icon: TwitterIcon },
  { name: "لینکدین", href: "#", icon: LinkedInIcon },
  { name: "تلگرام", href: "#", icon: TelegramIcon },
]

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                <span className="text-lg font-bold text-primary-foreground">س</span>
              </div>
              <span className="text-xl font-bold text-foreground">سالن یاب</span>
            </Link>
            <p className="mt-6 text-sm leading-relaxed text-muted-foreground max-w-sm">
              پلتفرم جامع رزرو آنلاین خدمات زیبایی و آرایشگاهی در سراسر ایران.
              با بیش از ۵۰۰۰ آرایشگاه فعال و میلیون‌ها کاربر راضی.
            </p>
            <div className="mt-6 flex items-center gap-3">
              {socialLinks.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <item.icon />
                  <span className="sr-only">{item.name}</span>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">پلتفرم</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.platform.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">پشتیبانی</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">شرکت</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">قوانین</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-6 border-t border-border pt-8 lg:flex-row">
          <div className="flex flex-col items-center gap-4 lg:flex-row lg:gap-8">
            <p className="text-sm text-muted-foreground">
              تمامی حقوق محفوظ است - سالن یاب 1404
            </p>
            <div className="flex items-center gap-4">
              <div className="h-8 w-12 rounded bg-secondary flex items-center justify-center">
                <span className="text-[10px] text-muted-foreground">E-Namad</span>
              </div>
              <div className="h-8 w-12 rounded bg-secondary flex items-center justify-center">
                <span className="text-[10px] text-muted-foreground">Samandehi</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>ساخته شده با</span>
            <span className="text-primary">تعهد به کیفیت</span>
            <span>در ایران</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
