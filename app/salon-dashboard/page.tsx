import Link from "next/link"
import {
  ArrowLeft,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  Scissors,
  Store,
  UserRoundCheck,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { requirePrincipalFromServerCookies } from "@/lib/auth/session-cookie"
import { providerDashboard, providerPanelBootstrap } from "@/lib/provider-panel/service"

const statusLabels: Record<string, string> = {
  HOLDING_SLOT: "در حال نگهداری زمان",
  AWAITING_PAYMENT: "در انتظار پرداخت",
  PAYMENT_PENDING: "پرداخت در حال بررسی",
  AWAITING_PROVIDER_APPROVAL: "در انتظار تأیید شما",
  CONFIRMED: "تأییدشده",
  REJECTED: "ردشده",
  EXPIRED: "منقضی‌شده",
  RESCHEDULE_PROPOSED: "پیشنهاد تغییر زمان",
  RESCHEDULED: "زمان جدید تأییدشده",
  CUSTOMER_CANCELLED: "لغو توسط مشتری",
  PROVIDER_CANCELLED: "لغو توسط ارائه‌دهنده",
  CHECKED_IN: "حضور ثبت‌شده",
  IN_SERVICE: "در حال انجام",
  COMPLETED_BY_PROVIDER: "تکمیل توسط ارائه‌دهنده",
  FINALIZED: "نهایی‌شده",
}

function statusClass(status: string) {
  if (status === "CONFIRMED" || status === "RESCHEDULED") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700"
  }
  if (status === "AWAITING_PROVIDER_APPROVAL") {
    return "border-amber-200 bg-amber-50 text-amber-700"
  }
  if (status.includes("CANCELLED") || status === "REJECTED" || status === "EXPIRED") {
    return "border-rose-200 bg-rose-50 text-rose-700"
  }
  return "border-stone-200 bg-stone-50 text-stone-700"
}

function formatToman(value: string) {
  try {
    return `${new Intl.NumberFormat("fa-IR").format(BigInt(value))} تومان`
  } catch {
    return `${value} تومان`
  }
}

function formatDateTime(value: Date | string) {
  return new Intl.DateTimeFormat("fa-IR", {
    timeZone: "Asia/Tehran",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

export default async function SalonDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ providerId?: string }>
}) {
  const principal = await requirePrincipalFromServerCookies()
  const query = await searchParams
  const bootstrap = await providerPanelBootstrap(principal, query.providerId)
  const provider = bootstrap.selectedProvider

  if (!provider) {
    return (
      <section className="mx-auto flex min-h-[68vh] max-w-2xl items-center justify-center">
        <div className="w-full rounded-[32px] border border-[#5b4033]/10 bg-white p-8 text-center shadow-[0_24px_70px_rgba(65,42,31,0.08)] sm:p-12">
          <div className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-[#3a251e] text-[#ebc98f]">
            <Store className="size-7" />
          </div>
          <h2 className="mt-6 text-2xl font-black text-[#34231d]">هنوز مجموعه‌ای ثبت نکرده‌اید</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-[#79685f]">
            برای دسترسی به مدیریت شعب، خدمات، متخصصان و نوبت‌ها ابتدا پرونده سالن یا فعالیت مستقل خود را ثبت کنید.
          </p>
          <Button asChild className="mt-7 bg-[#3a251e] text-[#fff7e9] hover:bg-[#4a3027]">
            <Link href="/salon-register">شروع ثبت مجموعه</Link>
          </Button>
        </div>
      </section>
    )
  }

  const data = await providerDashboard(principal, provider.id)
  const cards = [
    {
      label: "در انتظار تأیید شما",
      value: data.counts.pendingApprovals,
      hint: "نیازمند پاسخ سریع",
      icon: Clock3,
      href: `/salon-dashboard/bookings?providerId=${provider.id}&status=AWAITING_PROVIDER_APPROVAL`,
    },
    {
      label: "نوبت‌های امروز",
      value: data.counts.todayBookings,
      hint: "براساس ساعت تهران",
      icon: CalendarCheck2,
      href: `/salon-dashboard/bookings?providerId=${provider.id}`,
    },
    {
      label: "نوبت‌های قطعی آینده",
      value: data.counts.confirmedUpcoming,
      hint: "تأییدشده یا تغییرزمان‌یافته",
      icon: CheckCircle2,
      href: `/salon-dashboard/bookings?providerId=${provider.id}&status=CONFIRMED`,
    },
    {
      label: "خدمات منتشرشده",
      value: data.counts.publishedOfferings,
      hint: `از ${data.counts.offeringTotal.toLocaleString("fa-IR")} خدمت ثبت‌شده`,
      icon: Scissors,
      href: `/salon-dashboard/services?providerId=${provider.id}`,
    },
    {
      label: "شعب فعال",
      value: data.counts.activeBranches,
      hint: `از ${data.counts.branchTotal.toLocaleString("fa-IR")} شعبه`,
      icon: Store,
      href: `/salon-dashboard/branches?providerId=${provider.id}`,
    },
    {
      label: "متخصصان فعال",
      value: data.counts.activeProfessionals,
      hint: "همکاری تأییدشده",
      icon: UserRoundCheck,
      href: `/salon-dashboard/professionals?providerId=${provider.id}`,
    },
  ]

  return (
    <div className="space-y-7">
      <section className="overflow-hidden rounded-[30px] border border-[#5d4032]/10 bg-[radial-gradient(circle_at_90%_0%,rgba(213,174,113,0.22),transparent_35%),linear-gradient(135deg,#2a1a15,#4b3027)] p-6 text-white shadow-[0_24px_70px_rgba(53,32,24,0.16)] sm:p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <Badge variant="outline" className="border-[#e4c38d]/35 bg-[#e4c38d]/10 text-[#f4d7a6]">
              داده‌های زنده پنل
            </Badge>
            <h2 className="mt-4 text-2xl font-black sm:text-3xl">مدیریت {provider.nameFa}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#ead9ca]/75">
              این صفحه فقط داده‌های ثبت‌شده در دیتابیس را نمایش می‌دهد. آمار مالی تا تکمیل مسیر پرداخت و دفترکل نمایش داده نمی‌شود.
            </p>
          </div>
          <Button asChild className="bg-[#e0bd84] text-[#2b1a15] hover:bg-[#efd3a3]">
            <Link href={`/salon-dashboard/bookings?providerId=${provider.id}`}>
              مدیریت نوبت‌ها
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
        </div>
      </section>

      {provider.status !== "APPROVED" || !provider.bookingEnabled ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-900">
          رزرو آنلاین این مجموعه هنوز کاملاً فعال نیست. وضعیت پرونده: <strong>{provider.status}</strong>. مدیریت اطلاعات موجود است اما انتشار خدمت و دریافت نوبت تابع تأیید نهایی است.
        </section>
      ) : null}

      <section aria-labelledby="provider-statistics-title">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 id="provider-statistics-title" className="text-xl font-black text-[#34231d]">وضعیت عملیاتی</h2>
            <p className="mt-1 text-sm text-[#806e64]">بدون عدد یا درآمد نمایشی</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon
            return (
              <Link
                key={card.label}
                href={card.href}
                className="group rounded-[24px] border border-[#5b4033]/10 bg-white p-5 shadow-[0_14px_45px_rgba(66,43,32,0.055)] transition hover:-translate-y-1 hover:border-[#b98a55]/30 hover:shadow-[0_22px_55px_rgba(66,43,32,0.10)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[#79675d]">{card.label}</p>
                    <p className="mt-3 text-3xl font-black text-[#34231d]">{card.value.toLocaleString("fa-IR")}</p>
                    <p className="mt-2 text-xs text-[#9a887e]">{card.hint}</p>
                  </div>
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-[#3a251e] text-[#e5c38a] transition group-hover:scale-105">
                    <Icon className="size-5" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      <section className="rounded-[28px] border border-[#5b4033]/10 bg-white p-5 shadow-[0_18px_60px_rgba(66,43,32,0.06)] sm:p-6">
        <div className="flex flex-col justify-between gap-3 border-b border-[#5b4033]/10 pb-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-black text-[#34231d]">آخرین نوبت‌ها</h2>
            <p className="mt-1 text-sm text-[#806e64]">آخرین درخواست‌های ثبت‌شده برای این مجموعه</p>
          </div>
          <Button asChild variant="outline">
            <Link href={`/salon-dashboard/bookings?providerId=${provider.id}`}>مشاهده همه</Link>
          </Button>
        </div>

        {data.recentBookings.length === 0 ? (
          <div className="py-14 text-center">
            <CalendarCheck2 className="mx-auto size-10 text-[#b8a79c]" />
            <p className="mt-4 font-bold text-[#4d3930]">هنوز نوبتی ثبت نشده است</p>
            <p className="mt-2 text-sm text-[#8b796f]">پس از انتشار خدمات، نوبت‌های واقعی اینجا نمایش داده می‌شوند.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#5b4033]/10">
            {data.recentBookings.map((booking) => {
              const firstItem = booking.items[0]
              return (
                <div key={booking.id} className="flex flex-col gap-4 py-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#f2e8de] font-bold text-[#5a3c2f]">
                      {booking.recipient.firstName.slice(0, 1)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-bold text-[#392820]">
                        {booking.recipient.firstName} {booking.recipient.lastName}
                      </p>
                      <p className="mt-1 truncate text-sm text-[#7e6b61]">
                        {firstItem?.offering.titleFa ?? "خدمت نامشخص"}
                        {firstItem?.startsAt ? ` · ${formatDateTime(firstItem.startsAt)}` : ""}
                      </p>
                      <p className="mt-1 text-xs text-[#9b8980]">
                        {booking.branch?.nameFa ?? "بدون شعبه"} · {formatToman(booking.totalToman)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 lg:justify-end">
                    <Badge variant="outline" className={statusClass(booking.status)}>
                      {statusLabels[booking.status] ?? booking.status}
                    </Badge>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/salon-dashboard/bookings?providerId=${provider.id}&bookingId=${booking.id}`}>
                        جزئیات
                        <ArrowLeft className="size-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
