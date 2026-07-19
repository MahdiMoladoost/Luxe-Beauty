"use client"

import { useState } from "react"
import Link from "next/link"
import { CheckCircle2, Clock3, Loader2, Mail, MapPin, Paperclip, Phone, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

const types = ["پشتیبانی مشتری", "همکاری سالن", "مشکل پرداخت", "گزارش تخلف", "پیشنهاد و انتقاد", "امنیت و حریم خصوصی"]

type Result = { ok: true; data: { ticket: { trackingCode: string } } } | { ok: false; error: { message: string } }

export default function ContactPage() {
  const [form, setForm] = useState({ requesterName: "", mobile: "", email: "", type: types[0], subject: "", message: "" })
  const [attachmentName, setAttachmentName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [trackingCode, setTrackingCode] = useState("")

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError("")
    try {
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, message: `${form.message}${form.email ? `\nایمیل: ${form.email}` : ""}${attachmentName ? `\nفایل پیوست انتخاب‌شده: ${attachmentName}` : ""}` }),
      })
      const result = (await response.json()) as Result
      if (!result.ok) throw new Error(result.error.message)
      setTrackingCode(result.data.ticket.trackingCode)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ارسال پیام ناموفق بود.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-4 pb-20 pt-28 lg:px-8">
        <div className="text-center"><p className="text-sm font-bold text-primary">تماس با لوکس بیوتی</p><h1 className="mt-3 text-4xl font-black text-foreground">درخواست خود را قابل پیگیری ثبت کنید</h1><p className="mx-auto mt-4 max-w-2xl leading-8 text-muted-foreground">برای رسیدگی سریع‌تر، نوع درخواست، کد رزرو یا تراکنش و نتیجه مورد انتظار را دقیق بنویسید.</p></div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
            {trackingCode ? (
              <div className="py-14 text-center"><CheckCircle2 className="mx-auto h-16 w-16 text-emerald-600" /><h2 className="mt-5 text-2xl font-black text-foreground">پیام شما ثبت شد</h2><p className="mt-2 text-muted-foreground">کد پیگیری:</p><p dir="ltr" className="mx-auto mt-4 w-fit rounded-xl bg-secondary px-5 py-3 text-xl font-black text-primary">{trackingCode}</p><div className="mt-6 flex justify-center gap-3"><Button variant="outline" onClick={() => { setTrackingCode(""); setForm({ requesterName: "", mobile: "", email: "", type: types[0], subject: "", message: "" }); setAttachmentName("") }}>پیام جدید</Button><Button asChild><Link href="/support">مرکز پشتیبانی</Link></Button></div></div>
            ) : (
              <form onSubmit={submit}>
                <h2 className="text-2xl font-black text-foreground">فرم تماس</h2>
                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  <label className="text-sm font-medium text-foreground">نام و نام خانوادگی<Input className="mt-2" value={form.requesterName} onChange={(event) => setForm({ ...form, requesterName: event.target.value })} /></label>
                  <label className="text-sm font-medium text-foreground">شماره موبایل<Input dir="ltr" maxLength={11} placeholder="09123456789" className="mt-2 text-left" value={form.mobile} onChange={(event) => setForm({ ...form, mobile: event.target.value })} /></label>
                  <label className="text-sm font-medium text-foreground">ایمیل، اختیاری<Input dir="ltr" type="email" placeholder="name@example.com" className="mt-2 text-left" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
                  <label className="text-sm font-medium text-foreground">نوع درخواست<select className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>{types.map((type) => <option key={type}>{type}</option>)}</select></label>
                </div>
                <label className="mt-5 block text-sm font-medium text-foreground">موضوع<Input className="mt-2" value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} /></label>
                <label className="mt-5 block text-sm font-medium text-foreground">متن پیام<Textarea rows={7} className="mt-2" value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} placeholder="شرح کامل مسئله…" /></label>
                <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground hover:border-primary/50"><Paperclip className="h-5 w-5 text-primary" /><span>{attachmentName || "انتخاب فایل، اختیاری — در نسخه تولید باید روی فضای ذخیره امن بارگذاری شود"}</span><input type="file" className="hidden" onChange={(event) => setAttachmentName(event.target.files?.[0]?.name ?? "")} /></label>
                {error && <div className="mt-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
                <Button type="submit" className="mt-6 w-full" size="lg" disabled={loading}>{loading ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Send className="ml-2 h-4 w-4" />}ارسال پیام</Button>
              </form>
            )}
          </section>

          <aside className="space-y-4">
            {[
              { label: "شماره پشتیبانی", value: "021-91000000", icon: Phone, dir: "ltr" },
              { label: "ایمیل", value: "support@luxebeauty.ir", icon: Mail, dir: "ltr" },
              { label: "آدرس دفتر", value: "تهران، دفتر مرکزی لوکس بیوتی", icon: MapPin },
              { label: "ساعات پاسخگویی", value: "شنبه تا پنجشنبه، ۹ تا ۲۱", icon: Clock3 },
            ].map((item) => <div key={item.label} className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><item.icon className="h-5 w-5" /></div><div><p className="font-black text-foreground">{item.label}</p><p className="mt-1 text-sm text-muted-foreground" dir={item.dir}>{item.value}</p></div></div>)}
            <div className="flex aspect-video items-center justify-center rounded-2xl border border-border bg-gradient-to-br from-primary/10 to-secondary text-sm text-muted-foreground"><MapPin className="ml-2 h-5 w-5 text-primary" />جایگاه نقشه؛ اتصال تولیدی نیازمند سرویس نقشه و کلید محیطی است.</div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  )
}
