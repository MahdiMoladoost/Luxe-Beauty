"use client"

import { useState } from "react"
import Link from "next/link"
import { CalendarDays, CheckCircle2, Clock3, Images, LogOut, MessageSquare, Play, Star, UserRound, Wallet, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const appointments = [
  { id: "a1", time: "09:00", customer: "مریم احمدی", service: "بالیاژ و رنگ تخصصی", duration: 240, paid: true, note: "پوست سر حساس است", status: "upcoming" },
  { id: "a2", time: "14:00", customer: "نگار حسینی", service: "کوتاهی و براشینگ", duration: 60, paid: false, note: "مدل لیر متوسط", status: "upcoming" },
  { id: "a3", time: "15:30", customer: "سارا محمدی", service: "مشاوره رنگ", duration: 30, paid: true, note: "", status: "upcoming" },
]

const menu = [
  { label: "داشبورد", icon: UserRound },
  { label: "برنامه امروز", icon: Clock3 },
  { label: "تقویم من", icon: CalendarDays },
  { label: "نمونه‌کارها", icon: Images },
  { label: "درآمد و کمیسیون", icon: Wallet },
  { label: "پیام‌ها", icon: MessageSquare },
]

export default function StaffDashboardPage() {
  const [statuses, setStatuses] = useState<Record<string, string>>({})
  const [activeMenu, setActiveMenu] = useState("داشبورد")

  function updateStatus(id: string, status: string) {
    setStatuses((current) => ({ ...current, [id]: status }))
  }

  return (
    <div dir="rtl" className="min-h-screen bg-secondary/40 lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="border-b border-border bg-card p-4 lg:min-h-screen lg:border-b-0 lg:border-l">
        <Link href="/" className="flex items-center gap-3 px-2 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary font-black text-primary-foreground">ل</div>
          <div><p className="font-black text-foreground">لوکس بیوتی</p><p className="text-xs text-muted-foreground">پنل آرایشگر</p></div>
        </Link>
        <nav className="mt-5 grid gap-1 sm:grid-cols-3 lg:grid-cols-1">
          {menu.map((item) => (
            <button key={item.label} type="button" onClick={() => setActiveMenu(item.label)} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${activeMenu === item.label ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
              <item.icon className="h-5 w-5" />{item.label}
            </button>
          ))}
        </nav>
        <Button variant="ghost" className="mt-6 w-full justify-start text-muted-foreground" asChild><Link href="/"><LogOut className="ml-2 h-4 w-4" />خروج</Link></Button>
      </aside>

      <main className="p-4 md:p-7 lg:p-9">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div><p className="text-sm font-bold text-primary">یکشنبه، ۲۸ تیر ۱۴۰۵</p><h1 className="mt-1 text-3xl font-black text-foreground">سلام نیلوفر، روز خوبی داشته باشی</h1></div>
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"><div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 font-black text-primary">ن</div><div><p className="font-bold text-foreground">نیلوفر احمدی</p><p className="text-xs text-muted-foreground">متخصص رنگ و لایت</p></div></div>
        </div>

        <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {[
            { label: "نوبت بعدی", value: "۰۹:۰۰", icon: Clock3 },
            { label: "نوبت امروز", value: "۳", icon: CalendarDays },
            { label: "درآمد امروز", value: "۲.۸ م", icon: Wallet },
            { label: "کمیسیون قابل دریافت", value: "۷.۴ م", icon: CheckCircle2 },
            { label: "میانگین امتیاز", value: "۴.۹", icon: Star },
          ].map((stat) => <div key={stat.label} className="rounded-2xl border border-border bg-card p-4"><stat.icon className="h-5 w-5 text-primary" /><p className="mt-4 text-2xl font-black text-foreground">{stat.value}</p><p className="mt-1 text-xs text-muted-foreground">{stat.label}</p></div>)}
        </section>

        <section className="mt-7 rounded-3xl border border-border bg-card p-5 md:p-7">
          <div className="flex items-center justify-between"><div><h2 className="text-xl font-black text-foreground">برنامه امروز</h2><p className="mt-1 text-sm text-muted-foreground">وضعیت خدمت را همان لحظه به‌روزرسانی کنید.</p></div><Badge variant="secondary">۳ نوبت</Badge></div>
          <div className="mt-6 space-y-4">
            {appointments.map((appointment) => {
              const status = statuses[appointment.id] ?? appointment.status
              return (
                <article key={appointment.id} className="rounded-2xl border border-border p-4 md:flex md:items-center md:justify-between md:gap-5">
                  <div className="flex items-start gap-4">
                    <div className="rounded-xl bg-primary/10 px-3 py-2 text-center text-primary"><p className="font-black">{appointment.time}</p><p className="text-[10px]">{appointment.duration.toLocaleString("fa-IR")} دقیقه</p></div>
                    <div><h3 className="font-black text-foreground">{appointment.customer}</h3><p className="mt-1 text-sm text-muted-foreground">{appointment.service}</p>{appointment.note && <p className="mt-2 text-xs text-amber-700">یادداشت: {appointment.note}</p>}<div className="mt-2 flex gap-2"><Badge variant={appointment.paid ? "default" : "outline"}>{appointment.paid ? "بیعانه پرداخت شده" : "پرداخت در سالن"}</Badge>{status !== "upcoming" && <Badge variant="secondary">{status === "in_progress" ? "در حال انجام" : status === "completed" ? "تکمیل شده" : "عدم حضور"}</Badge>}</div></div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 md:mt-0">
                    <Button size="sm" disabled={status !== "upcoming"} onClick={() => updateStatus(appointment.id, "in_progress")}><Play className="ml-1 h-4 w-4" />شروع خدمت</Button>
                    <Button size="sm" variant="outline" disabled={status !== "in_progress"} onClick={() => updateStatus(appointment.id, "completed")}><CheckCircle2 className="ml-1 h-4 w-4" />اتمام</Button>
                    <Button size="sm" variant="ghost" disabled={status === "completed"} onClick={() => updateStatus(appointment.id, "no_show")}><XCircle className="ml-1 h-4 w-4" />عدم حضور</Button>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      </main>
    </div>
  )
}
