"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bell, ChevronDown, Heart, MapPin, Menu, Navigation, Search, Store, UserRound, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cities, salons, serviceCategories, staffMembers } from "@/lib/mock-data"

const mobileNavigation = [
  { name: "صفحه اصلی", href: "/" },
  { name: "دسته‌بندی خدمات", href: "/categories" },
  { name: "سالن‌های نزدیک من", href: "/salons?nearby=1" },
  { name: "تخفیف‌ها", href: "/offers" },
  { name: "مجله زیبایی", href: "/blog" },
  { name: "ثبت سالن", href: "/salon-register" },
  { name: "درباره ما", href: "/about" },
  { name: "تماس و پشتیبانی", href: "/support" },
  { name: "قوانین و مقررات", href: "/terms" },
]

export function Header() {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [city, setCity] = useState("")
  const [query, setQuery] = useState("")
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    setCity(window.localStorage.getItem("luxe_city") ?? "")
  }, [])

  const suggestions = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return []
    const salonMatches = salons.filter((salon) => `${salon.name} ${salon.area} ${salon.city}`.toLowerCase().includes(normalized)).slice(0, 3).map((salon) => ({ type: "سالن", label: salon.name, meta: `${salon.area}، ${salon.city}`, href: `/salons/${salon.slug}` }))
    const categoryMatches = serviceCategories.filter((category) => category.name.includes(query.trim())).slice(0, 3).map((category) => ({ type: "خدمت", label: category.name, meta: category.description, href: `/salons?category=${category.slug}` }))
    const staffMatches = staffMembers.filter((staff) => `${staff.fullName} ${staff.specialties.join(" ")}`.includes(query.trim())).slice(0, 2).map((staff) => ({ type: "آرایشگر", label: staff.fullName, meta: staff.title, href: `/salons/${salons.find((salon) => salon.id === staff.salonId)?.slug ?? "luxe-beauty"}` }))
    return [...salonMatches, ...categoryMatches, ...staffMatches]
  }, [query])

  function selectCity(value: string) {
    setCity(value)
    window.localStorage.setItem("luxe_city", value)
  }

  function submitSearch(event: React.FormEvent) {
    event.preventDefault()
    const params = new URLSearchParams()
    if (query.trim()) params.set("q", query.trim())
    if (city) params.set("city", city)
    router.push(`/salons?${params.toString()}`)
    setSearchOpen(false)
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur-xl">
      <nav className="mx-auto flex h-20 max-w-7xl items-center gap-4 px-4 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary font-black text-primary-foreground">ل</div>
          <div className="hidden sm:block"><span className="block text-lg font-black leading-5 text-foreground">لوکس بیوتی</span><span className="text-[10px] text-muted-foreground">رزرو آنلاین زیبایی</span></div>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger className="hidden shrink-0 items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground md:flex">
            <MapPin className="h-4 w-4 text-primary" />{city || "شهر خود را انتخاب کنید"}<ChevronDown className="h-4 w-4 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            <DropdownMenuLabel>انتخاب شهر</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => selectCity("تهران")}>استفاده از موقعیت فعلی <Navigation className="mr-auto h-4 w-4" /></DropdownMenuItem>
            <DropdownMenuSeparator />
            {cities.map((item) => <DropdownMenuItem key={item.id} onSelect={() => selectCity(item.name)}>{item.name}</DropdownMenuItem>)}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger className="hidden shrink-0 items-center gap-1 text-sm font-bold text-muted-foreground hover:text-foreground lg:flex">خدمات<ChevronDown className="h-4 w-4" /></DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="grid w-[420px] grid-cols-2 gap-1 p-2">
            {serviceCategories.map((category) => <DropdownMenuItem key={category.id} asChild><Link href={`/salons?category=${category.slug}`} className="flex cursor-pointer items-center gap-3 rounded-lg p-3"><span className="text-lg">{category.icon}</span><span><strong className="block text-sm text-foreground">{category.name}</strong><small className="text-muted-foreground">{category.description}</small></span></Link></DropdownMenuItem>)}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="relative hidden min-w-0 flex-1 md:block">
          <form onSubmit={submitSearch}>
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} onFocus={() => setSearchOpen(true)} placeholder="نام سالن، خدمت، آرایشگر یا منطقه را جستجو کنید…" className="h-11 rounded-xl bg-secondary/60 pr-10" />
          </form>
          {searchOpen && query.trim() && (
            <div className="absolute inset-x-0 top-[3.25rem] overflow-hidden rounded-2xl border border-border bg-card p-2 shadow-xl">
              {suggestions.length ? suggestions.map((item) => <Link key={`${item.type}-${item.label}`} href={item.href} onClick={() => setSearchOpen(false)} className="flex items-center justify-between rounded-xl px-3 py-3 hover:bg-secondary"><span><strong className="block text-sm text-foreground">{item.label}</strong><small className="text-muted-foreground">{item.meta}</small></span><span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">{item.type}</span></Link>) : <button type="submit" onClick={() => router.push(`/salons?q=${encodeURIComponent(query)}`)} className="w-full rounded-xl p-4 text-sm text-muted-foreground hover:bg-secondary">جستجوی «{query}» در همه سالن‌ها</button>}
            </div>
          )}
        </div>

        <div className="mr-auto flex shrink-0 items-center gap-1">
          <Button variant="ghost" size="icon" className="hidden sm:inline-flex" asChild><Link href="/dashboard" aria-label="علاقه‌مندی‌ها"><Heart className="h-5 w-5" /></Link></Button>
          <Button variant="ghost" size="icon" className="hidden sm:inline-flex" asChild><Link href="/dashboard" aria-label="اعلان‌ها"><Bell className="h-5 w-5" /></Link></Button>
          <Button variant="ghost" className="hidden lg:inline-flex" asChild><Link href="/auth/login"><UserRound className="ml-2 h-4 w-4" />ورود / ثبت‌نام</Link></Button>
          <Button className="hidden lg:inline-flex" asChild><Link href="/salon-register"><Store className="ml-2 h-4 w-4" />ثبت سالن شما</Link></Button>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => router.push("/salons")} aria-label="جستجو"><Search className="h-5 w-5" /></Button>
          <button type="button" className="rounded-lg p-2 hover:bg-secondary lg:hidden" onClick={() => setMobileMenuOpen((value) => !value)} aria-label="منوی اصلی">{mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}</button>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="max-h-[calc(100vh-5rem)] overflow-y-auto border-t border-border bg-card lg:hidden">
          <div className="mx-auto max-w-7xl px-4 py-4">
            <label className="block text-xs font-bold text-muted-foreground">شهر<select value={city} onChange={(event) => selectCity(event.target.value)} className="mt-2 h-10 w-full rounded-xl border border-input bg-background px-3"><option value="">شهر خود را انتخاب کنید</option>{cities.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select></label>
            <div className="mt-4 grid gap-1 sm:grid-cols-2">{mobileNavigation.map((item) => <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-3 py-3 text-sm font-medium text-foreground hover:bg-secondary">{item.name}</Link>)}</div>
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4"><Button variant="outline" asChild><Link href="/auth/login">ورود / ثبت‌نام</Link></Button><Button asChild><Link href="/salon-register">ثبت سالن</Link></Button></div>
          </div>
        </div>
      )}
    </header>
  )
}
