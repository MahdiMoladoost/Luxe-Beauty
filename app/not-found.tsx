import Link from "next/link"
import { SearchX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto flex min-h-[75vh] max-w-3xl flex-col items-center justify-center px-4 pb-16 pt-28 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-primary"><SearchX className="h-12 w-12" /></div>
        <p className="mt-6 text-sm font-black text-primary">خطای ۴۰۴</p>
        <h1 className="mt-3 text-4xl font-black text-foreground">صفحه موردنظر پیدا نشد</h1>
        <p className="mt-4 max-w-xl leading-8 text-muted-foreground">ممکن است آدرس تغییر کرده باشد یا صفحه حذف شده باشد. از جستجوی سالن‌ها یا صفحه اصلی ادامه دهید.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3"><Button asChild><Link href="/">صفحه اصلی</Link></Button><Button variant="outline" asChild><Link href="/salons">جستجوی سالن‌ها</Link></Button><Button variant="ghost" asChild><Link href="/support">تماس با پشتیبانی</Link></Button></div>
      </main>
      <Footer />
    </div>
  )
}
