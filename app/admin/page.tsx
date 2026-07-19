"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts"

// Icons
function HomeIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
}

function StoreIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7"/></svg>
}

function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
}

function AlertIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
}

function ChartIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="m19 9-5 5-4-4-3 3"/></svg>
}

function SettingsIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
}

function MenuIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
}

function BellIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
}

function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
}

function LogOutIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
}

function TrendingUpIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
}

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M20 6 9 17l-5-5"/></svg>
}

function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
}

function StarIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" {...props}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
}

function DollarIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
}

function EyeIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>
}

function BanIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/></svg>
}

function CreditCardIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
}

// Data
const platformStats = [
  { label: "کل آرایشگاه‌ها", value: "5,234", change: "+123", icon: StoreIcon },
  { label: "کل کاربران", value: "150,000", change: "+2,500", icon: UsersIcon },
  { label: "درآمد پلتفرم", value: "12.5B", unit: "تومان", change: "+8%", icon: DollarIcon },
  { label: "تراکنش‌های موفق", value: "45,680", change: "+1,234", icon: CreditCardIcon },
]

const monthlyGrowthData = [
  { month: "فروردین", salons: 4200, users: 120000, revenue: 8500 },
  { month: "اردیبهشت", salons: 4450, users: 128000, revenue: 9200 },
  { month: "خرداد", salons: 4680, users: 135000, revenue: 10100 },
  { month: "تیر", salons: 4850, users: 140000, revenue: 10800 },
  { month: "مرداد", salons: 5050, users: 145000, revenue: 11600 },
  { month: "شهریور", salons: 5234, users: 150000, revenue: 12500 },
]

const cityDistribution = [
  { name: "تهران", value: 45, color: "oklch(0.45 0.18 260)" },
  { name: "اصفهان", value: 15, color: "oklch(0.55 0.22 160)" },
  { name: "مشهد", value: 12, color: "oklch(0.6 0.15 45)" },
  { name: "شیراز", value: 10, color: "oklch(0.5 0.2 320)" },
  { name: "سایر", value: 18, color: "oklch(0.7 0.1 260)" },
]

const revenueByPlan = [
  { plan: "رایگان", count: 2500, revenue: 0 },
  { plan: "پایه", count: 1800, revenue: 2700 },
  { plan: "حرفه‌ای", count: 750, revenue: 5625 },
  { plan: "سازمانی", count: 184, revenue: 4140 },
]

const salons = [
  { id: 1, name: "سالن زیبایی گلریز", owner: "سارا محمدی", city: "تهران", status: "active", rating: 4.9, bookings: 234, revenue: 45000000, joined: "1403/01/15" },
  { id: 2, name: "آرایشگاه مدرن استایل", owner: "علی رضایی", city: "تهران", status: "active", rating: 4.8, bookings: 189, revenue: 32000000, joined: "1403/02/20" },
  { id: 3, name: "سالن آرایش رز", owner: "مریم احمدی", city: "اصفهان", status: "pending", rating: 0, bookings: 0, revenue: 0, joined: "1404/03/01" },
  { id: 4, name: "بیوتی سنتر پرستیژ", owner: "نازنین کریمی", city: "تهران", status: "suspended", rating: 4.2, bookings: 156, revenue: 28000000, joined: "1402/11/05" },
  { id: 5, name: "سالن لوکس ونوس", owner: "پریسا نوری", city: "شیراز", status: "active", rating: 4.7, bookings: 198, revenue: 38000000, joined: "1403/04/10" },
]

const users = [
  { id: 1, name: "فاطمه احمدی", phone: "09123456789", email: "fateme@email.com", bookings: 12, status: "active", joined: "1403/01/10" },
  { id: 2, name: "زهرا محمدی", phone: "09121112223", email: "zahra@email.com", bookings: 8, status: "active", joined: "1403/02/15" },
  { id: 3, name: "مینا رضایی", phone: "09124445556", email: "mina@email.com", bookings: 5, status: "banned", joined: "1403/03/20" },
  { id: 4, name: "سارا کریمی", phone: "09127778889", email: "sara@email.com", bookings: 15, status: "active", joined: "1402/11/05" },
]

const reports = [
  { id: 1, type: "complaint", salon: "بیوتی سنتر پرستیژ", user: "زهرا م.", message: "خدمات ارائه شده با توضیحات مطابقت نداشت", date: "2 روز پیش", status: "pending" },
  { id: 2, type: "review", salon: "سالن زیبایی گلریز", user: "مینا ت.", message: "محتوای نامناسب در نظر", date: "3 روز پیش", status: "resolved" },
  { id: 3, type: "fraud", salon: "آرایشگاه مدرن استایل", user: "سیستم", message: "فعالیت مشکوک در تراکنش‌ها شناسایی شد", date: "1 روز پیش", status: "pending" },
]

function formatPrice(price: number) {
  return new Intl.NumberFormat('fa-IR').format(price)
}

export default function AdminPanelPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeSection, setActiveSection] = useState("overview")

  const navItems = [
    { id: "overview", label: "داشبورد", icon: HomeIcon },
    { id: "salons", label: "آرایشگاه‌ها", icon: StoreIcon, badge: "1" },
    { id: "users", label: "کاربران", icon: UsersIcon },
    { id: "reports", label: "گزارشات", icon: AlertIcon, badge: "2", badgeVariant: "destructive" as const },
    { id: "analytics", label: "آمار", icon: ChartIcon },
    { id: "settings", label: "تنظیمات", icon: SettingsIcon },
  ]

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 right-0 z-50 w-64 transform border-l border-border bg-card transition-transform duration-300 ease-in-out ${
        sidebarOpen ? "translate-x-0" : "translate-x-full"
      } lg:relative lg:translate-x-0`}>
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between border-b border-border px-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
                <span className="text-lg font-bold text-primary-foreground">س</span>
              </div>
              <span className="font-bold text-foreground">پنل مدیریت</span>
            </Link>
          </div>

          <nav className="flex-1 space-y-1 p-4">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveSection(item.id); setSidebarOpen(false) }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-right transition-colors ${
                  activeSection === item.id 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <item.icon />
                <span className="text-sm font-medium">{item.label}</span>
                {item.badge && (
                  <Badge 
                    variant={item.badgeVariant || (activeSection === item.id ? "secondary" : "default")} 
                    className="mr-auto text-[10px] px-1.5"
                  >
                    {item.badge}
                  </Badge>
                )}
              </button>
            ))}
          </nav>

          <div className="border-t border-border p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-border">
                <AvatarFallback className="bg-destructive/10 text-destructive font-bold">AD</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">ادمین اصلی</p>
                <p className="text-xs text-muted-foreground">مدیر سیستم</p>
              </div>
              <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground">
                <LogOutIcon />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/80 backdrop-blur px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <MenuIcon />
            </Button>
            <div className="relative hidden md:block">
              <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="جستجوی سالن، کاربر یا گزارش..." className="w-80 pr-10 bg-secondary/50 border-0" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative">
              <BellIcon />
              <span className="absolute -left-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-white">
                5
              </span>
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {activeSection === "overview" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground">داشبورد مدیریت</h1>
                <p className="text-muted-foreground">خلاصه وضعیت پلتفرم سالن یاب</p>
              </div>

              {/* Stats Grid */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {platformStats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                        <stat.icon className="text-primary" />
                      </div>
                      <span className="flex items-center gap-1 text-xs font-medium text-accent">
                        <TrendingUpIcon />
                        {stat.change}
                      </span>
                    </div>
                    <div className="mt-4">
                      <p className="text-2xl font-bold text-foreground tabular-nums">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Charts */}
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Growth Chart */}
                <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">رشد پلتفرم</h2>
                      <p className="text-sm text-muted-foreground">آرایشگاه‌ها و کاربران - 6 ماه اخیر</p>
                    </div>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyGrowthData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.005 260)" />
                        <XAxis dataKey="month" tick={{ fill: 'oklch(0.5 0.02 260)', fontSize: 12 }} axisLine={false} />
                        <YAxis yAxisId="left" tick={{ fill: 'oklch(0.5 0.02 260)', fontSize: 12 }} axisLine={false} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fill: 'oklch(0.5 0.02 260)', fontSize: 12 }} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'oklch(1 0 0)', 
                            border: '1px solid oklch(0.92 0.005 260)',
                            borderRadius: '12px',
                            fontSize: '12px'
                          }} 
                        />
                        <Line yAxisId="left" type="monotone" dataKey="salons" name="آرایشگاه" stroke="oklch(0.45 0.18 260)" strokeWidth={2} dot={{ fill: 'oklch(0.45 0.18 260)' }} />
                        <Line yAxisId="right" type="monotone" dataKey="users" name="کاربر" stroke="oklch(0.55 0.22 160)" strokeWidth={2} dot={{ fill: 'oklch(0.55 0.22 160)' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* City Distribution */}
                <div className="rounded-2xl border border-border bg-card p-5">
                  <h2 className="text-lg font-semibold text-foreground mb-2">توزیع شهری</h2>
                  <p className="text-sm text-muted-foreground mb-4">آرایشگاه‌ها بر اساس شهر</p>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={cityDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {cityDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => [`${value}%`, '']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 mt-4">
                    {cityDistribution.map((item) => (
                      <div key={item.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-muted-foreground">{item.name}</span>
                        </div>
                        <span className="font-medium text-foreground">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Revenue by Plan */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <h2 className="text-lg font-semibold text-foreground mb-4">درآمد به تفکیک پلن</h2>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueByPlan} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.005 260)" horizontal={false} />
                      <XAxis type="number" tick={{ fill: 'oklch(0.5 0.02 260)', fontSize: 12 }} axisLine={false} />
                      <YAxis type="category" dataKey="plan" tick={{ fill: 'oklch(0.5 0.02 260)', fontSize: 12 }} axisLine={false} width={80} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'oklch(1 0 0)', 
                          border: '1px solid oklch(0.92 0.005 260)',
                          borderRadius: '12px',
                          fontSize: '12px'
                        }}
                        formatter={(value: number) => [`${formatPrice(value)} میلیون تومان`, 'درآمد']}
                      />
                      <Bar dataKey="revenue" fill="oklch(0.45 0.18 260)" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Pending Approvals */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">در انتظار تایید</h2>
                    <p className="text-sm text-muted-foreground">آرایشگاه‌های جدید</p>
                  </div>
                  <Badge variant="secondary">1 مورد</Badge>
                </div>
                <div className="space-y-3">
                  {salons.filter(s => s.status === "pending").map((salon) => (
                    <div 
                      key={salon.id}
                      className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-4"
                    >
                      <div>
                        <p className="font-medium text-foreground">{salon.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {salon.owner} - {salon.city} - {salon.joined}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                          <CheckIcon className="ml-1" />
                          تایید
                        </Button>
                        <Button size="sm" variant="outline" className="text-destructive border-destructive/50 hover:bg-destructive/10">
                          <XIcon className="ml-1" />
                          رد
                        </Button>
                        <Button size="sm" variant="ghost">
                          <EyeIcon className="ml-1" />
                          بررسی
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Reports */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">گزارش‌های اخیر</h2>
                    <p className="text-sm text-muted-foreground">نیازمند بررسی</p>
                  </div>
                  <Button variant="outline" size="sm">مشاهده همه</Button>
                </div>
                <div className="space-y-3">
                  {reports.map((report) => (
                    <div 
                      key={report.id}
                      className="flex items-center justify-between rounded-xl border border-border p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                          report.status === "pending" ? "bg-amber-100" : "bg-accent/10"
                        }`}>
                          <AlertIcon className={`h-5 w-5 ${
                            report.status === "pending" ? "text-amber-600" : "text-accent"
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{report.salon}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">{report.message}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={report.status === "pending" ? "secondary" : "default"} className="text-xs">
                          {report.status === "pending" ? "در انتظار" : "بررسی شده"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{report.date}</span>
                        <Button size="sm" variant="ghost">بررسی</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === "salons" && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">مدیریت آرایشگاه‌ها</h1>
                  <p className="text-muted-foreground">مشاهده و مدیریت تمام آرایشگاه‌ها</p>
                </div>
                <div className="flex gap-2">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-32 bg-card">
                      <SelectValue placeholder="وضعیت" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">همه</SelectItem>
                      <SelectItem value="active">فعال</SelectItem>
                      <SelectItem value="pending">در انتظار</SelectItem>
                      <SelectItem value="suspended">معلق</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-secondary/30">
                        <th className="p-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">سالن</th>
                        <th className="p-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">مالک</th>
                        <th className="p-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">شهر</th>
                        <th className="p-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">امتیاز</th>
                        <th className="p-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">رزروها</th>
                        <th className="p-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">درآمد</th>
                        <th className="p-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">وضعیت</th>
                        <th className="p-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">عملیات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salons.map((salon) => (
                        <tr key={salon.id} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                          <td className="p-4">
                            <p className="font-medium text-foreground">{salon.name}</p>
                            <p className="text-xs text-muted-foreground">{salon.joined}</p>
                          </td>
                          <td className="p-4 text-foreground">{salon.owner}</td>
                          <td className="p-4 text-foreground">{salon.city}</td>
                          <td className="p-4">
                            {salon.rating > 0 ? (
                              <div className="flex items-center gap-1">
                                <StarIcon className="text-amber-500" />
                                <span className="font-medium text-foreground">{salon.rating}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="p-4 text-foreground tabular-nums">{salon.bookings}</td>
                          <td className="p-4 text-foreground tabular-nums">{formatPrice(salon.revenue)}</td>
                          <td className="p-4">
                            <Badge 
                              variant={
                                salon.status === "active" ? "default" :
                                salon.status === "pending" ? "secondary" : "destructive"
                              }
                              className="text-xs"
                            >
                              {salon.status === "active" ? "فعال" :
                               salon.status === "pending" ? "در انتظار" : "معلق"}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex gap-1">
                              <Button size="icon" variant="ghost" className="h-8 w-8">
                                <EyeIcon />
                              </Button>
                              {salon.status === "active" && (
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                                  <BanIcon />
                                </Button>
                              )}
                              {salon.status === "pending" && (
                                <>
                                  <Button size="icon" variant="ghost" className="h-8 w-8 text-accent hover:text-accent hover:bg-accent/10">
                                    <CheckIcon />
                                  </Button>
                                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                                    <XIcon />
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeSection === "users" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground">مدیریت کاربران</h1>
                <p className="text-muted-foreground">مشاهده و مدیریت کاربران پلتفرم</p>
              </div>

              <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-secondary/30">
                        <th className="p-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">کاربر</th>
                        <th className="p-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">شماره</th>
                        <th className="p-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">ایمیل</th>
                        <th className="p-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">رزروها</th>
                        <th className="p-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">تاریخ عضویت</th>
                        <th className="p-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">وضعیت</th>
                        <th className="p-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">عملیات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarFallback className="text-sm bg-primary/10 text-primary">{user.name[0]}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-foreground">{user.name}</span>
                            </div>
                          </td>
                          <td className="p-4 text-foreground tabular-nums">{user.phone}</td>
                          <td className="p-4 text-foreground">{user.email}</td>
                          <td className="p-4 text-foreground tabular-nums">{user.bookings}</td>
                          <td className="p-4 text-muted-foreground">{user.joined}</td>
                          <td className="p-4">
                            <Badge 
                              variant={user.status === "active" ? "default" : "destructive"}
                              className="text-xs"
                            >
                              {user.status === "active" ? "فعال" : "مسدود"}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex gap-1">
                              <Button size="icon" variant="ghost" className="h-8 w-8">
                                <EyeIcon />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                                <BanIcon />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeSection === "reports" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground">گزارشات و شکایات</h1>
                <p className="text-muted-foreground">بررسی و رسیدگی به گزارشات کاربران</p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-border bg-card p-5 text-center">
                  <p className="text-4xl font-bold text-foreground">12</p>
                  <p className="text-sm text-muted-foreground mt-2">کل گزارشات</p>
                </div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-center">
                  <p className="text-4xl font-bold text-amber-600">2</p>
                  <p className="text-sm text-muted-foreground mt-2">در انتظار بررسی</p>
                </div>
                <div className="rounded-2xl border border-border bg-card p-5 text-center">
                  <p className="text-4xl font-bold text-accent">10</p>
                  <p className="text-sm text-muted-foreground mt-2">رسیدگی شده</p>
                </div>
              </div>

              <div className="space-y-4">
                {reports.map((report) => (
                  <div key={report.id} className={`rounded-2xl border p-5 ${
                    report.status === "pending" ? "border-amber-200 bg-amber-50/50" : "border-border bg-card"
                  }`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full shrink-0 ${
                          report.status === "pending" ? "bg-amber-100" : "bg-accent/10"
                        }`}>
                          <AlertIcon className={`h-5 w-5 ${
                            report.status === "pending" ? "text-amber-600" : "text-accent"
                          }`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-foreground">{report.salon}</p>
                            <Badge variant="outline" className="text-[10px]">
                              {report.type === "complaint" ? "شکایت" : report.type === "review" ? "نظر نامناسب" : "تقلب"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{report.message}</p>
                          <p className="text-xs text-muted-foreground mt-2">گزارش دهنده: {report.user} | {report.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={report.status === "pending" ? "secondary" : "default"} className="text-xs">
                          {report.status === "pending" ? "در انتظار" : "بررسی شده"}
                        </Badge>
                        {report.status === "pending" && (
                          <Button size="sm">بررسی</Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(activeSection === "analytics" || activeSection === "settings") && (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                {activeSection === "analytics" ? <ChartIcon className="h-8 w-8 text-primary" /> : <SettingsIcon className="h-8 w-8 text-primary" />}
              </div>
              <h2 className="text-xl font-semibold text-foreground">
                {activeSection === "analytics" ? "آمار پیشرفته" : "تنظیمات سیستم"}
              </h2>
              <p className="text-muted-foreground mt-2 max-w-md">
                این بخش در نسخه بعدی فعال خواهد شد.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
