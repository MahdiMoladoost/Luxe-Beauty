import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { ContentPage } from "@/components/layout/content-page"
import { serviceCategories, services } from "@/lib/mock-data"

export default function CategoriesPage() {
  return (
    <ContentPage
      eyebrow="دسته‌بندی خدمات"
      title="خدمت مناسب را سریع‌تر پیدا کنید"
      description="از دسته موردنظر شروع کنید و سپس بر اساس شهر، منطقه، قیمت، امتیاز و اولین زمان آزاد نتایج را محدود کنید."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {serviceCategories.map((category) => {
          const count = services.filter((service) => service.categoryId === category.id).length
          return (
            <Link key={category.id} href={`/salons?category=${category.slug}`} className="group rounded-3xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-md">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-2xl">{category.icon}</div>
              <h2 className="mt-4 text-lg font-black text-foreground">{category.name}</h2>
              <p className="mt-2 min-h-12 text-sm leading-6 text-muted-foreground">{category.description}</p>
              <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-sm">
                <span className="text-muted-foreground">{count.toLocaleString("fa-IR")} خدمت نمونه</span>
                <span className="flex items-center gap-1 font-bold text-primary">مشاهده سالن‌ها <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /></span>
              </div>
            </Link>
          )
        })}
      </div>
    </ContentPage>
  )
}
