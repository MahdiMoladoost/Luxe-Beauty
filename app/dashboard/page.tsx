"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  Calendar, Clock, MapPin, Star, Heart, Settings, LogOut, 
  User, CreditCard, Bell, ChevronLeft, Phone, Edit
} from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

const upcomingBookings = [
  {
    id: 1,
    salon: "سالن زیبایی گلریز",
    service: "کوتاهی مو",
    date: "شنبه، ۱۵ خرداد",
    time: "۱۰:۳۰",
    stylist: "سارا محمدی",
    price: "۱۵۰,۰۰۰",
    status: "confirmed",
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=100&h=100&fit=crop",
  },
  {
    id: 2,
    salon: "بیوتی سنتر پرستیژ",
    service: "مانیکور",
    date: "چهارشنبه، ۱۹ خرداد",
    time: "۱۶:۰۰",
    stylist: "نازنین رضایی",
    price: "۱۲۰,۰۰۰",
    status: "pending",
    image: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=100&h=100&fit=crop",
  },
]

const pastBookings = [
  {
    id: 3,
    salon: "آرایشگاه مدرن استایل",
    service: "رنگ مو",
    date: "۵ خرداد ۱۴۰۴",
    time: "۱۴:۰۰",
    price: "۳۵۰,۰۰۰",
    status: "completed",
    rated: true,
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=100&h=100&fit=crop",
  },
  {
    id: 4,
    salon: "سالن زیبایی گلریز",
    service: "کراتین مو",
    date: "۲۰ اردیبهشت ۱۴۰۴",
    time: "۱۱:۰۰",
    price: "۸۰۰,۰۰۰",
    status: "completed",
    rated: false,
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=100&h=100&fit=crop",
  },
]

const favoriteSalons = [
  {
    id: 1,
    name: "سالن زیبایی گلریز",
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=200&h=150&fit=crop",
    rating: 4.9,
    location: "تهران، ولیعصر",
  },
  {
    id: 2,
    name: "بیوتی سنتر پرستیژ",
    image: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=200&h=150&fit=crop",
    rating: 4.9,
    location: "تهران، جردن",
  },
]

export default function UserDashboardPage() {
  const [activeTab, setActiveTab] = useState("bookings")

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1 bg-secondary/20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col gap-8 lg:flex-row">
            {/* Sidebar */}
            <aside className="w-full shrink-0 lg:w-72">
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="text-center">
                  <Avatar className="mx-auto h-20 w-20">
                    <AvatarImage src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop" />
                    <AvatarFallback>فا</AvatarFallback>
                  </Avatar>
                  <h2 className="mt-4 text-lg font-semibold">فاطمه احمدی</h2>
                  <p className="text-sm text-muted-foreground">۰۹۱۲۳۴۵۶۷۸۹</p>
                  <Badge variant="secondary" className="mt-2">
                    کاربر طلایی
                  </Badge>
                </div>

                <nav className="mt-6 space-y-1">
                  <button
                    onClick={() => setActiveTab("bookings")}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-right transition-colors ${
                      activeTab === "bookings" 
                        ? "bg-accent/10 text-accent" 
                        : "hover:bg-secondary"
                    }`}
                  >
                    <Calendar className="h-5 w-5" />
                    <span>نوبت‌های من</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("favorites")}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-right transition-colors ${
                      activeTab === "favorites" 
                        ? "bg-accent/10 text-accent" 
                        : "hover:bg-secondary"
                    }`}
                  >
                    <Heart className="h-5 w-5" />
                    <span>علاقه‌مندی‌ها</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("payments")}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-right transition-colors ${
                      activeTab === "payments" 
                        ? "bg-accent/10 text-accent" 
                        : "hover:bg-secondary"
                    }`}
                  >
                    <CreditCard className="h-5 w-5" />
                    <span>تراکنش‌ها</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("notifications")}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-right transition-colors ${
                      activeTab === "notifications" 
                        ? "bg-accent/10 text-accent" 
                        : "hover:bg-secondary"
                    }`}
                  >
                    <Bell className="h-5 w-5" />
                    <span>اعلان‌ها</span>
                    <Badge className="mr-auto">۳</Badge>
                  </button>
                  <button
                    onClick={() => setActiveTab("profile")}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-right transition-colors ${
                      activeTab === "profile" 
                        ? "bg-accent/10 text-accent" 
                        : "hover:bg-secondary"
                    }`}
                  >
                    <Settings className="h-5 w-5" />
                    <span>تنظیمات</span>
                  </button>
                </nav>

                <div className="mt-6 border-t border-border pt-6">
                  <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-right text-red-500 transition-colors hover:bg-red-50">
                    <LogOut className="h-5 w-5" />
                    <span>خروج از حساب</span>
                  </button>
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1">
              {activeTab === "bookings" && (
                <div className="space-y-6">
                  {/* Upcoming Bookings */}
                  <div className="rounded-2xl border border-border bg-card p-6">
                    <h2 className="text-xl font-semibold">نوبت‌های آینده</h2>
                    <div className="mt-4 space-y-4">
                      {upcomingBookings.map((booking) => (
                        <div 
                          key={booking.id}
                          className="flex items-center gap-4 rounded-xl border border-border p-4"
                        >
                          <img 
                            src={booking.image} 
                            alt={booking.salon}
                            className="h-16 w-16 rounded-lg object-cover"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{booking.salon}</h3>
                              <Badge variant={booking.status === "confirmed" ? "default" : "secondary"}>
                                {booking.status === "confirmed" ? "تایید شده" : "در انتظار تایید"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{booking.service}</p>
                            <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {booking.date}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {booking.time}
                              </span>
                            </div>
                          </div>
                          <div className="text-left">
                            <span className="font-semibold">{booking.price}</span>
                            <span className="text-sm text-muted-foreground"> تومان</span>
                          </div>
                          <Button variant="outline" size="sm">
                            جزئیات
                            <ChevronLeft className="mr-1 h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Past Bookings */}
                  <div className="rounded-2xl border border-border bg-card p-6">
                    <h2 className="text-xl font-semibold">نوبت‌های گذشته</h2>
                    <div className="mt-4 space-y-4">
                      {pastBookings.map((booking) => (
                        <div 
                          key={booking.id}
                          className="flex items-center gap-4 rounded-xl border border-border p-4"
                        >
                          <img 
                            src={booking.image} 
                            alt={booking.salon}
                            className="h-16 w-16 rounded-lg object-cover"
                          />
                          <div className="flex-1">
                            <h3 className="font-medium">{booking.salon}</h3>
                            <p className="text-sm text-muted-foreground">{booking.service}</p>
                            <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {booking.date}
                              </span>
                            </div>
                          </div>
                          <div className="text-left">
                            <span className="font-semibold">{booking.price}</span>
                            <span className="text-sm text-muted-foreground"> تومان</span>
                          </div>
                          {!booking.rated && (
                            <Button size="sm">
                              <Star className="ml-1 h-4 w-4" />
                              ثبت نظر
                            </Button>
                          )}
                          {booking.rated && (
                            <div className="flex items-center gap-1 text-amber-500">
                              <Star className="h-4 w-4 fill-amber-500" />
                              <span className="text-sm">امتیاز داده شد</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "favorites" && (
                <div className="rounded-2xl border border-border bg-card p-6">
                  <h2 className="text-xl font-semibold">سالن‌های مورد علاقه</h2>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    {favoriteSalons.map((salon) => (
                      <Link 
                        key={salon.id}
                        href={`/salons/${salon.id}`}
                        className="group flex items-center gap-4 rounded-xl border border-border p-4 transition-all hover:shadow-md"
                      >
                        <img 
                          src={salon.image} 
                          alt={salon.name}
                          className="h-20 w-20 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <h3 className="font-medium group-hover:text-accent">{salon.name}</h3>
                          <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            {salon.location}
                          </div>
                          <div className="mt-1 flex items-center gap-1">
                            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                            <span className="text-sm">{salon.rating}</span>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon">
                          <Heart className="h-5 w-5 fill-red-500 text-red-500" />
                        </Button>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "profile" && (
                <div className="rounded-2xl border border-border bg-card p-6">
                  <h2 className="text-xl font-semibold">تنظیمات حساب کاربری</h2>
                  <div className="mt-6 space-y-6">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop" />
                        <AvatarFallback>فا</AvatarFallback>
                      </Avatar>
                      <Button variant="outline" size="sm">
                        <Edit className="ml-1 h-4 w-4" />
                        تغییر عکس
                      </Button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">نام و نام خانوادگی</label>
                        <Input defaultValue="فاطمه احمدی" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">شماره موبایل</label>
                        <div className="relative">
                          <Phone className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                          <Input defaultValue="۰۹۱۲۳۴۵۶۷۸۹" className="pr-10" dir="ltr" disabled />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">ایمیل</label>
                        <Input defaultValue="fateme@email.com" dir="ltr" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">تاریخ تولد</label>
                        <Input defaultValue="۱۳۷۵/۰۶/۱۵" />
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <Button>ذخیره تغییرات</Button>
                      <Button variant="outline">انصراف</Button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "notifications" && (
                <div className="rounded-2xl border border-border bg-card p-6">
                  <h2 className="text-xl font-semibold">اعلان‌ها</h2>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-start gap-3 rounded-lg bg-accent/5 p-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
                        <Calendar className="h-5 w-5 text-accent" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">یادآوری نوبت</p>
                        <p className="text-sm text-muted-foreground">
                          نوبت شما در سالن زیبایی گلریز فردا ساعت ۱۰:۳۰ است
                        </p>
                        <span className="text-xs text-muted-foreground">۲ ساعت پیش</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-lg p-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                        <Star className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">تخفیف ویژه</p>
                        <p className="text-sm text-muted-foreground">
                          ۲۰٪ تخفیف برای اولین رزرو در سالن‌های جدید
                        </p>
                        <span className="text-xs text-muted-foreground">۱ روز پیش</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "payments" && (
                <div className="rounded-2xl border border-border bg-card p-6">
                  <h2 className="text-xl font-semibold">تاریخچه تراکنش‌ها</h2>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between rounded-lg border border-border p-4">
                      <div>
                        <p className="font-medium">پرداخت به سالن زیبایی گلریز</p>
                        <p className="text-sm text-muted-foreground">کراتین مو - ۲۰ اردیبهشت ۱۴۰۴</p>
                      </div>
                      <div className="text-left">
                        <span className="font-semibold text-red-500">-۸۰۰,۰۰۰</span>
                        <span className="text-sm text-muted-foreground"> تومان</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-border p-4">
                      <div>
                        <p className="font-medium">پرداخت به آرایشگاه مدرن استایل</p>
                        <p className="text-sm text-muted-foreground">رنگ مو - ۵ خرداد ۱۴۰۴</p>
                      </div>
                      <div className="text-left">
                        <span className="font-semibold text-red-500">-۳۵۰,۰۰۰</span>
                        <span className="text-sm text-muted-foreground"> تومان</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
