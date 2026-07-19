"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts"

// Icons
function HomeIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
}

function CalendarIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>
}

function ScissorsIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="6" cy="6" r="3"/><path d="M8.12 8.12 12 12"/><path d="M20 4 8.12 15.88"/><circle cx="6" cy="18" r="3"/><path d="M14.8 14.8 20 20"/></svg>
}

function MessageIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
}

function ImageIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
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

function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
}

function TrendingUpIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
}

function TrendingDownIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg>
}

function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M5 12h14"/><path d="M12 5v14"/></svg>
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

function PhoneIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
}

// Data
const revenueData = [
  { month: "فروردین", revenue: 28500000, bookings: 145 },
  { month: "اردیبهشت", revenue: 32000000, bookings: 168 },
  { month: "خرداد", revenue: 38000000, bookings: 195 },
  { month: "تیر", revenue: 35500000, bookings: 182 },
  { month: "مرداد", revenue: 42000000, bookings: 210 },
  { month: "شهریور", revenue: 45000000, bookings: 234 },
]

const servicesData = [
  { name: "کوتاهی مو", value: 35, color: "oklch(0.45 0.18 260)" },
  { name: "رنگ مو", value: 28, color: "oklch(0.55 0.22 160)" },
  { name: "آرایش عروس", value: 18, color: "oklch(0.6 0.15 45)" },
  { name: "مانیکور", value: 12, color: "oklch(0.5 0.2 320)" },
  { name: "سایر", value: 7, color: "oklch(0.7 0.1 260)" },
]

const weeklyData = [
  { day: "شنبه", bookings: 12 },
  { day: "یکشنبه", bookings: 18 },
  { day: "دوشنبه", bookings: 15 },
  { day: "سه‌شنبه", bookings: 22 },
  { day: "چهارشنبه", bookings: 28 },
  { day: "پنج‌شنبه", bookings: 35 },
  { day: "جمعه", bookings: 8 },
]

const bookings = [
  { id: 1, customer: "فاطمه احمدی", service: "کوتاهی مو", date: "امروز", time: "10:30", status: "confirmed", phone: "09123456789", price: 150000 },
  { id: 2, customer: "زهرا محمدی", service: "رنگ مو", date: "امروز", time: "14:00", status: "pending", phone: "09121112223", price: 350000 },
  { id: 3, customer: "مینا رضایی", service: "مانیکور", date: "امروز", time: "16:30", status: "confirmed", phone: "09124445556", price: 120000 },
  { id: 4, customer: "سارا کریمی", service: "کراتین مو", date: "فردا", time: "10:00", status: "pending", phone: "09127778889", price: 800000 },
  { id: 5, customer: "نازنین علوی", service: "آرایش عروس", date: "فردا", time: "08:00", status: "confirmed", phone: "09129990001", price: 2500000 },
]

const services = [
  { id: 1, name: "کوتاهی مو", price: 150000, duration: 45, active: true, bookings: 45 },
  { id: 2, name: "رنگ مو", price: 350000, duration: 90, active: true, bookings: 38 },
  { id: 3, name: "هایلایت", price: 450000, duration: 120, active: true, bookings: 22 },
  { id: 4, name: "کراتین مو", price: 800000, duration: 180, active: true, bookings: 15 },
  { id: 5, name: "مانیکور", price: 120000, duration: 60, active: false, bookings: 28 },
  { id: 6, name: "آرایش عروس", price: 2500000, duration: 240, active: true, bookings: 8 },
]

const reviews = [
  { id: 1, customer: "فاطمه ک.", rating: 5, comment: "واقعا عالی بود! رنگ موهام دقیقا همون چیزی شد که می‌خواستم. حتما باز هم میام.", date: "2 روز پیش", replied: false },
  { id: 2, customer: "زهرا م.", rating: 5, comment: "خدمات فوق‌العاده و پرسنل بسیار حرفه‌ای. محیط سالن هم خیلی تمیز و شیک بود.", date: "1 هفته پیش", replied: true },
  { id: 3, customer: "مینا ت.", rating: 4, comment: "کراتین موهام خیلی خوب شد، فقط کاش زمان انتظار کمتر بود.", date: "2 هفته پیش", replied: false },
]

const stats = [
  { label: "نوبت‌های امروز", value: "12", change: "+3", trend: "up", icon: CalendarIcon },
  { label: "درآمد این ماه", value: "45,000,000", unit: "تومان", change: "+12%", trend: "up", icon: DollarIcon },
  { label: "مشتریان جدید", value: "28", change: "+5", trend: "up", icon: UsersIcon },
  { label: "میانگین امتیاز", value: "4.8", change: "+0.1", trend: "up", icon: StarIcon },
]

function formatPrice(price: number) {
  return new Intl.NumberFormat('fa-IR').format(price)
}

export default function SalonDashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeSection, setActiveSection] = useState("overview")

  const navItems = [
    { id: "overview", label: "داشبورد", icon: HomeIcon },
    { id: "bookings", label: "نوبت‌ها", icon: CalendarIcon, badge: "4" },
    { id: "services", label: "خدمات", icon: ScissorsIcon },
    { id: "reviews", label: "نظرات", icon: MessageIcon, badge: "2" },
    { id: "gallery", label: "نمونه‌کارها", icon: ImageIcon },
    { id: "analytics", label: "گزارش‌ها", icon: ChartIcon },
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
              <span className="font-bold text-foreground">پنل آرایشگاه</span>
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
                    variant={activeSection === item.id ? "secondary" : "default"} 
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
                <AvatarImage src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" />
                <AvatarFallback>سا</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">سالن گلریز</p>
                <p className="text-xs text-muted-foreground">پلن حرفه‌ای</p>
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
              <Input placeholder="جستجو..." className="w-64 pr-10 bg-secondary/50 border-0" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative">
              <BellIcon />
              <span className="absolute -left-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                3
              </span>
            </Button>
            <Avatar className="h-8 w-8 lg:hidden">
              <AvatarImage src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" />
              <AvatarFallback>سا</AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {activeSection === "overview" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground">سلام، سالن گلریز</h1>
                <p className="text-muted-foreground">خلاصه عملکرد سالن شما در شهریور 1404</p>
              </div>

              {/* Stats Grid */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                        <stat.icon className="text-primary" />
                      </div>
                      <span className={`flex items-center gap-1 text-xs font-medium ${
                        stat.trend === "up" ? "text-accent" : "text-destructive"
                      }`}>
                        {stat.trend === "up" ? <TrendingUpIcon /> : <TrendingDownIcon />}
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

              {/* Charts Row */}
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Revenue Chart */}
                <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">درآمد ماهانه</h2>
                      <p className="text-sm text-muted-foreground">6 ماه اخیر</p>
                    </div>
                    <div className="text-left">
                      <p className="text-2xl font-bold text-foreground tabular-nums">221,000,000</p>
                      <p className="text-xs text-muted-foreground">تومان - مجموع</p>
                    </div>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueData}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="oklch(0.45 0.18 260)" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="oklch(0.45 0.18 260)" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.005 260)" />
                        <XAxis dataKey="month" tick={{ fill: 'oklch(0.5 0.02 260)', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: 'oklch(0.5 0.02 260)', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v/1000000}M`} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'oklch(1 0 0)', 
                            border: '1px solid oklch(0.92 0.005 260)',
                            borderRadius: '12px',
                            fontSize: '12px'
                          }} 
                          formatter={(value: number) => [`${formatPrice(value)} تومان`, 'درآمد']}
                        />
                        <Area type="monotone" dataKey="revenue" stroke="oklch(0.45 0.18 260)" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Services Pie Chart */}
                <div className="rounded-2xl border border-border bg-card p-5">
                  <h2 className="text-lg font-semibold text-foreground mb-2">توزیع خدمات</h2>
                  <p className="text-sm text-muted-foreground mb-4">بر اساس تعداد رزرو</p>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={servicesData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {servicesData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => [`${value}%`, '']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 mt-4">
                    {servicesData.map((item) => (
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

              {/* Weekly Bookings Chart */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <h2 className="text-lg font-semibold text-foreground mb-2">رزروهای این هفته</h2>
                <p className="text-sm text-muted-foreground mb-6">تعداد نوبت به تفکیک روز</p>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.005 260)" vertical={false} />
                      <XAxis dataKey="day" tick={{ fill: 'oklch(0.5 0.02 260)', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'oklch(0.5 0.02 260)', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'oklch(1 0 0)', 
                          border: '1px solid oklch(0.92 0.005 260)',
                          borderRadius: '12px',
                          fontSize: '12px'
                        }} 
                        formatter={(value: number) => [`${value} نوبت`, '']}
                      />
                      <Bar dataKey="bookings" fill="oklch(0.55 0.22 160)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Today's Bookings */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">نوبت‌های امروز</h2>
                    <p className="text-sm text-muted-foreground">3 نوبت تایید شده</p>
                  </div>
                  <Button variant="outline" size="sm">
                    مشاهده همه
                  </Button>
                </div>
                <div className="space-y-3">
                  {bookings.filter(b => b.date === "امروز").map((booking) => (
                    <div 
                      key={booking.id}
                      className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 p-4"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary">{booking.customer[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{booking.customer}</p>
                          <p className="text-sm text-muted-foreground">{booking.service}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-left">
                          <p className="font-medium text-foreground">{booking.time}</p>
                          <p className="text-xs text-muted-foreground">{formatPrice(booking.price)} تومان</p>
                        </div>
                        <Badge variant={booking.status === "confirmed" ? "default" : "secondary"} className="text-xs">
                          {booking.status === "confirmed" ? "تایید شده" : "در انتظار"}
                        </Badge>
                        {booking.status === "pending" && (
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-accent hover:text-accent hover:bg-accent/10">
                              <CheckIcon />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                              <XIcon />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === "bookings" && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">مدیریت نوبت‌ها</h1>
                  <p className="text-muted-foreground">تمام نوبت‌های رزرو شده</p>
                </div>
                <Button className="gap-2">
                  <PlusIcon />
                  ثبت نوبت جدید
                </Button>
              </div>

              <Tabs defaultValue="all" className="w-full">
                <TabsList className="w-full justify-start bg-secondary/50 p-1 rounded-xl">
                  <TabsTrigger value="all" className="rounded-lg">همه</TabsTrigger>
                  <TabsTrigger value="today" className="rounded-lg">امروز</TabsTrigger>
                  <TabsTrigger value="pending" className="rounded-lg">در انتظار</TabsTrigger>
                  <TabsTrigger value="confirmed" className="rounded-lg">تایید شده</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-4">
                  <div className="rounded-2xl border border-border bg-card overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border bg-secondary/30">
                            <th className="p-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">مشتری</th>
                            <th className="p-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">خدمت</th>
                            <th className="p-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">تاریخ</th>
                            <th className="p-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">ساعت</th>
                            <th className="p-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">مبلغ</th>
                            <th className="p-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">وضعیت</th>
                            <th className="p-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">عملیات</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bookings.map((booking) => (
                            <tr key={booking.id} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-9 w-9">
                                    <AvatarFallback className="text-sm bg-primary/10 text-primary">{booking.customer[0]}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium text-foreground">{booking.customer}</p>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                      <PhoneIcon />
                                      {booking.phone}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 text-foreground">{booking.service}</td>
                              <td className="p-4 text-foreground">{booking.date}</td>
                              <td className="p-4 text-foreground font-medium">{booking.time}</td>
                              <td className="p-4 text-foreground tabular-nums">{formatPrice(booking.price)}</td>
                              <td className="p-4">
                                <Badge variant={booking.status === "confirmed" ? "default" : "secondary"} className="text-xs">
                                  {booking.status === "confirmed" ? "تایید شده" : "در انتظار"}
                                </Badge>
                              </td>
                              <td className="p-4">
                                <div className="flex gap-1">
                                  {booking.status === "pending" && (
                                    <>
                                      <Button size="icon" variant="ghost" className="h-8 w-8 text-accent hover:bg-accent/10">
                                        <CheckIcon />
                                      </Button>
                                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10">
                                        <XIcon />
                                      </Button>
                                    </>
                                  )}
                                  <Button size="sm" variant="ghost" className="text-xs">
                                    جزئیات
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {activeSection === "services" && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">مدیریت خدمات</h1>
                  <p className="text-muted-foreground">خدمات و قیمت‌گذاری سالن</p>
                </div>
                <Button className="gap-2">
                  <PlusIcon />
                  افزودن خدمت جدید
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {services.map((service) => (
                  <div key={service.id} className={`rounded-2xl border bg-card p-5 transition-all ${service.active ? 'border-border' : 'border-dashed border-border/50 opacity-60'}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">{service.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{service.duration} دقیقه</p>
                      </div>
                      <Badge variant={service.active ? "default" : "secondary"} className="text-xs">
                        {service.active ? "فعال" : "غیرفعال"}
                      </Badge>
                    </div>
                    <div className="mt-4 flex items-end justify-between">
                      <div>
                        <p className="text-2xl font-bold text-foreground tabular-nums">{formatPrice(service.price)}</p>
                        <p className="text-xs text-muted-foreground">تومان</p>
                      </div>
                      <div className="text-left">
                        <p className="text-lg font-semibold text-primary">{service.bookings}</p>
                        <p className="text-xs text-muted-foreground">رزرو این ماه</p>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1 text-xs">ویرایش</Button>
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive text-xs">حذف</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === "reviews" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground">نظرات مشتریان</h1>
                <p className="text-muted-foreground">مدیریت و پاسخ به نظرات</p>
              </div>

              <div className="grid gap-4 md:grid-cols-3 mb-6">
                <div className="rounded-2xl border border-border bg-card p-5 text-center">
                  <p className="text-4xl font-bold text-foreground">4.8</p>
                  <div className="flex justify-center gap-1 mt-2">
                    {[1,2,3,4,5].map((i) => (
                      <StarIcon key={i} className={i <= 4 ? "text-amber-500" : "text-muted-foreground/30"} />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">میانگین امتیاز</p>
                </div>
                <div className="rounded-2xl border border-border bg-card p-5 text-center">
                  <p className="text-4xl font-bold text-foreground">156</p>
                  <p className="text-sm text-muted-foreground mt-2">کل نظرات</p>
                </div>
                <div className="rounded-2xl border border-border bg-card p-5 text-center">
                  <p className="text-4xl font-bold text-accent">2</p>
                  <p className="text-sm text-muted-foreground mt-2">بدون پاسخ</p>
                </div>
              </div>

              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary">{review.customer[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{review.customer}</p>
                          <p className="text-xs text-muted-foreground">{review.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <StarIcon key={i} className={i < review.rating ? "text-amber-500" : "text-muted-foreground/30"} />
                        ))}
                      </div>
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
                    <div className="mt-4 flex items-center justify-between">
                      {review.replied ? (
                        <Badge variant="secondary" className="text-xs">پاسخ داده شده</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs border-primary text-primary">نیاز به پاسخ</Badge>
                      )}
                      <Button size="sm" variant="ghost" className="text-xs">
                        {review.replied ? "مشاهده پاسخ" : "ارسال پاسخ"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === "analytics" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground">گزارش‌ها و آمار</h1>
                <p className="text-muted-foreground">تحلیل عملکرد سالن شما</p>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-border bg-card p-5">
                  <h3 className="text-lg font-semibold text-foreground mb-4">روند رزرو و درآمد</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.005 260)" />
                        <XAxis dataKey="month" tick={{ fill: 'oklch(0.5 0.02 260)', fontSize: 12 }} axisLine={false} />
                        <YAxis yAxisId="left" tick={{ fill: 'oklch(0.5 0.02 260)', fontSize: 12 }} axisLine={false} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fill: 'oklch(0.5 0.02 260)', fontSize: 12 }} axisLine={false} />
                        <Tooltip />
                        <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="oklch(0.45 0.18 260)" strokeWidth={2} dot={{ fill: 'oklch(0.45 0.18 260)' }} />
                        <Line yAxisId="right" type="monotone" dataKey="bookings" stroke="oklch(0.55 0.22 160)" strokeWidth={2} dot={{ fill: 'oklch(0.55 0.22 160)' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5">
                  <h3 className="text-lg font-semibold text-foreground mb-4">پربازدیدترین خدمات</h3>
                  <div className="space-y-4">
                    {services.sort((a, b) => b.bookings - a.bookings).slice(0, 5).map((service, index) => (
                      <div key={service.id} className="flex items-center gap-4">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-foreground">{service.name}</span>
                            <span className="text-sm text-muted-foreground">{service.bookings} رزرو</span>
                          </div>
                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${(service.bookings / 45) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {(activeSection === "gallery" || activeSection === "settings") && (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                {activeSection === "gallery" ? <ImageIcon className="h-8 w-8 text-primary" /> : <SettingsIcon className="h-8 w-8 text-primary" />}
              </div>
              <h2 className="text-xl font-semibold text-foreground">
                {activeSection === "gallery" ? "نمونه‌کارها" : "تنظیمات"}
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
