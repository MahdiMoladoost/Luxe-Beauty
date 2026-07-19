import Link from "next/link"
import { BarChart3, HeartHandshake, ShieldCheck, Sparkles, Store, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ContentCard, ContentPage } from "@/components/layout/content-page"

const values = [
  { title: "اعتماد و شفافیت", description: "قیمت، قوانین، امتیاز و سوابق رزرو پیش از تصمیم‌گیری در دسترس مشتری است.", icon: ShieldCheck },
  { title: "رشد منصفانه سالن‌ها", description: "سالن‌ها با کیفیت خدمت و پاسخگویی بهتر دیده می‌شوند، نه صرفاً با تبلیغ بیشتر.", icon: Store },
  { title: "تجربه انسانی", description: "فناوری باید کار رزرو و مدیریت را ساده کند و جای ارتباط حرفه‌ای را نگیرد.", icon: HeartHandshake },
]

export default function AboutPage() {
  return (
    <ContentPage
      eyebrow="درباره لوکس بیوتی"
      title="رزرو زیبایی، ساده‌تر و قابل اعتمادتر"
      description="لوکس بیوتی مشتریان، سالن‌ها و متخصصان زیبایی را در یک تجربه شفاف برای کشف، مقایسه، رزرو و مدیریت نوبت به هم متصل می‌کند."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {values.map((value) => (
          <ContentCard key={value.title} title={value.title}>
            <value.icon className="mb-3 h-8 w-8 text-primary" />
            <p>{value.description}</p>
          </ContentCard>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <ContentCard title="ماموریت ما">
          <p>کاهش اصطکاک رزرو، حذف نوبت‌های فراموش‌شده، افزایش درآمد پایدار سالن و ایجاد سابقه قابل اعتماد برای هر خدمت.</p>
          <p className="mt-3">هدف ما فقط فهرست کردن سالن‌ها نیست؛ محصول باید از لحظه جستجو تا تسویه، پشتیبانی و بازگشت مشتری را پوشش دهد.</p>
        </ContentCard>
        <ContentCard title="چشم‌انداز">
          <p>تبدیل شدن به زیرساخت عملیاتی صنعت خدمات زیبایی ایران؛ جایی که برنامه کاری، مشتری، مالی، بازاریابی و کیفیت خدمت در یک سیستم منسجم مدیریت شود.</p>
        </ContentCard>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "سالن نمونه", value: "+۵٬۰۰۰", icon: Store },
          { label: "کاربر هدف", value: "+۱۵۰٬۰۰۰", icon: Users },
          { label: "رزرو قابل مدیریت", value: "۲۴/۷", icon: BarChart3 },
          { label: "تعهد محصول", value: "شفافیت", icon: Sparkles },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-border bg-card p-5">
            <stat.icon className="h-6 w-6 text-primary" />
            <p className="mt-4 text-2xl font-black text-foreground">{stat.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-3xl bg-primary p-7 text-primary-foreground md:flex md:items-center md:justify-between">
        <div><h2 className="text-2xl font-black">برای همکاری آماده‌اید؟</h2><p className="mt-2 text-sm opacity-85">سالن خود را ثبت کنید یا با تیم پشتیبانی درباره همکاری سازمانی صحبت کنید.</p></div>
        <div className="mt-5 flex gap-3 md:mt-0"><Button variant="secondary" asChild><Link href="/salon-register">ثبت سالن</Link></Button><Button variant="outline" className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10" asChild><Link href="/contact">تماس با ما</Link></Button></div>
      </div>
    </ContentPage>
  )
}
