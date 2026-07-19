import Link from "next/link"
import { Clock3, Percent, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ContentPage } from "@/components/layout/content-page"
import { formatToman } from "@/lib/booking-engine"
import { offers, salons, services } from "@/lib/mock-data"

export default function OffersPage() {
  return (
    <ContentPage
      eyebrow="پیشنهادهای محدود"
      title="تخفیف خدمات زیبایی"
      description="پیشنهادها را بر اساس خدمت و سالن مقایسه کنید. قیمت تخفیف‌خورده در زمان ثبت رزرو دوباره در سرور کنترل می‌شود."
    >
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {offers.map((offer) => {
          const service = services.find((item) => item.id === offer.serviceId)
          const salon = salons.find((item) => item.id === offer.salonId)
          if (!service || !salon) return null
          return (
            <article key={offer.id} className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
              <div className="flex h-40 items-center justify-center bg-gradient-to-br from-primary/15 via-rose-500/10 to-background">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-card shadow-sm"><Percent className="h-9 w-9 text-primary" /></div>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-rose-500/10 px-3 py-1 text-xs font-bold text-rose-600">{offer.percent.toLocaleString("fa-IR")}٪ تخفیف</span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock3 className="h-3.5 w-3.5" />تا {offer.expiresAt}</span>
                </div>
                <h2 className="mt-4 text-lg font-black text-foreground">{offer.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{service.name} در {salon.name}</p>
                <div className="mt-4 flex items-end justify-between">
                  <div><p className="text-xs text-muted-foreground line-through">{formatToman(service.price)}</p><p className="mt-1 font-black text-primary">{formatToman(service.discountPrice ?? service.price)}</p></div>
                  <Sparkles className="h-5 w-5 text-amber-500" />
                </div>
                <Button className="mt-5 w-full" asChild><Link href={`/booking?salon=${salon.id}&service=${service.id}`}>رزرو با تخفیف</Link></Button>
              </div>
            </article>
          )
        })}
      </div>
    </ContentPage>
  )
}
