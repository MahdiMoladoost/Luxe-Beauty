import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Upload, Check } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

const cities = [
  "تهران", "اصفهان", "شیراز", "مشهد", "تبریز", "کرج", "اهواز", "قم"
]

export default function SalonRegisterPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1 bg-secondary/20">
        <section className="px-4 py-12">
          <div className="container mx-auto max-w-3xl">
            <div className="text-center">
              <h1 className="text-3xl font-bold">ثبت آرایشگاه در سالن یاب</h1>
              <p className="mt-2 text-muted-foreground">
                آرایشگاه خود را ثبت کنید و به هزاران مشتری جدید دسترسی پیدا کنید
              </p>
            </div>

            <div className="mt-8 rounded-2xl border border-border bg-card p-8">
              <form className="space-y-8">
                {/* Basic Info */}
                <div>
                  <h2 className="text-lg font-semibold">اطلاعات پایه</h2>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">نام آرایشگاه *</label>
                      <Input placeholder="مثال: سالن زیبایی گلریز" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">نوع سالن *</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="انتخاب کنید" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="female">زنانه</SelectItem>
                          <SelectItem value="male">مردانه</SelectItem>
                          <SelectItem value="unisex">یونیسکس</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">شهر *</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="انتخاب شهر" />
                        </SelectTrigger>
                        <SelectContent>
                          {cities.map(city => (
                            <SelectItem key={city} value={city}>{city}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">منطقه</label>
                      <Input placeholder="مثال: ولیعصر" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium">آدرس کامل *</label>
                      <Input placeholder="آدرس دقیق سالن را وارد کنید" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">شماره تماس *</label>
                      <Input placeholder="۰۲۱-۱۲۳۴۵۶۷۸" dir="ltr" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">اینستاگرام</label>
                      <Input placeholder="@username" dir="ltr" />
                    </div>
                  </div>
                </div>

                {/* Owner Info */}
                <div className="border-t border-border pt-8">
                  <h2 className="text-lg font-semibold">اطلاعات مالک</h2>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">نام و نام خانوادگی *</label>
                      <Input placeholder="نام کامل مالک سالن" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">شماره موبایل *</label>
                      <Input placeholder="۰۹۱۲۳۴۵۶۷۸۹" dir="ltr" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">ایمیل</label>
                      <Input placeholder="email@example.com" dir="ltr" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">کد ملی *</label>
                      <Input placeholder="۰۰۱۲۳۴۵۶۷۸" dir="ltr" />
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="border-t border-border pt-8">
                  <h2 className="text-lg font-semibold">معرفی سالن</h2>
                  <div className="mt-4 space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">توضیحات سالن</label>
                      <Textarea 
                        placeholder="درباره سالن، سابقه کار و خدمات ویژه خود بنویسید..."
                        rows={4}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">آپلود تصاویر سالن</label>
                      <div className="flex flex-wrap gap-4">
                        <div className="flex h-32 w-32 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-border transition-colors hover:border-accent">
                          <div className="text-center">
                            <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                            <span className="mt-1 text-xs text-muted-foreground">آپلود</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">حداقل ۳ تصویر از فضای سالن</p>
                    </div>
                  </div>
                </div>

                {/* Services */}
                <div className="border-t border-border pt-8">
                  <h2 className="text-lg font-semibold">خدمات ارائه شده</h2>
                  <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
                    {["کوتاهی مو", "رنگ و هایلایت", "کراتین", "مانیکور و پدیکور", "آرایش عروس", "اصلاح صورت", "مراقبت پوست", "اکستنشن مژه", "تاتو ابرو"].map(service => (
                      <label key={service} className="flex items-center gap-2">
                        <Checkbox />
                        <span className="text-sm">{service}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Terms */}
                <div className="border-t border-border pt-8">
                  <div className="flex items-start gap-2">
                    <Checkbox id="terms" className="mt-1" />
                    <label htmlFor="terms" className="text-sm leading-relaxed text-muted-foreground">
                      با{" "}
                      <Link href="/terms" className="text-accent hover:underline">
                        قوانین و مقررات
                      </Link>
                      {" "}سالن یاب برای صاحبان آرایشگاه موافقم و تایید می‌کنم که اطلاعات وارد شده صحیح است.
                    </label>
                  </div>
                </div>

                <Button size="lg" className="w-full">
                  ثبت درخواست
                  <ArrowLeft className="mr-2 h-4 w-4" />
                </Button>
              </form>
            </div>

            {/* Benefits */}
            <div className="mt-12 rounded-2xl border border-border bg-card p-8">
              <h2 className="text-xl font-semibold">چرا در سالن یاب ثبت کنید؟</h2>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {[
                  "دسترسی به هزاران مشتری جدید",
                  "سیستم نوبت‌دهی آنلاین ۲۴ ساعته",
                  "نمایش نمونه‌کارها و پورتفولیو",
                  "گزارش‌های آماری و مالی",
                  "پشتیبانی اختصاصی",
                  "افزایش اعتبار با نظرات مشتریان",
                ].map(benefit => (
                  <div key={benefit} className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
