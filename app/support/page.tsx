"use client"

import { useState } from "react"
import { CheckCircle2, Headphones, Loader2, MessageSquare, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

const requestTypes = ["پشتیبانی مشتری", "همکاری سالن", "مشکل پرداخت", "گزارش تخلف", "پیشنهاد و انتقاد", "امنیت و حریم خصوصی"]

type ApiResult = { ok: true; data: { ticket: { trackingCode: string } } } | { ok: false; error: { message: string } }

export default function SupportPage() {
  const [form, setForm] = useState({ requesterName: "", mobile: "", type: requestTypes[0], subject: "", message: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [trackingCode, setTrackingCode] = useState("")

  async function submit() {
    setLoading(true)
    setError("")
    try {
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const result = (await response.json()) as ApiResult
      if (!result.ok) throw new Error(result.error.message)
      setTrackingCode(result.data.ticket.trackingCode)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ثبت درخواست ناموفق بود.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-6xl px-4 pb-20 pt-28 lg:px-8">
        <div className="text-center"><p className="text-sm font-bold text-primary">مرکز پشتیبانی</p><h1 className="mt-3 text-4xl font-black text-foreground">مسئله را دقیق ثبت کنید؛ قابل پیگیری پاسخ می‌دهیم</h1><p className="mx-auto mt-4 max-w-2xl leading-8 text-muted-foreground">برای مشکلات پرداخت، رزرو نزدیک، گزارش تخلف و امنیت اولویت بالاتر به‌صورت خودکار اعمال می‌شود.</p></div>

        <div className="mt-10 grid gap-7 lg:grid-cols-[360px_1fr]">
          <aside className="space-y-4">
            {[
              { title: "پشتیبانی رزرو", description: "پیگیری تایید، لغو، جابه‌جایی و عدم حضور", icon: Headphones },
              { title: "اختلاف پرداخت", description: "بررسی تراکنش، بیعانه و بازگشت وجه", icon: ShieldAlert },
              { title: "همکاری سالن", description: "ثبت، تایید مدارک و آموزش پنل", icon: MessageSquare },
            ].map((item) => <div key={item.title} className="rounded-2xl border border-border bg-card p-5"><item.icon className="h-6 w-6 text-primary" /><h2 className="mt-3 font-black text-foreground">{item.title}</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p></div>)}
            <div className="rounded-2xl bg-secondary p-5 text-sm leading-7 text-muted-foreground"><strong className="text-foreground">ساعات پاسخگویی:</strong><br />شنبه تا پنجشنبه، ۹ تا ۲۱<br />درخواست‌های امنیتی و پرداختی بحرانی خارج از صف عادی بررسی می‌شوند.</div>
          </aside>

          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
            {trackingCode ? (
              <div className="py-12 text-center"><CheckCircle2 className="mx-auto h-16 w-16 text-emerald-600" /><h2 className="mt-5 text-2xl font-black text-foreground">درخواست ثبت شد</h2><p className="mt-2 text-muted-foreground">کد پیگیری را نگه دارید:</p><p dir="ltr" className="mx-auto mt-4 w-fit rounded-xl bg-secondary px-5 py-3 text-xl font-black text-primary">{trackingCode}</p><Button className="mt-6" variant="outline" onClick={() => { setTrackingCode(""); setForm({ requesterName: "", mobile: "", type: requestTypes[0], subject: "", message: "" }) }}>ثبت درخواست جدید</Button></div>
            ) : (
              <>
                <h2 className="text-2xl font-black text-foreground">فرم درخواست</h2>
                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  <label className="text-sm font-medium text-foreground">نام و نام خانوادگی<Input className="mt-2" value={form.requesterName} onChange={(event) => setForm({ ...form, requesterName: event.target.value })} /></label>
                  <label className="text-sm font-medium text-foreground">شماره موبایل<Input dir="ltr" className="mt-2 text-left" maxLength={11} placeholder="09123456789" value={form.mobile} onChange={(event) => setForm({ ...form, mobile: event.target.value })} /></label>
                  <label className="text-sm font-medium text-foreground">نوع درخواست<select className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>{requestTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
                  <label className="text-sm font-medium text-foreground">موضوع<Input className="mt-2" value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} /></label>
                </div>
                <label className="mt-5 block text-sm font-medium text-foreground">شرح کامل<textarea className="mt-2 min-h-40 w-full rounded-xl border border-input bg-background p-3" placeholder="زمان، کد رزرو یا پرداخت و آنچه انتظار دارید را دقیق بنویسید…" value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} /></label>
                {error && <div className="mt-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
                <Button className="mt-6 w-full" size="lg" disabled={loading} onClick={submit}>{loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}ارسال درخواست</Button>
              </>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
