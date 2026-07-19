"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, BarChart3, Check, CheckCircle2, Loader2, Upload, UsersRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { cities, serviceCategories } from "@/lib/mock-data"

const salonTypes = ["زنانه", "مردانه", "خانوادگی", "مرکز تخصصی پوست", "مجموعه اسپا"]

type Result = { ok: true; data: { application: { trackingCode: string } } } | { ok: false; error: { message: string; fields?: Record<string, string> } }

export default function SalonRegisterPage() {
  const [form, setForm] = useState({ salonName: "", ownerName: "", ownerMobile: "", city: "", area: "", address: "", salonType: "", staffCount: 1, instagram: "", description: "" })
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [documentName, setDocumentName] = useState("")
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [fields, setFields] = useState<Record<string, string>>({})
  const [trackingCode, setTrackingCode] = useState("")

  function toggleService(id: string) {
    setSelectedServices((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError("")
    setFields({})
    try {
      const response = await fetch("/api/salon-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, services: selectedServices, acceptedTerms, documentName }),
      })
      const result = (await response.json()) as Result
      if (!result.ok) {
        setFields(result.error.fields ?? {})
        throw new Error(result.error.message)
      }
      setTrackingCode(result.data.application.trackingCode)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ثبت درخواست ناموفق بود.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      <Header />
      <main className="mx-auto max-w-7xl px-4 pb-20 pt-28 lg:px-8">
        <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div>
            <p className="text-sm font-bold text-primary">همکاری با لوکس بیوتی</p>
            <h1 className="mt-3 text-4xl font-black text-foreground">سالن خود را ثبت و عملیات را هوشمند کنید</h1>
            <p className="mt-4 max-w-3xl leading-8 text-muted-foreground">مدیریت نوبت، پرسنل، مشتریان، مالی، نمونه‌کار و بازاریابی را از یک پنل انجام دهید. ثبت اولیه رایگان است و انتشار پروفایل پس از بررسی مدارک انجام می‌شود.</p>

            <section className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
              {trackingCode ? (
                <div className="py-14 text-center"><CheckCircle2 className="mx-auto h-16 w-16 text-emerald-600" /><h2 className="mt-5 text-2xl font-black text-foreground">درخواست سالن ثبت شد</h2><p className="mt-2 text-muted-foreground">پس از بررسی اولیه با مدیر سالن تماس گرفته می‌شود.</p><p dir="ltr" className="mx-auto mt-4 w-fit rounded-xl bg-secondary px-5 py-3 text-xl font-black text-primary">{trackingCode}</p><Button className="mt-6" asChild><Link href="/salon-dashboard">مشاهده نمونه پنل سالن</Link></Button></div>
              ) : (
                <form onSubmit={submit} className="space-y-8">
                  <div>
                    <h2 className="text-xl font-black text-foreground">اطلاعات سالن و مدیر</h2>
                    <div className="mt-5 grid gap-5 md:grid-cols-2">
                      <Field label="نام سالن" error={fields.salonName}><Input value={form.salonName} onChange={(event) => setForm({ ...form, salonName: event.target.value })} placeholder="مثال: سالن زیبایی لوکس" /></Field>
                      <Field label="نام مدیر" error={fields.ownerName}><Input value={form.ownerName} onChange={(event) => setForm({ ...form, ownerName: event.target.value })} /></Field>
                      <Field label="شماره موبایل مدیر" error={fields.ownerMobile}><Input dir="ltr" maxLength={11} className="text-left" value={form.ownerMobile} onChange={(event) => setForm({ ...form, ownerMobile: event.target.value })} placeholder="09123456789" /></Field>
                      <Field label="نوع سالن" error={fields.salonType}><select className="h-10 w-full rounded-md border border-input bg-background px-3" value={form.salonType} onChange={(event) => setForm({ ...form, salonType: event.target.value })}><option value="">انتخاب کنید</option>{salonTypes.map((type) => <option key={type}>{type}</option>)}</select></Field>
                      <Field label="شهر" error={fields.city}><select className="h-10 w-full rounded-md border border-input bg-background px-3" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })}><option value="">انتخاب شهر</option>{cities.map((city) => <option key={city.id} value={city.name}>{city.name}</option>)}</select></Field>
                      <Field label="منطقه"><Input value={form.area} onChange={(event) => setForm({ ...form, area: event.target.value })} /></Field>
                      <Field label="تعداد پرسنل" error={fields.staffCount}><Input type="number" min={1} value={form.staffCount} onChange={(event) => setForm({ ...form, staffCount: Math.max(1, Number(event.target.value)) })} /></Field>
                      <Field label="اینستاگرام سالن"><Input dir="ltr" className="text-left" placeholder="@username" value={form.instagram} onChange={(event) => setForm({ ...form, instagram: event.target.value })} /></Field>
                    </div>
                    <Field label="آدرس کامل" error={fields.address} className="mt-5"><Input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} /></Field>
                  </div>

                  <div className="border-t border-border pt-7">
                    <h2 className="text-xl font-black text-foreground">نوع خدمات</h2>
                    <p className="mt-2 text-sm text-muted-foreground">حداقل یک گروه خدمت انتخاب کنید.</p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">{serviceCategories.map((category) => { const selected = selectedServices.includes(category.id); return <button key={category.id} type="button" onClick={() => toggleService(category.id)} className={`flex items-center gap-3 rounded-xl border p-3 text-right ${selected ? "border-primary bg-primary/5" : "border-border"}`}><span className="text-xl">{category.icon}</span><span className="flex-1 text-sm font-bold text-foreground">{category.name}</span><span className={`flex h-5 w-5 items-center justify-center rounded-full border ${selected ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{selected && <Check className="h-3 w-3" />}</span></button> })}</div>
                    {fields.services && <p className="mt-2 text-xs text-destructive">{fields.services}</p>}
                  </div>

                  <div className="border-t border-border pt-7">
                    <h2 className="text-xl font-black text-foreground">معرفی و مدارک</h2>
                    <label className="mt-4 block text-sm font-medium text-foreground">توضیحات سالن<Textarea rows={5} className="mt-2" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="سابقه، مزیت‌ها و خدمات ویژه…" /></label>
                    <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground"><Upload className="h-5 w-5 text-primary" /><span>{documentName || "انتخاب مدرک یا تصویر، اختیاری — بارگذاری واقعی در محیط تولید باید به فضای ذخیره امن متصل شود"}</span><input type="file" className="hidden" onChange={(event) => setDocumentName(event.target.files?.[0]?.name ?? "")} /></label>
                  </div>

                  <label className="flex items-start gap-3 rounded-xl bg-secondary p-4"><input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} className="mt-1 h-4 w-4" /><span className="text-sm leading-7 text-muted-foreground">صحت اطلاعات را تایید می‌کنم و <Link href="/terms" className="font-bold text-primary">قوانین همکاری و حریم خصوصی</Link> را می‌پذیرم.</span></label>
                  {fields.acceptedTerms && <p className="text-xs text-destructive">{fields.acceptedTerms}</p>}
                  {error && <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
                  <Button type="submit" size="lg" className="w-full" disabled={loading}>{loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}ارسال درخواست بررسی<ArrowLeft className="mr-2 h-4 w-4" /></Button>
                </form>
              )}
            </section>
          </div>

          <aside className="space-y-4 lg:pt-28">
            {[
              { title: "مدیریت نوبت ۲۴ ساعته", description: "تقویم، رزرو دستی، ظرفیت پرسنل و جلوگیری از تداخل", icon: UsersRound },
              { title: "CRM و بازگشت مشتری", description: "سابقه خدمات، یادآوری، باشگاه مشتریان و کمپین", icon: CheckCircle2 },
              { title: "گزارش مالی و عملکرد", description: "درآمد، کمیسیون، تسویه و عملکرد هر خدمت و پرسنل", icon: BarChart3 },
            ].map((benefit) => <div key={benefit.title} className="rounded-2xl border border-border bg-card p-5"><benefit.icon className="h-6 w-6 text-primary" /><h2 className="mt-3 font-black text-foreground">{benefit.title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{benefit.description}</p></div>)}
            <div className="rounded-2xl bg-primary p-5 text-primary-foreground"><h2 className="font-black">قبل از انتشار چه بررسی می‌شود؟</h2><ul className="mt-3 space-y-2 text-sm leading-6 opacity-90"><li>• هویت مدیر و اطلاعات تماس</li><li>• آدرس و تصاویر واقعی سالن</li><li>• مدارک و مجوزهای لازم</li><li>• قوانین رزرو و اطلاعات مالی</li></ul></div>
          </aside>
        </section>
      </main>
      <Footer />
    </div>
  )
}

function Field({ label, error, className = "", children }: { label: string; error?: string; className?: string; children: React.ReactNode }) {
  return <label className={`block text-sm font-medium text-foreground ${className}`}>{label}<div className="mt-2">{children}</div>{error && <p className="mt-1 text-xs text-destructive">{error}</p>}</label>
}
