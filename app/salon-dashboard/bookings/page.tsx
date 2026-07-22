import Link from "next/link"
import { CalendarCheck2, Store } from "lucide-react"

import { BookingManager } from "@/components/provider-panel/booking-manager"
import { Button } from "@/components/ui/button"
import { requirePrincipalFromServerCookies } from "@/lib/auth/session-cookie"
import { bookingStatuses } from "@/lib/domain/booking-state"
import { providerPanelBootstrap } from "@/lib/provider-panel/service"

export default async function ProviderBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ providerId?: string; status?: string; bookingId?: string }>
}) {
  const principal = await requirePrincipalFromServerCookies()
  const query = await searchParams
  const bootstrap = await providerPanelBootstrap(principal, query.providerId)
  const provider = bootstrap.selectedProvider

  if (!provider) {
    return (
      <section className="mx-auto flex min-h-[65vh] max-w-2xl items-center justify-center">
        <div className="w-full rounded-[30px] border border-[#5b4033]/10 bg-white p-9 text-center shadow-[0_24px_70px_rgba(65,42,31,0.08)]">
          <Store className="mx-auto size-12 text-[#7c5a45]" />
          <h2 className="mt-5 text-2xl font-black text-[#34231d]">مجموعه‌ای برای مدیریت نوبت وجود ندارد</h2>
          <p className="mt-3 text-sm leading-7 text-[#79685f]">ابتدا سالن یا فعالیت حرفه‌ای خود را ثبت کنید.</p>
          <Button asChild className="mt-6 bg-[#3a251e] text-white hover:bg-[#4a3027]">
            <Link href="/salon-register">ثبت مجموعه</Link>
          </Button>
        </div>
      </section>
    )
  }

  const initialStatus = query.status && bookingStatuses.includes(query.status as never) ? query.status : ""

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-[#5b4033]/10 bg-white p-5 shadow-[0_18px_55px_rgba(66,43,32,0.06)] sm:p-7">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#3a251e] text-[#e8c58d]">
            <CalendarCheck2 className="size-5" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-[#34231d]">مدیریت نوبت‌ها</h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[#79685f]">
              جست‌وجو، فیلتر، مشاهده جزئیات و تصمیم‌گیری درباره نوبت‌های واقعی {provider.nameFa}. تأیید یا رد هر نوبت مستقیماً در دیتابیس، تاریخچه، Audit و Outbox ثبت می‌شود.
            </p>
          </div>
        </div>
      </section>

      <BookingManager
        key={provider.id}
        providerId={provider.id}
        initialStatus={initialStatus}
        initialBookingId={query.bookingId}
      />
    </div>
  )
}
