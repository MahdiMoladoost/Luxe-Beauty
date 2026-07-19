import Link from "next/link"
import { ArrowLeft, BookOpen, Clock3 } from "lucide-react"
import { ContentPage } from "@/components/layout/content-page"
import { blogPosts } from "@/lib/mock-data"

export default function BlogPage() {
  return (
    <ContentPage
      eyebrow="مجله زیبایی"
      title="راهنماهای کاربردی و قابل اجرا"
      description="محتوا برای انتخاب آگاهانه خدمت، مراقبت قبل و بعد از مراجعه و شناخت بهتر استانداردهای سالن تهیه می‌شود."
    >
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {blogPosts.map((post, index) => (
          <article key={post.slug} className="group overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
            <div className="flex h-44 items-center justify-center bg-gradient-to-br from-primary/15 to-secondary">
              <BookOpen className="h-12 w-12 text-primary transition-transform group-hover:scale-110" />
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="rounded-full bg-primary/10 px-2.5 py-1 font-semibold text-primary">{post.category}</span>
                <span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{post.readTime}</span>
              </div>
              <h2 className="mt-4 text-xl font-black leading-8 text-foreground">{post.title}</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{post.excerpt}</p>
              <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                <span className="text-xs text-muted-foreground">{post.publishedAt}</span>
                <Link href={`/blog/${post.slug}`} className="flex items-center gap-1 text-sm font-bold text-primary">مطالعه مقاله <ArrowLeft className="h-4 w-4" /></Link>
              </div>
            </div>
          </article>
        ))}
      </div>
      <div className="mt-10 rounded-3xl bg-secondary p-6 text-center">
        <h2 className="text-xl font-black text-foreground">موضوع موردنظر شما چیست؟</h2>
        <p className="mt-2 text-sm text-muted-foreground">تیم محتوا باید مقاله‌ها را با متخصصان حوزه و منابع معتبر بازبینی کند؛ توصیه پزشکی جایگزین تشخیص پزشک نیست.</p>
      </div>
    </ContentPage>
  )
}
