"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import {
  CalendarCheck2,
  ChevronLeft,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

type CustomerAccount = {
  id: string
  mobileNormalized: string
  status: string
  identityStatus: string
  locale: string
  profile: {
    id: string
    firstName: string | null
    lastName: string | null
    birthDate: string | null
  } | null
}

type CustomerPanelShellProps = {
  account: CustomerAccount
  children: React.ReactNode
}

const navigation = [
  { href: "/dashboard", label: "نمای کلی", icon: LayoutDashboard },
  { href: "/dashboard/bookings", label: "نوبت‌های من", icon: CalendarCheck2 },
  { href: "/dashboard/recipients", label: "دریافت‌کنندگان خدمت", icon: UsersRound },
  { href: "/dashboard/account", label: "اطلاعات حساب", icon: UserRound },
  { href: "/dashboard/security", label: "امنیت و دستگاه‌ها", icon: ShieldCheck },
]

const identityLabels: Record<string, string> = {
  UNVERIFIED: "احراز هویت نشده",
  PENDING: "در انتظار احراز هویت",
  VERIFIED: "احراز هویت‌شده",
  REJECTED: "احراز هویت ردشده",
  UNAVAILABLE: "احراز هویت در دسترس نیست",
}

function initials(account: CustomerAccount) {
  const firstName = account.profile?.firstName?.trim() ?? ""
  const lastName = account.profile?.lastName?.trim() ?? ""
  return `${firstName.slice(0, 1)}${lastName.slice(0, 1)}` || "ک"
}

function displayName(account: CustomerAccount) {
  const value = [account.profile?.firstName, account.profile?.lastName].filter(Boolean).join(" ").trim()
  return value || "کاربر لوکس بیوتی"
}

function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  return (
    <nav aria-label="ناوبری پنل مشتری" className="space-y-2">
      {navigation.map((item) => {
        const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href)
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-2xl px-4 text-sm font-medium transition",
              active
                ? "bg-[#d6b27a] text-[#2b1b16] shadow-[0_12px_30px_rgba(214,178,122,0.18)]"
                : "text-[#ead9ca]/75 hover:bg-white/8 hover:text-white",
            )}
          >
            <Icon className="size-5" />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

export function CustomerPanelShell({ account, children }: CustomerPanelShellProps) {
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  async function logout() {
    setLoggingOut(true)
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      router.replace("/auth/login")
      router.refresh()
    } finally {
      setLoggingOut(false)
    }
  }

  const sidebarContent = (
    <div className="flex h-full flex-col p-5">
      <div className="flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-2xl border border-[#e4c38d]/30 bg-[#e4c38d]/10 font-black text-[#f0cf96]">
          {initials(account)}
        </div>
        <div className="min-w-0">
          <p className="truncate font-serif text-lg font-semibold text-[#fff6e7]">{displayName(account)}</p>
          <p dir="ltr" className="mt-0.5 text-right text-xs text-[#d5bfae]/65">{account.mobileNormalized}</p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.045] p-3">
        <p className="text-xs text-[#d7c0af]/70">وضعیت حساب</p>
        <Badge
          variant="outline"
          className={cn(
            "mt-3 rounded-full",
            account.identityStatus === "VERIFIED"
              ? "border-emerald-300/40 bg-emerald-500/10 text-emerald-100"
              : "border-amber-300/40 bg-amber-500/10 text-amber-100",
          )}
        >
          {identityLabels[account.identityStatus] ?? account.identityStatus}
        </Badge>
      </div>

      <div className="mt-6 flex-1">
        <Navigation onNavigate={() => setMobileOpen(false)} />
      </div>

      <div className="space-y-2 border-t border-white/10 pt-4">
        <Button asChild variant="ghost" className="w-full justify-start text-[#ead9ca]/75 hover:bg-white/8 hover:text-white">
          <Link href="/">
            <ExternalLink className="size-4" />
            مشاهده سایت
          </Link>
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={logout}
          disabled={loggingOut}
          className="w-full justify-start text-rose-200/80 hover:bg-rose-500/10 hover:text-rose-100"
        >
          <LogOut className="size-4" />
          {loggingOut ? "در حال خروج..." : "خروج امن"}
        </Button>
      </div>
    </div>
  )

  return (
    <div dir="rtl" className="min-h-screen bg-[#f7f2ec] text-[#2d201b]">
      <aside className="fixed inset-y-0 right-0 z-30 hidden w-[286px] overflow-y-auto border-l border-white/10 bg-[radial-gradient(circle_at_20%_0%,rgba(204,157,98,0.18),transparent_35%),#251713] lg:block">
        {sidebarContent}
      </aside>

      <div className="lg:pr-[286px]">
        <header className="sticky top-0 z-20 border-b border-[#4b3028]/10 bg-[#fbf8f4]/90 backdrop-blur-xl">
          <div className="flex min-h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="lg:hidden" aria-label="بازکردن منوی پنل">
                    <Menu className="size-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[310px] border-l-white/10 bg-[#251713] p-0 text-white sm:max-w-[340px]">
                  <SheetHeader className="sr-only">
                    <SheetTitle>منوی پنل مشتری</SheetTitle>
                    <SheetDescription>دسترسی به نوبت‌ها، دریافت‌کنندگان و امنیت حساب</SheetDescription>
                  </SheetHeader>
                  {sidebarContent}
                </SheetContent>
              </Sheet>
              <div>
                <div className="flex items-center gap-2 text-xs text-[#806b5f]">
                  <ShieldCheck className="size-4" />
                  پنل امن و داده‌محور
                </div>
                <h1 className="mt-1 text-base font-bold text-[#33231d] sm:text-lg">{displayName(account)}</h1>
              </div>
            </div>
            <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
              <Link href="/">
                بازگشت به سایت
                <ChevronLeft className="size-4" />
              </Link>
            </Button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  )
}
