import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        <section className="px-4 py-20">
          <div className="container mx-auto">
            <div className="text-center">
              <h1 className="text-4xl font-bold">تماس با ما</h1>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                سوال یا پیشنهادی دارید؟ با ما در تماس باشید
              </p>
            </div>

            <div className="mt-12 grid gap-8 lg:grid-cols-2">
              {/* Contact Form */}
              <div className="rounded-2xl border border-border bg-card p-8">
                <h2 className="text-xl font-semibold">ارسال پیام</h2>
                <form className="mt-6 space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">نام</label>
                      <Input placeholder="نام خود را وارد کنید" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">شماره تماس</label>
                      <Input placeholder="۰۹۱۲۳۴۵۶۷۸۹" dir="ltr" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">ایمیل</label>
                    <Input placeholder="email@example.com" dir="ltr" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">موضوع</label>
                    <Input placeholder="موضوع پیام" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">پیام</label>
                    <Textarea placeholder="پیام خود را بنویسید..." rows={5} />
                  </div>
                  <Button className="w-full">
                    <Send className="ml-2 h-4 w-4" />
                    ارسال پیام
                  </Button>
                </form>
              </div>

              {/* Contact Info */}
              <div className="space-y-6">
                <div className="rounded-2xl border border-border bg-card p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                      <MapPin className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold">آدرس</h3>
                      <p className="text-muted-foreground">تهران، خیابان ولیعصر، برج سالن یاب، طبقه ۱۲</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                      <Phone className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold">تلفن تماس</h3>
                      <p className="text-muted-foreground" dir="ltr">۰۲۱-۱۲۳۴۵۶۷۸</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                      <Mail className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold">ایمیل</h3>
                      <p className="text-muted-foreground">info@salonyab.ir</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                      <Clock className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold">ساعات پشتیبانی</h3>
                      <p className="text-muted-foreground">شنبه تا پنج‌شنبه: ۹ صبح تا ۶ عصر</p>
                    </div>
                  </div>
                </div>

                {/* Map Placeholder */}
                <div className="aspect-video overflow-hidden rounded-2xl border border-border bg-secondary">
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    نقشه موقعیت
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
