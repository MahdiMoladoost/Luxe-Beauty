import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowRight, Clock3, ShieldAlert } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { blogPosts } from "@/lib/mock-data"

const articleBodies: Record<string, { intro: string; sections: Array<{ title: string; body: string }> }> = {
  "hair-color-care": {
    intro: "ماندگاری رنگ فقط به برند مواد وابسته نیست؛ شست‌وشو، حرارت، آفتاب و برنامه ترمیم هم نقش مستقیم دارند.",
    sections: [
      { title: "۴۸ ساعت اول را جدی بگیرید", body: "طبق توصیه متخصص خود، شست‌وشوی زودهنگام را محدود کنید تا رنگ فرصت تثبیت داشته باشد. شرایط مو و نوع رنگ می‌تواند این بازه را تغییر دهد." },
      { title: "شامپوی مناسب انتخاب کنید", body: "محصول ملایم و مناسب موهای رنگ‌شده معمولاً از کدر شدن سریع جلوگیری می‌کند. آب بسیار داغ و شست‌وشوی بیش از نیاز، دوام رنگ را کم می‌کند." },
      { title: "حرارت را مدیریت کنید", body: "سشوار و اتوی داغ بدون محافظ حرارتی به ساقه آسیب می‌زنند. دمای کمتر و دفعات محدودتر، ظاهر مو را سالم‌تر نگه می‌دارد." },
    ],
  },
  "choose-right-salon": {
    intro: "انتخاب سالن فقط با دیدن چند تصویر شبکه اجتماعی تصمیم مطمئنی نیست. شفافیت قیمت، نظر رزرو واقعی و استاندارد بهداشت اهمیت بیشتری دارند.",
    sections: [
      { title: "نمونه‌کار مرتبط ببینید", body: "نمونه‌کاری را بررسی کنید که به جنس مو، پوست یا سبک درخواستی شما نزدیک باشد. تعداد زیاد تصویر نامرتبط معیار تخصص نیست." },
      { title: "قیمت و زمان را شفاف کنید", body: "قبل از رزرو درباره بازه قیمت، مواد مصرفی، مدت خدمت، بیعانه و شرایط تغییر قیمت سوال کنید." },
      { title: "نظرات را تحلیلی بخوانید", body: "به الگوهای تکرارشونده درباره تمیزی، وقت‌شناسی و رفتار پرسنل توجه کنید و فقط میانگین ستاره را نبینید." },
    ],
  },
  "skin-routine-basics": {
    intro: "یک روتین پایه باید ساده، پایدار و متناسب با وضعیت پوست باشد. افزودن هم‌زمان چند ماده فعال می‌تواند تشخیص علت حساسیت را دشوار کند.",
    sections: [
      { title: "پاکسازی ملایم", body: "پاک‌کننده‌ای انتخاب کنید که پس از شست‌وشو احساس کشیدگی شدید ایجاد نکند. دفعات شست‌وشو به نوع پوست و فعالیت روزانه وابسته است." },
      { title: "مرطوب‌کننده و ضدآفتاب", body: "حفظ رطوبت و محافظت روزانه در برابر آفتاب، پایه بسیاری از روتین‌هاست. مقدار و تمدید ضدآفتاب را مطابق دستور محصول و شرایط محیط تنظیم کنید." },
      { title: "مواد فعال را آهسته اضافه کنید", body: "هر محصول جدید را جداگانه و تدریجی وارد کنید. در صورت التهاب مداوم، بیماری پوستی یا درمان دارویی با پزشک مشورت کنید." },
    ],
  },
}

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }))
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = blogPosts.find((item) => item.slug === slug)
  const article = articleBodies[slug]
  if (!post || !article) notFound()

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-4xl px-4 pb-20 pt-28">
        <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-bold text-primary"><ArrowRight className="h-4 w-4" />بازگشت به مجله</Link>
        <article className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-sm md:p-10">
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="rounded-full bg-primary/10 px-3 py-1 font-bold text-primary">{post.category}</span>
            <span>{post.publishedAt}</span>
            <span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{post.readTime}</span>
          </div>
          <h1 className="mt-6 text-3xl font-black leading-tight text-foreground md:text-5xl">{post.title}</h1>
          <p className="mt-6 text-lg leading-9 text-muted-foreground">{article.intro}</p>
          <div className="my-8 h-px bg-border" />
          <div className="space-y-9">
            {article.sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-2xl font-black text-foreground">{section.title}</h2>
                <p className="mt-3 text-base leading-9 text-muted-foreground">{section.body}</p>
              </section>
            ))}
          </div>
          {slug === "skin-routine-basics" && (
            <div className="mt-9 flex items-start gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/5 p-4 text-sm leading-7 text-amber-800">
              <ShieldAlert className="mt-1 h-5 w-5 shrink-0" />این مطلب آموزشی است و جایگزین تشخیص یا درمان پزشکی نیست.
            </div>
          )}
        </article>
      </main>
      <Footer />
    </div>
  )
}
