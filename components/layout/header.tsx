"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function MenuIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  )
}

function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}

function ChevronDownIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

const navigation = [
  { name: "صفحه اصلی", href: "/" },
  { name: "آرایشگاه‌ها", href: "/salons" },
  { name: "تعرفه‌ها", href: "/pricing" },
  { name: "تماس با ما", href: "/contact" },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 right-0 left-0 z-50 glass border-b border-border/50">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-8">
        <div className="flex items-center gap-x-12">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <span className="text-lg font-bold text-primary-foreground">س</span>
            </div>
            <span className="text-xl font-bold text-foreground">سالن یاب</span>
          </Link>
          <div className="hidden lg:flex lg:gap-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.name}
              </Link>
            ))}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                پنل‌ها
                <ChevronDownIcon className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="cursor-pointer">پنل کاربری</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/salon-dashboard" className="cursor-pointer">پنل آرایشگاه</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin" className="cursor-pointer">پنل مدیریت</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="flex items-center gap-x-4">
          <div className="hidden lg:flex lg:items-center lg:gap-x-4">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                ورود
              </Button>
            </Link>
            <Link href="/salon-register">
              <Button size="sm" className="bg-primary hover:bg-primary/90">
                ثبت آرایشگاه
              </Button>
            </Link>
          </div>
          <button
            type="button"
            className="lg:hidden p-2 rounded-lg hover:bg-secondary"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <XIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
          </button>
        </div>
      </nav>
      
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-border/50 bg-card">
          <div className="px-4 py-4 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block px-4 py-2.5 text-sm font-medium text-foreground rounded-lg hover:bg-secondary"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <div className="border-t border-border/50 pt-2 mt-2">
              <Link
                href="/dashboard"
                className="block px-4 py-2.5 text-sm font-medium text-foreground rounded-lg hover:bg-secondary"
                onClick={() => setMobileMenuOpen(false)}
              >
                پنل کاربری
              </Link>
              <Link
                href="/salon-dashboard"
                className="block px-4 py-2.5 text-sm font-medium text-foreground rounded-lg hover:bg-secondary"
                onClick={() => setMobileMenuOpen(false)}
              >
                پنل آرایشگاه
              </Link>
              <Link
                href="/admin"
                className="block px-4 py-2.5 text-sm font-medium text-foreground rounded-lg hover:bg-secondary"
                onClick={() => setMobileMenuOpen(false)}
              >
                پنل مدیریت
              </Link>
            </div>
            <div className="border-t border-border/50 pt-4 mt-2 flex gap-3">
              <Link href="/auth/login" className="flex-1">
                <Button variant="outline" className="w-full">ورود</Button>
              </Link>
              <Link href="/salon-register" className="flex-1">
                <Button className="w-full">ثبت آرایشگاه</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}