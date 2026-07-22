import Link from "next/link"
import {
  ArrowLeft,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  ShieldCheck,
  UserRoundCheck,
  UsersRound,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { requirePrincipalFromServerCookies } from "@/lib/auth/session-cookie"
import { customerDashboard } from "@/lib/customer-panel/service"

const statusLabels: Record<string, string> = {
  HOLDING_SLOT: "در حال نگهداری زمان",
  AWAITING_PAYMENT: "در انتظار پرداخت",
  PAYMENT_PENDING: "پرداخت در حال بررسی",
  AWAITING_PROVIDER_APPROVAL: "در انتظار تأیید سالن",
  CONFIRMED: "تأییدشده",
  REJECTED: "ردشده",
  EXPIRED: "منقضی‌شده",
  RESCHEDULE_PROPOSED: "پیشنهاد تغییر زمان",
  RESCHEDULED: "زمان جدید تأییدشده",
  CUSTOMER_CANCELLED: "لغوشده توسط شما",
  PROVIDER_CANCELLED: "لغوشده توسط سالن",
  CHECKED_IN: "حضور ثبت‌شده",
  IN_SERVICE: "در حال انجام",
  COMPLETED_BY_PROVIDER: "تکمیل‌شده",
  AWAITING_CUSTOMER_DISPUTE_WINDOW: "در انتظار تأیید نهایی",
  FINALIZED: "نهایی‌شده",
  CUSTOMER_NO_SHOW: "عدم حضور مشتری",
  PROVIDER_NO_SHOW: "عدم حضور ارائه‌دهنده",
  DISPUTED: "در حال بررسی اختلاف",
  REFUNDED: "بازپرداخت‌شده",
  PARTIALLY_REFUNDED: "بازپرداخت جزئی",
}

function statusClass(status: string) {
  if (["CONFIRMED", "RESCHEDULED", "FINALIZED"].includes(status)) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700"
  }
  if (["AWAITING_PROVIDER_APPROVAL", "AWAITING_PAYMENT", "PAYMENT_PENDING"].includes(status)) {
    return "border-amber-200 bg-amber-50 text-amber-700"
  }
  if (["REJECTED", "EXPIRED", "CUSTOMER_CANCELLED", "PROVIDER_CANCELLED"].includes(status)) {
    return "border-rose-200 bg-rose-50 text-rose-700"
  }
  return "border-stone-200 bg-stone-50 text-stone-700"
}

function formatToman(value: string) {
  return `${new Intl.NumberFormat("fa-IR").format(Number(value))} تومان`
}

function formatDateTime(value: Date | string) {
  return new Intl.DateTimeFormat("fa-IR", {
    timeZone: "Asia/Tehran",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

export default async function CustomerDashboardPage() {
  const principal = await requirePrincipalFromServerCookies()
  const data = await customerDashboard(principal)
  const accountName = [data.account.profile?.firstName, data.account.profile?.lastName]
    .filter(Boolean)
    .join(" ") || "کاربر لوکس بیوتی"

  const cards = [
    {
      label: "نوبت‌های آینده",
      value: data.counts.upcoming,
      hint: "زمان‌هایی که هنوز پیش رو هستند",
      icon: CalendarCheck2,
      href: "/dashboard/bookings?scope=upcoming",
    },
    {
      label: "در انتظار تأیید سالن",
      value: data.counts.awaitingProvider,
      hint: "درخواست‌هایی که پاسخ سالن را می‌خواهند",
      icon: Clock3,
      href: "/dashboard/bookings?scope=upcoming&status=AWAITING_PROVIDER_APPROVAL",
    },
    {
      label: "نوبت‌های نهایی‌شده",
      value: data.counts.finalized,
      hint: "خدمات تکمیل یا نهایی‌شده",
      icon: CheckCircle2,
      href: "/dashboard/bookings?scope=past",
    },
    {
      label: "دریافت‌کنندگان خدمت",
      value: data.counts.recipientTotal,
      hint: "افرادی که برایشان رزرو می‌کنید",
      icon: UsersRound,
      href: "/dashboard/recipients",
    },
    {
      label: "کل نوبت‌ها",
      value: data.counts.bookingTotal,
      hint: "تمام سوابق واقعی حساب",
      icon: UserRoundCheck,
      href: "/dashboard/bookings?scope=all",
    },
  ]

  return (
    <div className="space-y-7">
      <section className="overflow-hidden rounded-[30px] border border-[#5d4032]/10 bg-[radial-gradient(circle_at_90%_0%,rgba(213,174,113,0.22),transparent_35%),linear-gradient(135deg,#2a1a15,#4b3027)] p-6 text-white shadow-[0_24px_70px_rgba(53,32,24,0.16)] sm:p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <Badge variant="outline" className="border-[#e4c38d]/35 bg-[#e4c38d]/10 text-[#f4d7a6]">
              اطلاعات واقعی حساب
            </Badge>
            <h2 className="mt-4 text-2xl font-black sm:text-3xl">سلام {accountName}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#ead9ca]/75">
              نوبت‌ها، دریافت‌کنندگان و امنیت حساب از همین پنل مدیریت می‌شوند. بخش‌های پرداخت، نظر و علاقه‌مندی تا اتصال کامل به داده واقعی نمایش داده نمی‌شوند.
            </p>
          </div>
          <Button asChild className="bg-[#e0bd84] text-[#2b1a15] hover:bg-[#efd3a3]">
            <Link href="/dashboard/bookings?scope=upcoming">
              مشاهده نوبت‌های آینده
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
        </div>
      </section>

      {data.account.identityStatus !== "VERIFIED" ? (
        <section className="flex flex-col justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-900 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-1 size-5 shrink-0" />
            <div>
              <p className="font-bold">احراز هویت حساب کامل نیست</p>
              <p>برای ثبت نوبت جدید، وضعیت هویت باید تأییدشده باشد. نوبت‌ها و اطلاعات فعلی همچنان قابل مشاهده‌اند.</p>
            </div>
          </div>
          <Button asChild variant="outline" className="border-amber-300 bg-white">
            <Link href="/dashboard/account">بررسی حساب</Link>
          </Button>
        </section>
      ) : null}

      <section aria-labelledby="customer-statistics-title">
        <div className="mb-4">
          <h2 id="customer-statistics-title" className="text-xl font-black text-[#34231d]">وضعیت حساب</h2>
          <p className="mt-1 text-sm text-[#806e64]">بدون امتیاز، تخفیف یا عدد ساختگی</p>
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
            <p className="mt-1 text-sm text-[#806e64]">آخرین درخواست‌های ثبت‌شده در حساب شما</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/dashboard/bookings?scope=all">مشاهده همه</Link>
          </Button>
        </div>

        {data.recentBookings.length === 0 ? (
          <div className="py-14 text-center">
            <CalendarCheck2 className="mx-auto size-10 text-[#b8a79c]" />
            <p className="mt-4 font-bold text-[#4d3930]">هنوز نوبتی ثبت نشده است</p>
            <p className="mt-2 text-sm text-[#8b796f]">پس از رزرو خدمت، وضعیت واقعی آن اینجا نمایش داده می‌شود.</p>
            <Button asChild className="mt-5 bg-[#3a251e] text-white hover:bg-[#4a3027]">
              <Link href="/search">جست‌وجوی خدمات</Link>
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-[#5b4033]/10">
            {data.recentBookings.map((booking) => {
              const firstItem = booking.items[0]
              return (
                <div key={booking.id} className="flex flex-col gap-4 py-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#f2e8de] font-bold text-[#5a3c2f]">
                      {booking.provider.nameFa.slice(0, 1)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-bold text-[#392820]">{booking.provider.nameFa}</p>
                      <p className="mt-1 truncate text-sm text-[#7e6b61]">
                        {firstItem?.offering.titleFa ?? "خدمت نامشخص"}
                        {firstItem?.startsAt ? ` · ${formatDateTime(firstItem.startsAt)}` : ""}
                      </p>
                      <p className="mt-1 text-xs text-[#9b8980]">
                        برای {booking.recipient.firstName} {booking.recipient.lastName} · {formatToman(booking.totalToman)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 lg:justify-end">
                    <Badge variant="outline" className={statusClass(booking.status)}>
                      {statusLabels[booking.status] ?? booking.status}
                    </Badge>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/dashboard/bookings?scope=all&bookingId=${booking.id}`}>
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
