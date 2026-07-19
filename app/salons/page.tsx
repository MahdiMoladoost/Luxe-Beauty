"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}

function MapPinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function StarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

function SlidersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="4" x2="4" y1="21" y2="14" />
      <line x1="4" x2="4" y1="10" y2="3" />
      <line x1="12" x2="12" y1="21" y2="12" />
      <line x1="12" x2="12" y1="8" y2="3" />
      <line x1="20" x2="20" y1="21" y2="16" />
      <line x1="20" x2="20" y1="12" y2="3" />
      <line x1="2" x2="6" y1="14" y2="14" />
      <line x1="10" x2="14" y1="8" y2="8" />
      <line x1="18" x2="22" y1="16" y2="16" />
    </svg>
  )
}

function ShieldCheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

function GridIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
    </svg>
  )
}

function ListIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="8" x2="21" y1="6" y2="6" />
      <line x1="8" x2="21" y1="12" y2="12" />
      <line x1="8" x2="21" y1="18" y2="18" />
      <line x1="3" x2="3.01" y1="6" y2="6" />
      <line x1="3" x2="3.01" y1="12" y2="12" />
      <line x1="3" x2="3.01" y1="18" y2="18" />
    </svg>
  )
}

function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}

function ChevronLeftIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

function ChevronRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

const salons = [
  {
    id: 1,
    name: "سالن زیبایی گلریز",
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop",
    rating: 4.9,
    reviews: 234,
    location: "تهران، ولیعصر",
    distance: "2.5 کیلومتر",
    services: ["کوتاهی مو", "رنگ مو", "آرایش عروس"],
    priceRange: "متوسط",
    minPrice: 150000,
    isOpen: true,
    gender: "زنانه",
    isVerified: true,
  },
  {
    id: 2,
    name: "آرایشگاه مدرن استایل",
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=300&fit=crop",
    rating: 4.8,
    reviews: 189,
    location: "تهران، سعادت آباد",
    distance: "4.2 کیلومتر",
    services: ["اصلاح صورت", "کوتاهی مو", "مراقبت پوست"],
    priceRange: "اقتصادی",
    minPrice: 80000,
    isOpen: true,
    gender: "مردانه",
    isVerified: true,
  },
  {
    id: 3,
    name: "سالن آرایش رز",
    image: "https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?w=400&h=300&fit=crop",
    rating: 4.7,
    reviews: 156,
    location: "تهران، شریعتی",
    distance: "3.8 کیلومتر",
    services: ["مانیکور", "پدیکور", "کراتین مو"],
    priceRange: "لوکس",
    minPrice: 350000,
    isOpen: false,
    gender: "زنانه",
    isVerified: false,
  },
  {
    id: 4,
    name: "بیوتی سنتر پرستیژ",
    image: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=400&h=300&fit=crop",
    rating: 4.9,
    reviews: 312,
    location: "تهران، جردن",
    distance: "5.1 کیلومتر",
    services: ["میکاپ", "شینیون", "اکستنشن مژه"],
    priceRange: "لوکس",
    minPrice: 400000,
    isOpen: true,
    gender: "زنانه",
    isVerified: true,
  },
  {
    id: 5,
    name: "آرایشگاه ژانتی",
    image: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=400&h=300&fit=crop",
    rating: 4.6,
    reviews: 98,
    location: "تهران، تجریش",
    distance: "6.3 کیلومتر",
    services: ["کوتاهی مو", "رنگ مو", "بافت مو"],
    priceRange: "متوسط",
    minPrice: 180000,
    isOpen: true,
    gender: "زنانه",
    isVerified: true,
  },
  {
    id: 6,
    name: "باربر شاپ کلاسیک",
    image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&h=300&fit=crop",
    rating: 4.8,
    reviews: 267,
    location: "تهران، ونک",
    distance: "3.5 کیلومتر",
    services: ["اصلاح صورت", "کوتاهی مو", "ماساژ صورت"],
    priceRange: "متوسط",
    minPrice: 120000,
    isOpen: true,
    gender: "مردانه",
    isVerified: true,
  },
  {
    id: 7,
    name: "سالن زیبایی نگین",
    image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&h=300&fit=crop",
    rating: 4.5,
    reviews: 145,
    location: "تهران، پاسداران",
    distance: "4.8 کیلومتر",
    services: ["آرایش عروس", "شینیون", "میکاپ"],
    priceRange: "لوکس",
    minPrice: 500000,
    isOpen: true,
    gender: "زنانه",
    isVerified: true,
  },
  {
    id: 8,
    name: "استودیو مو آرمان",
    image: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=400&h=300&fit=crop",
    rating: 4.7,
    reviews: 178,
    location: "تهران، الهیه",
    distance: "5.5 کیلومتر",
    services: ["کوتاهی مو", "اصلاح صورت", "رنگ مو"],
    priceRange: "متوسط",
    minPrice: 150000,
    isOpen: true,
    gender: "مردانه",
    isVerified: false,
  },
]

const serviceCategories = [
  "کوتاهی مو",
  "رنگ و هایلایت",
  "آرایش عروس",
  "مانیکور و پدیکور",
  "اصلاح صورت",
  "مراقبت پوست",
  "کراتین و صافی",
  "اکستنشن مژه",
]

function formatPrice(price: number) {
  return new Intl.NumberFormat('fa-IR').format(price)
}

export default function SalonsPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showFilters, setShowFilters] = useState(false)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      
      <main className="flex-1 pt-16">
        {/* Search Header */}
        <section className="border-b border-border bg-card">
          <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <div className="flex flex-1 items-center gap-3 rounded-xl border border-border bg-background px-4 py-2.5">
                <SearchIcon className="h-5 w-5 text-muted-foreground shrink-0" />
                <Input 
                  type="text" 
                  placeholder="نام سالن یا نوع خدمت..." 
                  className="border-0 bg-transparent p-0 focus-visible:ring-0"
                />
              </div>
              <div className="flex flex-1 items-center gap-3 rounded-xl border border-border bg-background px-4 py-2.5">
                <MapPinIcon className="h-5 w-5 text-muted-foreground shrink-0" />
                <Input 
                  type="text" 
                  placeholder="تهران" 
                  className="border-0 bg-transparent p-0 focus-visible:ring-0"
                  defaultValue="تهران"
                />
              </div>
              <Button className="shrink-0 px-8">
                جستجو
              </Button>
            </div>

            {/* Active Filters */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">فیلترهای فعال:</span>
              <button className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs text-primary hover:bg-primary/20">
                زنانه
                <XIcon className="h-3 w-3" />
              </button>
              <button className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs text-primary hover:bg-primary/20">
                امتیاز 4+
                <XIcon className="h-3 w-3" />
              </button>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
          <div className="flex flex-col gap-8 lg:flex-row">
            {/* Filters Sidebar - Desktop */}
            <aside className="hidden w-72 shrink-0 lg:block">
              <div className="sticky top-24 rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center justify-between">
                  <h2 className="flex items-center gap-2 font-semibold text-foreground">
                    <SlidersIcon />
                    فیلترها
                  </h2>
                  <Button variant="ghost" size="sm" className="text-primary text-xs h-auto py-1">
                    پاک کردن همه
                  </Button>
                </div>

                {/* Gender Filter */}
                <div className="mt-6 border-t border-border pt-6">
                  <h3 className="mb-4 text-sm font-medium text-foreground">نوع سالن</h3>
                  <div className="space-y-3">
                    {["زنانه", "مردانه", "یونیسکس"].map((item) => (
                      <label key={item} className="flex items-center gap-3 cursor-pointer">
                        <Checkbox id={item} />
                        <span className="text-sm text-muted-foreground">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Services Filter */}
                <div className="mt-6 border-t border-border pt-6">
                  <h3 className="mb-4 text-sm font-medium text-foreground">خدمات</h3>
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {serviceCategories.map((service) => (
                      <label key={service} className="flex items-center gap-3 cursor-pointer">
                        <Checkbox id={service} />
                        <span className="text-sm text-muted-foreground">{service}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Range Filter */}
                <div className="mt-6 border-t border-border pt-6">
                  <h3 className="mb-4 text-sm font-medium text-foreground">محدوده قیمت</h3>
                  <div className="space-y-3">
                    {["اقتصادی", "متوسط", "لوکس"].map((item) => (
                      <label key={item} className="flex items-center gap-3 cursor-pointer">
                        <Checkbox id={item} />
                        <span className="text-sm text-muted-foreground">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Rating Filter */}
                <div className="mt-6 border-t border-border pt-6">
                  <h3 className="mb-4 text-sm font-medium text-foreground">حداقل امتیاز</h3>
                  <Select defaultValue="4">
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="انتخاب کنید" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 ستاره و بالاتر</SelectItem>
                      <SelectItem value="4">4 ستاره و بالاتر</SelectItem>
                      <SelectItem value="4.5">4.5 ستاره و بالاتر</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Additional Filters */}
                <div className="mt-6 border-t border-border pt-6 space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <Checkbox id="open-now" />
                    <span className="text-sm text-muted-foreground">فقط سالن‌های باز</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <Checkbox id="verified" />
                    <span className="text-sm text-muted-foreground">فقط تایید شده</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <Checkbox id="instant-booking" />
                    <span className="text-sm text-muted-foreground">رزرو آنی</span>
                  </label>
                </div>
              </div>
            </aside>

            {/* Mobile Filter Button */}
            <div className="lg:hidden">
              <Button 
                variant="outline" 
                className="w-full justify-center gap-2"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersIcon />
                فیلترها
              </Button>
            </div>

            {/* Results */}
            <div className="flex-1">
              {/* Results Header */}
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">آرایشگاه‌های تهران</h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    1,234 آرایشگاه یافت شد
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center rounded-lg border border-border bg-card p-1">
                    <button 
                      className={`rounded-md p-2 transition-colors ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                      onClick={() => setViewMode("grid")}
                    >
                      <GridIcon />
                    </button>
                    <button 
                      className={`rounded-md p-2 transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                      onClick={() => setViewMode("list")}
                    >
                      <ListIcon />
                    </button>
                  </div>
                  <Select defaultValue="rating">
                    <SelectTrigger className="w-44 bg-card">
                      <SelectValue placeholder="مرتب‌سازی" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rating">بالاترین امتیاز</SelectItem>
                      <SelectItem value="reviews">بیشترین نظر</SelectItem>
                      <SelectItem value="distance">نزدیک‌ترین</SelectItem>
                      <SelectItem value="price-low">ارزان‌ترین</SelectItem>
                      <SelectItem value="price-high">گران‌ترین</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Salon Cards */}
              <div className={`grid gap-6 ${viewMode === "grid" ? "md:grid-cols-2" : "grid-cols-1"}`}>
                {salons.map((salon) => (
                  <Link 
                    key={salon.id} 
                    href={`/salons/${salon.id}`}
                    className={`group overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 ${viewMode === "list" ? "flex" : ""}`}
                  >
                    <div className={`relative overflow-hidden ${viewMode === "list" ? "w-48 shrink-0" : "aspect-[16/10]"}`}>
                      <img 
                        src={salon.image} 
                        alt={salon.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute left-3 top-3 flex items-center gap-2">
                        {salon.isOpen ? (
                          <span className="rounded-full bg-accent px-2 py-1 text-[10px] font-medium text-accent-foreground">
                            باز است
                          </span>
                        ) : (
                          <span className="rounded-full bg-destructive px-2 py-1 text-[10px] font-medium text-destructive-foreground">
                            بسته
                          </span>
                        )}
                      </div>
                      {salon.isVerified && (
                        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-card/90 backdrop-blur px-2 py-1">
                          <ShieldCheckIcon className="text-accent" />
                          <span className="text-[10px] font-medium">تایید شده</span>
                        </div>
                      )}
                    </div>
                    <div className={`p-4 ${viewMode === "list" ? "flex-1" : ""}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">{salon.name}</h3>
                          <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPinIcon className="h-3.5 w-3.5" />
                            <span>{salon.location}</span>
                            <span className="mx-1 text-border">|</span>
                            <span>{salon.distance}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 rounded-lg bg-secondary px-2.5 py-1.5">
                          <StarIcon className="text-amber-500" />
                          <span className="text-sm font-semibold text-foreground">{salon.rating}</span>
                          <span className="text-xs text-muted-foreground">({salon.reviews})</span>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {salon.services.map((service) => (
                          <span 
                            key={service}
                            className="rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground"
                          >
                            {service}
                          </span>
                        ))}
                        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary">
                          {salon.gender}
                        </span>
                      </div>
                      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                        <div className="text-sm">
                          <span className="text-muted-foreground">شروع از </span>
                          <span className="font-semibold text-foreground">{formatPrice(salon.minPrice)}</span>
                          <span className="text-muted-foreground"> تومان</span>
                        </div>
                        <Button size="sm" className="h-9">
                          رزرو نوبت
                        </Button>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              <div className="mt-10 flex items-center justify-center gap-1">
                <Button variant="outline" size="sm" className="gap-1" disabled>
                  <ChevronRightIcon />
                  قبلی
                </Button>
                <div className="flex items-center gap-1 mx-2">
                  <Button variant="outline" size="sm" className="w-9 h-9 bg-primary text-primary-foreground hover:bg-primary/90">
                    1
                  </Button>
                  <Button variant="outline" size="sm" className="w-9 h-9">
                    2
                  </Button>
                  <Button variant="outline" size="sm" className="w-9 h-9">
                    3
                  </Button>
                  <span className="px-2 text-muted-foreground">...</span>
                  <Button variant="outline" size="sm" className="w-9 h-9">
                    12
                  </Button>
                </div>
                <Button variant="outline" size="sm" className="gap-1">
                  بعدی
                  <ChevronLeftIcon />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
