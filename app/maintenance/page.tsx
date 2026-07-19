import Link from "next/link"
import { Construction, Headphones } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function MaintenancePage() {
  return (
    <main dir="rtl" className="flex min-h-screen items-center justify-center bg-background px-4 py-16">
      <section className="w-full max-w-2xl rounded-3xl border border-border bg-card p-8 text-center shadow-sm md:p-12">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/10 text-amber-700"><Construction className="h-10 w-10" /></div>
        <p className="mt-6 text-sm font-black text-primary">به‌روزرسانی برنامه‌ریزی‌شده</p>
        <h1 className="mt-3 text-3xl font-black text-foreground">سامانه موقتاً در حال بهبود است</h1>
        <p className="mt-4 leading-8 text-muted-foreground">رزروهای تاییدشده محفوظ هستند. زمان بازگشت باید از سامانه وضعیت و بر اساس برآورد واقعی عملیات نمایش داده شود.</p>
        <div className="mx-auto mt-6 max-w-sm rounded-2xl bg-secondary p-4 text-sm text-muted-foreground"><strong className="text-foreground">وضعیت فعلی:</strong> تعمیرات برنامه‌ریزی‌شده<br /><strong className="text-foreground">آخرین به‌روزرسانی:</strong> همین حالا</div>
        <Button className="mt-7" variant="outline" asChild><Link href="/support"><Headphones className="ml-2 h-4 w-4" />ارتباط با پشتیبانی</Link></Button>
      </section>
    </main>
  )
}
