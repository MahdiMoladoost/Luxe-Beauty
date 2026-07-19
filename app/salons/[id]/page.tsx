"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  BadgeCheck,
  CalendarCheck2,
  Check,
  Clock3,
  Heart,
  Images,
  Instagram,
  MapPin,
  Navigation,
  Phone,
  Share2,
  Sparkles,
  Star,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { calculateQuote, formatToman } from "@/lib/booking-engine"
import { getCompatibleStaff, getSalonById, getServicesForSalon, salons, staffMembers } from "@/lib/mock-data"

const reviews = [
  { id: "r1", user: "مریم ک.", date: "۳ روز پیش", rating: 5, service: "بالیاژ و رنگ تخصصی", staff: "نیلوفر احمدی", text: "مشاوره خیلی دقیق بود و رنگ نهایی با چیزی که قبل از شروع توافق کردیم کاملاً هماهنگ شد.", response: "از اعتماد شما ممنونیم. خوشحالیم که نتیجه را دوست داشتید." },
  { id: "r2", user: "سارا ر.", date: "۱ هفته پیش", rating: 5, service: "کاشت ناخن با ژلیش", staff: "سارا محمدی", text: "وقت‌شناسی و تمیزی عالی بود. قیمت هم همان مبلغی بود که در رزرو دیده بودم.", response: "ممنون از ثبت تجربه دقیق شما." },
  { id: "r3", user: "الهام ن.", date: "۲ هفته پیش", rating: 4, service: "فیشیال و آبرسانی", staff: "الهام رضایی", text: "کیفیت خوب بود، فقط شروع نوبت حدود ده دقیقه تاخیر داشت.", response: " بابت تاخیر عذرخواهی می‌کنیم و موضوع در برنامه‌ریزی شیفت اصلاح شد." },
]

const gallery = ["محیط سالن", "نمونه رنگ و لایت", "اتاق VIP", "خدمات ناخن", "میکاپ", "تیم سالن"]

export default function SalonDetailPage() {
  const params = useParams<{ id: string }>()
  const salon = getSalonById(params.id) ?? salons[0]
  const salonServices = getServicesForSalon(salon.id)
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([])
  const [selectedStaffId, setSelectedStaffId] = useState("any")
  const [liked, setLiked] = useState(false)
  const [galleryFilter, setGalleryFilter] = useState("همه")

  const compatibleStaff = useMemo(() => getCompatibleStaff(selectedServiceIds, salon.id), [selectedServiceIds, salon.id])
  const quote = useMemo(() => calculateQuote(selectedServiceIds, salon.id), [selectedServiceIds, salon.id])

  function toggleService(serviceId: string) {
    setSelectedServiceIds((current) => current.includes(serviceId) ? current.filter((id) => id !== serviceId) : [...current, serviceId])
    setSelectedStaffId("any")
  }

  const bookingParams = new URLSearchParams({ salon: salon.id })
  selectedServiceIds.forEach((id) => bookingParams.append("service", id))
  if (selectedStaffId !== "any") bookingParams.set("staff", selectedStaffId)

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pb-24 pt-20">
        <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/20 via-rose-500/10 to-background">
          <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8 lg:py-14">
            <div className="grid gap-7 lg:grid-cols-[1fr_340px] lg:items-end">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  {salon.verified && <Badge className="gap-1"><BadgeCheck className="h-3.5 w-3.5" />تایید شده توسط پلتفرم</Badge>}
                  <Badge variant={salon.isOpen ? "secondary" : "outline"}>{salon.isOpen ? `باز تا ${salon.closesAt}` : "در حال حاضر بسته"}</Badge>
                  {salon.tags.map((tag) => <Badge key={tag} variant="outline">{tag}</Badge>)}
                </div>
                <h1 className="mt-5 text-4xl font-black text-foreground md:text-5xl">{salon.name}</h1>
                <p className="mt-4 max-w-3xl text-base leading-8 text-muted-foreground">{salon.description}</p>
                <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Star className="h-5 w-5 fill-amber-400 text-amber-400" /><strong className="text-foreground">{salon.rating}</strong> از {salon.reviewCount.toLocaleString("fa-IR")} نظر</span>
                  <span className="flex items-center gap-1.5"><CalendarCheck2 className="h-5 w-5 text-primary" />{salon.successfulBookings.toLocaleString("fa-IR")} رزرو موفق</span>
                  <span className="flex items-center gap-1.5"><MapPin className="h-5 w-5 text-primary" />{salon.area}، {salon.city}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 lg:justify-end">
                <Button asChild><Link href={`/booking?salon=${salon.id}`}>رزرو نوبت</Link></Button>
                <Button variant="outline" asChild><a href={`tel:${salon.phone}`}><Phone className="ml-2 h-4 w-4" />تماس</a></Button>
                <Button variant="outline"><Navigation className="ml-2 h-4 w-4" />مسیریابی</Button>
                <Button variant="outline" size="icon" onClick={() => setLiked((value) => !value)} aria-label="افزودن به علاقه‌مندی"><Heart className={`h-5 w-5 ${liked ? "fill-rose-500 text-rose-500" : ""}`} /></Button>
                <Button variant="outline" size="icon" aria-label="اشتراک‌گذاری"><Share2 className="h-5 w-5" /></Button>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
          <div className="mb-8 overflow-hidden rounded-3xl border border-border bg-card p-4">
            <div className="mb-4 flex flex-wrap gap-2">
              {["همه", "محیط سالن", "نمونه‌کار", "پرسنل"].map((filter) => <button key={filter} type="button" onClick={() => setGalleryFilter(filter)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${galleryFilter === filter ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>{filter}</button>)}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
              {gallery.map((item, index) => <div key={item} className={`flex min-h-32 items-end rounded-2xl bg-gradient-to-br p-4 ${index % 3 === 0 ? "from-primary/25 to-secondary" : index % 3 === 1 ? "from-rose-500/20 to-secondary" : "from-amber-500/15 to-secondary"}`}><span className="rounded-lg bg-background/80 px-2 py-1 text-xs font-bold text-foreground backdrop-blur">{item}</span></div>)}
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_370px]">
            <div>
              <Tabs defaultValue="services">
                <TabsList className="grid h-auto w-full grid-cols-3 gap-1 lg:grid-cols-6">
                  <TabsTrigger value="services">خدمات</TabsTrigger>
                  <TabsTrigger value="staff">آرایشگران</TabsTrigger>
                  <TabsTrigger value="portfolio">نمونه‌کار</TabsTrigger>
                  <TabsTrigger value="reviews">نظرات</TabsTrigger>
                  <TabsTrigger value="info">اطلاعات</TabsTrigger>
                  <TabsTrigger value="rules">قوانین</TabsTrigger>
                </TabsList>

                <TabsContent value="services" className="mt-6 space-y-4">
                  {salonServices.map((service) => {
                    const selected = selectedServiceIds.includes(service.id)
                    const providers = staffMembers.filter((staff) => service.staffIds.includes(staff.id))
                    return (
                      <article key={service.id} className={`rounded-2xl border p-5 transition ${selected ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
                        <div className="flex flex-col justify-between gap-4 md:flex-row">
                          <div>
                            <div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-black text-foreground">{service.name}</h2>{service.discountPrice && <Badge variant="destructive">تخفیف</Badge>}{service.requiresConsultation && <Badge variant="outline">نیاز به مشاوره</Badge>}</div>
                            <p className="mt-2 text-sm leading-7 text-muted-foreground">{service.description}</p>
                            <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground"><span className="flex items-center gap-1"><Clock3 className="h-4 w-4" />{service.durationMinutes.toLocaleString("fa-IR")} دقیقه</span><span className="flex items-center gap-1"><Users className="h-4 w-4" />{providers.map((staff) => staff.fullName).join("، ")}</span></div>
                          </div>
                          <div className="shrink-0 text-left"><p className="text-xs text-muted-foreground">قیمت پایه</p>{service.discountPrice && <p className="text-xs text-muted-foreground line-through">{formatToman(service.price)}</p>}<p className="mt-1 font-black text-primary">{formatToman(service.discountPrice ?? service.price)}</p><p className="mt-1 text-xs text-muted-foreground">بیعانه {formatToman(service.depositAmount)}</p><Button className="mt-4 w-full" variant={selected ? "default" : "outline"} onClick={() => toggleService(service.id)}>{selected ? <><Check className="ml-1 h-4 w-4" />انتخاب شد</> : "انتخاب خدمت"}</Button></div>
                        </div>
                      </article>
                    )
                  })}
                </TabsContent>

                <TabsContent value="staff" className="mt-6 grid gap-4 md:grid-cols-2">
                  {(selectedServiceIds.length ? compatibleStaff : staffMembers.filter((staff) => staff.salonId === salon.id)).map((staff) => (
                    <article key={staff.id} className={`rounded-2xl border p-5 ${selectedStaffId === staff.id ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
                      <div className="flex items-center gap-3"><div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-xl font-black text-primary">{staff.fullName.slice(0, 1)}</div><div><h2 className="font-black text-foreground">{staff.fullName}</h2><p className="text-sm text-muted-foreground">{staff.title}</p></div></div>
                      <p className="mt-4 text-sm text-muted-foreground">{staff.specialties.join("، ")}</p>
                      <p className="mt-3 text-sm font-bold text-foreground"><Star className="ml-1 inline h-4 w-4 fill-amber-400 text-amber-400" />{staff.rating} · {staff.successfulBookings.toLocaleString("fa-IR")} رزرو</p>
                      <Button className="mt-4 w-full" variant={selectedStaffId === staff.id ? "default" : "outline"} onClick={() => setSelectedStaffId(staff.id)}>انتخاب آرایشگر</Button>
                    </article>
                  ))}
                </TabsContent>

                <TabsContent value="portfolio" className="mt-6">
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3">{gallery.slice(0, 6).map((item, index) => <div key={item} className="flex aspect-square items-end rounded-2xl bg-gradient-to-br from-primary/20 to-secondary p-4"><div><Images className="h-6 w-6 text-primary" /><p className="mt-2 text-sm font-bold text-foreground">{item}</p><p className="text-xs text-muted-foreground">نمونه‌کار شماره {(index + 1).toLocaleString("fa-IR")}</p></div></div>)}</div>
                </TabsContent>

                <TabsContent value="reviews" className="mt-6">
                  <div className="mb-5 grid gap-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-3"><div><p className="text-4xl font-black text-foreground">{salon.rating}</p><p className="mt-1 text-sm text-muted-foreground">امتیاز کلی</p></div><div><p className="font-bold text-foreground">کیفیت کار ۴.۹</p><p className="mt-2 text-sm text-muted-foreground">تمیزی سالن ۴.۸</p></div><div><p className="font-bold text-foreground">وقت‌شناسی ۴.۷</p><p className="mt-2 text-sm text-muted-foreground">ارزش نسبت به قیمت ۴.۸</p></div></div>
                  <div className="space-y-4">{reviews.map((review) => <article key={review.id} className="rounded-2xl border border-border bg-card p-5"><div className="flex items-start justify-between"><div><h3 className="font-black text-foreground">{review.user}</h3><p className="text-xs text-muted-foreground">{review.date} · {review.service} · {review.staff}</p></div><span className="flex items-center gap-1 font-bold text-foreground"><Star className="h-4 w-4 fill-amber-400 text-amber-400" />{review.rating}</span></div><p className="mt-4 text-sm leading-7 text-muted-foreground">{review.text}</p><div className="mt-4 rounded-xl bg-secondary p-3 text-sm leading-6 text-muted-foreground"><strong className="text-foreground">پاسخ سالن:</strong> {review.response}</div></article>)}</div>
                </TabsContent>

                <TabsContent value="info" className="mt-6 grid gap-5 md:grid-cols-2">
                  <InfoCard title="امکانات">{salon.amenities.map((item) => <Badge key={item} variant="secondary" className="ml-2 mt-2">{item}</Badge>)}</InfoCard>
                  <InfoCard title="ساعات کاری"><p>شنبه تا پنجشنبه: ۹:۰۰ تا {salon.closesAt}</p><p>جمعه: با رزرو قبلی</p></InfoCard>
                  <InfoCard title="آدرس و ارتباط"><p>{salon.address}</p><p className="mt-2" dir="ltr">{salon.phone}</p><p className="mt-2 flex items-center gap-1"><Instagram className="h-4 w-4" />@luxe_beauty</p></InfoCard>
                  <InfoCard title="مجوزها و استانداردها"><p>پروفایل تاییدشده پلتفرم، احراز مدیر، ثبت سوابق تغییر و امکان گزارش تخلف.</p></InfoCard>
                </TabsContent>

                <TabsContent value="rules" className="mt-6 space-y-4">
                  {["بیعانه هر خدمت در خلاصه رزرو نمایش داده می‌شود و قیمت در سرور نهایی خواهد شد.", "جابه‌جایی تا ۲۴ ساعت قبل، در صورت وجود ظرفیت، بدون جریمه انجام می‌شود.", "لغو دیرهنگام یا عدم حضور می‌تواند باعث کسر بیعانه شود.", "تاخیر بیش از ۱۵ دقیقه ممکن است زمان خدمت را کاهش دهد.", "خدمات مشاوره‌ای فقط پس از تایید قیمت نهایی مشتری آغاز می‌شوند."].map((rule, index) => <div key={rule} className="flex gap-3 rounded-2xl border border-border bg-card p-4"><div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-black text-primary">{(index + 1).toLocaleString("fa-IR")}</div><p className="text-sm leading-7 text-muted-foreground">{rule}</p></div>)}
                </TabsContent>
              </Tabs>
            </div>

            <aside className="h-fit rounded-3xl border border-border bg-card p-5 shadow-sm lg:sticky lg:top-24">
              <div className="flex items-center justify-between"><h2 className="text-xl font-black text-foreground">خلاصه رزرو</h2><Sparkles className="h-5 w-5 text-primary" /></div>
              {selectedServiceIds.length === 0 ? <div className="mt-5 rounded-2xl bg-secondary p-5 text-center text-sm leading-7 text-muted-foreground">برای شروع یک یا چند خدمت را انتخاب کنید.</div> : <div className="mt-5 space-y-3">{quote.lines.map((line) => <div key={line.serviceId} className="flex items-start justify-between gap-3 text-sm"><span className="text-muted-foreground">{line.serviceName}</span><span className="font-bold text-foreground">{formatToman(line.unitPrice)}</span></div>)}</div>}
              <div className="my-5 h-px bg-border" />
              <div className="space-y-3 text-sm"><SummaryRow label="آرایشگر" value={selectedStaffId === "any" ? "هر آرایشگر موجود" : compatibleStaff.find((staff) => staff.id === selectedStaffId)?.fullName ?? "انتخاب نشده"} /><SummaryRow label="مدت" value={`${quote.durationMinutes.toLocaleString("fa-IR")} دقیقه`} /><SummaryRow label="مبلغ کل" value={formatToman(quote.total)} strong /><SummaryRow label="بیعانه" value={formatToman(quote.deposit)} strong /></div>
              {selectedServiceIds.length > 1 && compatibleStaff.length === 0 && <div className="mt-4 rounded-xl bg-amber-500/10 p-3 text-xs leading-6 text-amber-800">این خدمات آرایشگر مشترک ندارند؛ ترکیب خدمات را تغییر دهید یا جداگانه رزرو کنید.</div>}
              <Button className="mt-6 w-full" size="lg" disabled={selectedServiceIds.length === 0 || compatibleStaff.length === 0} asChild={selectedServiceIds.length > 0 && compatibleStaff.length > 0}>
                {selectedServiceIds.length > 0 && compatibleStaff.length > 0 ? <Link href={`/booking?${bookingParams.toString()}`}>ادامه رزرو</Link> : <span>ابتدا خدمت را انتخاب کنید</span>}
              </Button>
              <p className="mt-3 text-center text-xs leading-5 text-muted-foreground">زمان آزاد و قیمت در مرحله بعد دوباره بررسی می‌شود.</p>
            </aside>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return <article className="rounded-2xl border border-border bg-card p-5"><h2 className="font-black text-foreground">{title}</h2><div className="mt-3 text-sm leading-7 text-muted-foreground">{children}</div></article>
}

function SummaryRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return <div className="flex items-start justify-between gap-4"><span className="text-muted-foreground">{label}</span><span className={strong ? "font-black text-foreground" : "font-bold text-foreground"}>{value}</span></div>
}
