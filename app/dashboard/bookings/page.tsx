import { CalendarCheck2 } from "lucide-react"

import { CustomerBookingManager } from "@/components/customer-panel/customer-booking-manager"

export default async function CustomerBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string; status?: string; bookingId?: string }>
}) {
  const query = await searchParams
  const scope = ["all", "upcoming", "past"].includes(query.scope ?? "")
    ? (query.scope as "all" | "upcoming" | "past")
    : "all"

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-[#5b4033]/10 bg-white p-5 shadow-[0_18px_55px_rgba(66,43,32,0.06)] sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#3a251e] text-[#e8c58d]">
            <CalendarCheck2 className="size-5" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-[#34231d]">نوبت‌های من</h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[#806e64]">
              وضعیت، زمان، دریافت‌کننده، سالن، متخصص و پرداخت‌های ثبت‌شده را مشاهده کنید. تا زمانی که لغو و تغییر زمان به گردش تراکنشی کامل متصل نشده‌اند، دکمه نمایشی برای آن‌ها نشان داده نمی‌شود.
            </p>
          </div>
        </div>
      </section>

      <CustomerBookingManager
        initialScope={scope}
        initialStatus={query.status ?? ""}
        initialBookingId={query.bookingId}
      />
    </div>
  )
}
