import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, BookOpen, BriefcaseBusiness, FileText, ShieldCheck, Sparkles } from "lucide-react"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"

type ContentPageConfig = {
  title: string
  description: string
  icon: typeof Sparkles
  items: string[]
}

const pages: Record<string, ContentPageConfig> = {
  magazine: {
    title: "مجله زیبایی لوکس بیوتی",
    description: "راهنماهای کاربردی برای مراقبت، انتخاب سالن و تجربه بهتر خدمات زیبایی.",
    icon: BookOpen,
    items: ["مراقبت مو", "ناخن", "آرایش و میکاپ", "مراقبت پوست غیرپزشکی", "راهنمای انتخاب سالن", "آموزش ارائه‌دهندگان"],
  },
  about: {
    title: "درباره لوکس بیوتی",
    description: "لوکس بیوتی برای ساده‌تر، شفاف‌تر و مطمئن‌تر شدن رزرو خدمات زیبایی ساخته شده است.",
    icon: Sparkles,
    items: ["مقایسه سالن‌ها و متخصصان", "مشاهده نمونه‌کارها", "رزرو آنلاین", "پشتیبانی از کاربران و ارائه‌دهندگان"],
  },
  careers: {
    title: "همکاری با ما",
    description: "برای ساخت تجربه بهتر در صنعت زیبایی به تیم و شبکه ارائه‌دهندگان لوکس بیوتی بپیوندید.",
    icon: BriefcaseBusiness,
    items: ["فرصت‌های همکاری تیمی", "ثبت سالن زیبایی", "ثبت آرایشگاه مردانه", "ثبت متخصص مستقل", "ثبت خدمات در منزل"],
  },
  terms: {
    title: "قوانین و مقررات",
    description: "چارچوب استفاده کاربران و ارائه‌دهندگان از خدمات لوکس بیوتی.",
    icon: FileText,
    items: ["شرایط رزرو", "تعهدات کاربران", "تعهدات ارائه‌دهندگان", "لغو و بازپرداخت", "رسیدگی به شکایت"],
  },
  privacy: {
    title: "حریم خصوصی",
    description: "اصول جمع‌آوری، استفاده و نگهداری اطلاعات در لوکس بیوتی.",
    icon: ShieldCheck,
    items: ["اطلاعات حساب", "اطلاعات رزرو", "امنیت داده", "تنظیمات ارتباطی", "درخواست حذف اطلاعات"],
  },
  "terms-of-use": {
    title: "شرایط استفاده",
    description: "شرایط عمومی استفاده از وب‌سایت، حساب کاربری و قابلیت‌های رزرو.",
    icon: FileText,
    items: ["ایجاد حساب", "استفاده مجاز", "پرداخت", "محدودیت مسئولیت", "تغییر خدمات"],
  },
  licenses: {
    title: "مجوزها",
    description: "اطلاعات مجوزها و نشان‌های اعتماد لوکس بیوتی در این بخش منتشر می‌شود.",
    icon: ShieldCheck,
    items: ["نماد اعتماد الکترونیکی", "ساماندهی", "مجوزهای فعالیت", "اطلاعات ثبتی"],
  },
}

export default async function ContentPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ category?: string }>
}) {
  const { slug } = await params
  const { category } = await searchParams
  const page = pages[slug]

  if (!page) notFound()

  const Icon = page.icon
  const selectedCategory = category
    ? page.items.find((item) => item.toLowerCase().includes(category.toLowerCase()))
    : undefined

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 pt-16">
        <section className="border-b border-border bg-card">
          <div className="mx-auto max-w-5xl px-4 py-16 lg:px-8 lg:py-24">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Icon className="h-7 w-7" />
            </div>
            <h1 className="mt-6 text-3xl font-black text-foreground md:text-5xl">{page.title}</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">{page.description}</p>
            {selectedCategory && (
              <p className="mt-4 text-sm font-bold text-primary">دسته انتخاب‌شده: {selectedCategory}</p>
            )}
          </div>
        </section>

        <section className="mx-auto w-full max-w-5xl px-4 py-14 lg:px-8">
          <div className="grid gap-4 md:grid-cols-2">
            {page.items.map((item) => (
              <div key={item} className="rounded-2xl border border-border bg-card p-5">
                <h2 className="font-bold text-foreground">{item}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  محتوای کامل این بخش به‌زودی در لوکس بیوتی منتشر می‌شود.
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/salons">
              <Button>
                مشاهده سالن‌ها و متخصصان
                <ArrowLeft className="mr-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline">تماس با پشتیبانی</Button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
