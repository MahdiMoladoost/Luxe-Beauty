"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Star, MapPin, Clock, Phone, Instagram, Share2, Heart, ChevronLeft, ChevronRight, Check } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

const salon = {
  id: 1,
  name: "سالن زیبایی گلریز",
  images: [
    "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&h=600&fit=crop",
  ],
  rating: 4.9,
  reviews: 234,
  location: "تهران، ولیعصر، خیابان شریعتی، پلاک ۱۲۳",
  phone: "۰۲۱-۸۸۱۲۳۴۵۶",
  instagram: "@golriz_salon",
  description: "سالن زیبایی گلریز با بیش از ۱۵ سال سابقه در ارائه خدمات آرایشی و زیبایی، یکی از معتبرترین سالن‌های تهران است. تیم حرفه‌ای ما با استفاده از بهترین محصولات و جدیدترین تکنیک‌ها، زیبایی شما را تضمین می‌کند.",
  workingHours: {
    saturday: "۹:۰۰ - ۲۱:۰۰",
    sunday: "۹:۰۰ - ۲۱:۰۰",
    monday: "۹:۰۰ - ۲۱:۰۰",
    tuesday: "۹:۰۰ - ۲۱:۰۰",
    wednesday: "۹:۰۰ - ۲۱:۰۰",
    thursday: "۹:۰۰ - ۲۱:۰۰",
    friday: "تعطیل",
  },
  amenities: ["پارکینگ", "وای‌فای رایگان", "پذیرایی", "اتاق خصوصی", "امکان پرداخت کارتی"],
  gender: "زنانه",
}

const services = [
  { id: 1, name: "کوتاهی مو", price: "۱۵۰,۰۰۰", duration: "۴۵ دقیقه", category: "مو" },
  { id: 2, name: "رنگ مو", price: "۳۵۰,۰۰۰", duration: "۹۰ دقیقه", category: "مو" },
  { id: 3, name: "هایلایت", price: "۴۵۰,۰۰۰", duration: "۱۲۰ دقیقه", category: "مو" },
  { id: 4, name: "کراتین مو", price: "۸۰۰,۰۰۰", duration: "۱۸۰ دقیقه", category: "مو" },
  { id: 5, name: "مانیکور", price: "۱۲۰,۰۰۰", duration: "۶۰ دقیقه", category: "ناخن" },
  { id: 6, name: "پدیکور", price: "۱۵۰,۰۰۰", duration: "۷۵ دقیقه", category: "ناخن" },
  { id: 7, name: "آرایش عروس", price: "۲,۵۰۰,۰۰۰", duration: "۱۸۰ دقیقه", category: "آرایش" },
  { id: 8, name: "میکاپ مجلسی", price: "۵۰۰,۰۰۰", duration: "۹۰ دقیقه", category: "آرایش" },
]

const stylists = [
  { id: 1, name: "سارا محمدی", role: "مدیر سالن و آرایشگر ارشد", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop", rating: 4.9 },
  { id: 2, name: "مریم احمدی", role: "متخصص رنگ و هایلایت", image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop", rating: 4.8 },
  { id: 3, name: "نازنین رضایی", role: "متخصص کراتین و صافی", image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop", rating: 4.7 },
]

const reviews = [
  { id: 1, user: "فاطمه ک.", rating: 5, date: "۲ روز پیش", comment: "واقعا عالی بود! رنگ موهام دقیقا همون چیزی شد که می‌خواستم. حتما دوباره میام." },
  { id: 2, user: "زهرا م.", rating: 5, date: "۱ هفته پیش", comment: "خدمات فوق‌العاده و پرسنل بسیار حرفه‌ای. قیمت‌ها هم مناسب هستند." },
  { id: 3, user: "مینا ت.", rating: 4, date: "۲ هفته پیش", comment: "کراتین موهام خیلی خوب شد، فقط کاش زمان انتظار کمتر بود." },
]

const portfolio = [
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&h=400&fit=crop",
]

const timeSlots = [
  "۰۹:۰۰", "۰۹:۳۰", "۱۰:۰۰", "۱۰:۳۰", "۱۱:۰۰", "۱۱:۳۰",
  "۱۴:۰۰", "۱۴:۳۰", "۱۵:۰۰", "۱۵:۳۰", "۱۶:۰۰", "۱۶:۳۰",
  "۱۷:۰۰", "۱۷:۳۰", "۱۸:۰۰", "۱۸:۳۰", "۱۹:۰۰", "۱۹:۳۰",
]

export default function SalonDetailPage() {
  const [currentImage, setCurrentImage] = useState(0)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [selectedService, setSelectedService] = useState<number | null>(null)
  const [selectedStylist, setSelectedStylist] = useState<number | null>(null)
  const [isLiked, setIsLiked] = useState(false)

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % salon.images.length)
  }

  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + salon.images.length) % salon.images.length)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Image Gallery */}
        <section className="relative">
          <div className="relative aspect-[21/9] overflow-hidden bg-muted">
            <img 
              src={salon.images[currentImage]} 
              alt={salon.name}
              className="h-full w-full object-cover"
            />
            <button 
              onClick={prevImage}
              className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 backdrop-blur transition-colors hover:bg-background"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
            <button 
              onClick={nextImage}
              className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 backdrop-blur transition-colors hover:bg-background"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
              {salon.images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImage(index)}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    index === currentImage ? "bg-white" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col gap-8 lg:flex-row">
            {/* Main Content */}
            <div className="flex-1">
              {/* Salon Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-accent/10 px-3 py-1 text-sm font-medium text-accent">
                      {salon.gender}
                    </span>
                  </div>
                  <h1 className="mt-2 text-3xl font-bold">{salon.name}</h1>
                  <div className="mt-2 flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                      <span className="font-medium">{salon.rating}</span>
                      <span className="text-muted-foreground">({salon.reviews} نظر)</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {salon.location}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => setIsLiked(!isLiked)}
                  >
                    <Heart className={`h-5 w-5 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="services" className="mt-8">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="services">خدمات</TabsTrigger>
                  <TabsTrigger value="about">درباره سالن</TabsTrigger>
                  <TabsTrigger value="portfolio">نمونه‌کار</TabsTrigger>
                  <TabsTrigger value="reviews">نظرات</TabsTrigger>
                </TabsList>

                <TabsContent value="services" className="mt-6">
                  <div className="space-y-4">
                    {services.map((service) => (
                      <div 
                        key={service.id}
                        className={`flex items-center justify-between rounded-xl border p-4 transition-colors ${
                          selectedService === service.id 
                            ? "border-accent bg-accent/5" 
                            : "border-border hover:border-accent/50"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => setSelectedService(
                              selectedService === service.id ? null : service.id
                            )}
                            className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
                              selectedService === service.id
                                ? "border-accent bg-accent text-white"
                                : "border-border"
                            }`}
                          >
                            {selectedService === service.id && <Check className="h-4 w-4" />}
                          </button>
                          <div>
                            <h3 className="font-medium">{service.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {service.duration}
                            </p>
                          </div>
                        </div>
                        <div className="text-left">
                          <span className="font-semibold">{service.price}</span>
                          <span className="text-sm text-muted-foreground"> تومان</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="about" className="mt-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="mb-2 font-semibold">معرفی</h3>
                      <p className="leading-relaxed text-muted-foreground">{salon.description}</p>
                    </div>

                    <div>
                      <h3 className="mb-3 font-semibold">تیم آرایشگران</h3>
                      <div className="grid gap-4 md:grid-cols-3">
                        {stylists.map((stylist) => (
                          <div 
                            key={stylist.id}
                            className={`rounded-xl border p-4 text-center transition-colors ${
                              selectedStylist === stylist.id
                                ? "border-accent bg-accent/5"
                                : "border-border hover:border-accent/50"
                            }`}
                            onClick={() => setSelectedStylist(
                              selectedStylist === stylist.id ? null : stylist.id
                            )}
                          >
                            <img 
                              src={stylist.image} 
                              alt={stylist.name}
                              className="mx-auto h-20 w-20 rounded-full object-cover"
                            />
                            <h4 className="mt-3 font-medium">{stylist.name}</h4>
                            <p className="text-sm text-muted-foreground">{stylist.role}</p>
                            <div className="mt-2 flex items-center justify-center gap-1">
                              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                              <span className="text-sm">{stylist.rating}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="mb-3 font-semibold">ساعات کاری</h3>
                      <div className="rounded-xl border border-border p-4">
                        <div className="grid gap-2">
                          {Object.entries(salon.workingHours).map(([day, hours]) => (
                            <div key={day} className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                {day === "saturday" && "شنبه"}
                                {day === "sunday" && "یکشنبه"}
                                {day === "monday" && "دوشنبه"}
                                {day === "tuesday" && "سه‌شنبه"}
                                {day === "wednesday" && "چهارشنبه"}
                                {day === "thursday" && "پنج‌شنبه"}
                                {day === "friday" && "جمعه"}
                              </span>
                              <span className={hours === "تعطیل" ? "text-red-500" : ""}>
                                {hours}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="mb-3 font-semibold">امکانات</h3>
                      <div className="flex flex-wrap gap-2">
                        {salon.amenities.map((amenity) => (
                          <span 
                            key={amenity}
                            className="rounded-full bg-secondary px-3 py-1 text-sm"
                          >
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="portfolio" className="mt-6">
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                    {portfolio.map((image, index) => (
                      <div key={index} className="aspect-square overflow-hidden rounded-xl">
                        <img 
                          src={image} 
                          alt={`نمونه‌کار ${index + 1}`}
                          className="h-full w-full object-cover transition-transform hover:scale-105"
                        />
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="reviews" className="mt-6">
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="rounded-xl border border-border p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                              <span className="font-medium">{review.user[0]}</span>
                            </div>
                            <div>
                              <h4 className="font-medium">{review.user}</h4>
                              <p className="text-xs text-muted-foreground">{review.date}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating 
                                    ? "fill-amber-400 text-amber-400" 
                                    : "text-muted"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                          {review.comment}
                        </p>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Booking Sidebar */}
            <aside className="w-full shrink-0 lg:w-96">
              <div className="sticky top-24 rounded-2xl border border-border bg-card p-6">
                <h2 className="text-xl font-semibold">رزرو نوبت</h2>
                
                <div className="mt-4">
                  <h3 className="mb-2 text-sm font-medium">انتخاب تاریخ</h3>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-xl border"
                  />
                </div>

                <div className="mt-4">
                  <h3 className="mb-2 text-sm font-medium">انتخاب ساعت</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {timeSlots.map((time) => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                          selectedTime === time
                            ? "border-accent bg-accent text-white"
                            : "border-border hover:border-accent"
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedService && (
                  <div className="mt-4 rounded-xl bg-secondary/50 p-4">
                    <div className="flex justify-between text-sm">
                      <span>خدمت انتخابی:</span>
                      <span className="font-medium">
                        {services.find(s => s.id === selectedService)?.name}
                      </span>
                    </div>
                    <div className="mt-2 flex justify-between text-sm">
                      <span>هزینه:</span>
                      <span className="font-medium">
                        {services.find(s => s.id === selectedService)?.price} تومان
                      </span>
                    </div>
                  </div>
                )}

                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      className="mt-6 w-full" 
                      size="lg"
                      disabled={!selectedService || !selectedTime}
                    >
                      تایید و رزرو نوبت
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>تایید رزرو</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="rounded-xl bg-secondary/50 p-4">
                        <h4 className="font-medium">{salon.name}</h4>
                        <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                          <p>خدمت: {services.find(s => s.id === selectedService)?.name}</p>
                          <p>تاریخ: {selectedDate?.toLocaleDateString("fa-IR")}</p>
                          <p>ساعت: {selectedTime}</p>
                          {selectedStylist && (
                            <p>آرایشگر: {stylists.find(s => s.id === selectedStylist)?.name}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between border-t border-border pt-4">
                        <span>مبلغ قابل پرداخت:</span>
                        <span className="font-semibold">
                          {services.find(s => s.id === selectedService)?.price} تومان
                        </span>
                      </div>
                      <Button className="w-full" size="lg">
                        پرداخت و تایید نهایی
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <div className="mt-6 space-y-3 border-t border-border pt-6">
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <span dir="ltr">{salon.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Instagram className="h-5 w-5 text-muted-foreground" />
                    <span>{salon.instagram}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <span>{salon.location}</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
