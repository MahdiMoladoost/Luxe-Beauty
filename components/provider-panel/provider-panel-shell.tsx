"use client"

import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import {
  CalendarCheck2,
  ChevronLeft,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  Store,
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

type ProviderSummary = {
  id: string
  nameFa: string
  slug: string
  type: string
  status: string
  bookingEnabled: boolean
  verificationAt: string | Date | null
  version: number
  updatedAt: string | Date
}

type ProviderPanelShellProps = {
  providers: ProviderSummary[]
  children: React.ReactNode
}

const navigation = [
  { href: "/salon-dashboard", label: "نمای کلی", icon: LayoutDashboard },
  { href: "/salon-dashboard/bookings", label: "نوبت‌ها", icon: CalendarCheck2 },
]

const statusLabels: Record<string, string> = {
  DRAFT: "پیش‌نویس",
  PENDING_REVIEW: "در انتظار بررسی",
  NEEDS_CORRECTION: "نیازمند اصلاح",
  APPROVED: "تأییدشده",
  REJECTED: "ردشده",
  SUSPENDED: "تعلیق‌شده",
}

function providerStatus(provider: ProviderSummary) {
  if (provider.status === "APPROVED" && provider.bookingEnabled) {
    return { label: "فعال برای رزرو", className: "border-emerald-300/40 bg-emerald-500/10 text-emerald-100" }
  }
  return {
    label: statusLabels[provider.status] ?? provider.status,
    className: "border-amber-300/40 bg-amber-500/10 text-amber-100",
  }
}

function Navigation({ providerId, onNavigate }: { providerId: string | null; onNavigate?: () => void }) {
  const pathname = usePathname()
  return (
    <nav aria-label="ناوبری پنل سالن" className="space-y-2">
      {navigation.map((item) => {
        const active = item.href === "/salon-dashboard" ? pathname === item.href : pathname.startsWith(item.href)
        const href = providerId ? `${item.href}?providerId=${providerId}` : item.href
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={href}
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

function PanelBrand() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-11 items-center justify-center rounded-2xl border border-[#e4c38d]/30 bg-[#e4c38d]/10 text-[#f0cf96] shadow-inner">
        <Store className="size-5" />
      </div>
      <div>
        <p className="font-serif text-lg font-semibold text-[#fff6e7]">Luxe Beauty</p>
        <p className="text-xs text-[#d5bfae]/65">پنل مدیریت ارائه‌دهنده</p>
      </div>
    </div>
  )
}

export function ProviderPanelShell({ providers, children }: ProviderPanelShellProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const requestedId = searchParams.get("providerId")
  const selectedProvider = providers.find((provider) => provider.id === requestedId) ?? providers[0] ?? null
  const status = selectedProvider ? providerStatus(selectedProvider) : null

  function changeProvider(providerId: string) {
    const params = new URLSearchParams()
    params.set("providerId", providerId)
    router.push(`${pathname}?${params.toString()}`)
    setMobileOpen(false)
  }

  async function logout() {
    setLoggingOut(true)
    try {
      await fetch("/api/auth/logout", { method: "POST", headers: { "Content-Type": "application/json" } })
      router.replace("/auth/login")
      router.refresh()
    } finally {
      setLoggingOut(false)
    }
  }

  const providerSelector = selectedProvider ? (
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
      <label htmlFor="provider-switcher" className="mb-2 block text-xs text-[#d7c0af]/70">
        مجموعه فعال
      </label>
      <select
        id="provider-switcher"
        value={selectedProvider.id}
        onChange={(event) => changeProvider(event.target.value)}
        className="h-11 w-full rounded-xl border border-[#d6b27a]/25 bg-[#2d1c17] px-3 text-sm text-[#fff5e6] outline-none focus:border-[#e3c28b] focus:ring-2 focus:ring-[#e3c28b]/20"
      >
        {providers.map((provider) => (
          <option key={provider.id} value={provider.id}>
            {provider.nameFa}
          </option>
        ))}
      </select>
      {status ? (
        <Badge variant="outline" className={cn("mt-3 rounded-full", status.className)}>
          {status.label}
        </Badge>
      ) : null}
    </div>
  ) : (
    <div className="rounded-2xl border border-dashed border-white/15 p-4 text-sm leading-6 text-[#d9c6b7]/70">
      هنوز مجموعه‌ای برای این حساب ثبت نشده است.
    </div>
  )

  const sidebarContent = (
    <div className="flex h-full flex-col p-5">
      <PanelBrand />
      <div className="mt-7">{providerSelector}</div>
      <div className="mt-6 flex-1">
        <Navigation providerId={selectedProvider?.id ?? null} onNavigate={() => setMobileOpen(false)} />
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
                    <SheetTitle>منوی پنل ارائه‌دهنده</SheetTitle>
                    <SheetDescription>دسترسی به بخش‌های عملیاتی پنل</SheetDescription>
                  </SheetHeader>
                  {sidebarContent}
                </SheetContent>
              </Sheet>
              <div>
                <div className="flex items-center gap-2 text-xs text-[#806b5f]">
                  <ShieldCheck className="size-4" />
                  پنل امن و داده‌محور
                </div>
                <h1 className="mt-1 text-base font-bold text-[#33231d] sm:text-lg">
                  {selectedProvider?.nameFa ?? "پنل ارائه‌دهنده"}
                </h1>
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
