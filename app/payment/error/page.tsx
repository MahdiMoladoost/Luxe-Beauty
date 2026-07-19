import Link from "next/link"
import { CreditCard, RefreshCcw, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

export default function PaymentErrorPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-3xl px-4 pb-20 pt-28">
        <section className="rounded-3xl border border-border bg-card p-7 text-center shadow-sm md:p-10">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-rose-500/10 text-rose-600"><ShieldAlert className="h-10 w-10" /></div>
          <h1 className="mt-6 text-3xl font-black text-foreground">پرداخت کامل نشد</h1>
          <p className="mt-3 leading-8 text-muted-foreground">وجه موفق از حساب شما کسر نشده است. در صورت مشاهده کسر وجه، نتیجه تراکنش را با شماره پیگیری بانکی از پشتیبانی دنبال کنید.</p>
          <div className="mx-auto mt-6 max-w-md rounded-2xl bg-secondary p-5 text-right text-sm">
            <div className="flex justify-between gap-3"><span className="text-muted-foreground">وضعیت رزرو</span><strong className="text-foreground">در انتظار پرداخت</strong></div>
            <div className="mt-3 flex justify-between gap-3"><span className="text-muted-foreground">شماره پیگیری</span><strong dir="ltr" className="text-foreground">—</strong></div>
          </div>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Button asChild><Link href="/booking"><RefreshCcw className="ml-2 h-4 w-4" />تلاش مجدد پرداخت</Link></Button><Button variant="outline" asChild><Link href="/dashboard"><CreditCard className="ml-2 h-4 w-4" />نوبت‌های من</Link></Button><Button variant="ghost" asChild><Link href="/support">تماس با پشتیبانی</Link></Button></div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
