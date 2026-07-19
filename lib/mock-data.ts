import type { BeautyService, City, Salon, ServiceCategory, StaffMember, TimeSlot } from "@/lib/domain"

export const cities: City[] = [
  { id: "tehran", name: "تهران", slug: "tehran", areas: ["زعفرانیه", "سعادت‌آباد", "تهرانپارس", "پاسداران", "ونک"] },
  { id: "karaj", name: "کرج", slug: "karaj", areas: ["عظیمیه", "مهرشهر", "جهانشهر", "گوهردشت"] },
  { id: "mashhad", name: "مشهد", slug: "mashhad", areas: ["سجاد", "احمدآباد", "الهیه", "قاسم‌آباد"] },
  { id: "isfahan", name: "اصفهان", slug: "isfahan", areas: ["مرداویج", "جلفا", "خانه اصفهان", "شیخ صدوق"] },
  { id: "shiraz", name: "شیراز", slug: "shiraz", areas: ["معالی‌آباد", "فرهنگ‌شهر", "قدوسی", "قصردشت"] },
]

export const serviceCategories: ServiceCategory[] = [
  { id: "hair", name: "آرایش مو", slug: "hair", description: "کوتاهی، براشینگ و حالت‌دهی", icon: "✂️" },
  { id: "color", name: "رنگ و مش", slug: "hair-color", description: "رنگ، لایت، بالیاژ و احیا", icon: "🎨" },
  { id: "nails", name: "ناخن", slug: "nails", description: "مانیکور، پدیکور و کاشت", icon: "💅" },
  { id: "brows", name: "ابرو و مژه", slug: "brows-lashes", description: "اصلاح، لیفت و اکستنشن", icon: "✨" },
  { id: "skin", name: "پوست و پاکسازی", slug: "skin-care", description: "فیشیال، پاکسازی و آبرسانی", icon: "🫧" },
  { id: "makeup", name: "میکاپ", slug: "makeup", description: "میکاپ روز، شب و تخصصی", icon: "💄" },
  { id: "spa", name: "ماساژ و اسپا", slug: "spa", description: "ریلکسی، درمانی و اسپا", icon: "🌿" },
  { id: "bridal", name: "خدمات عروس", slug: "bridal", description: "پکیج کامل عروس و همراه", icon: "👰" },
  { id: "men", name: "خدمات آقایان", slug: "men", description: "کوتاهی، اصلاح و مراقبت", icon: "🧔" },
  { id: "kids", name: "خدمات کودک", slug: "kids", description: "خدمات ایمن و مناسب کودک", icon: "🧒" },
]

export const salons: Salon[] = [
  {
    id: "salon-luxe",
    slug: "luxe-beauty",
    name: "سالن زیبایی لوکس",
    city: "تهران",
    area: "سعادت‌آباد",
    address: "سعادت‌آباد، بلوار دریا، پلاک ۱۲۸",
    rating: 4.9,
    reviewCount: 368,
    successfulBookings: 4821,
    verified: true,
    isOpen: true,
    closesAt: "21:00",
    minPrice: 280000,
    tags: ["محبوب", "تایید شده", "پذیرش فوری"],
    amenities: ["پارکینگ", "اتاق VIP", "پرداخت آنلاین", "وای‌فای", "پذیرایی"],
    phone: "021-22334455",
    latitude: 35.7702,
    longitude: 51.3541,
    coverImage: "/placeholder.jpg",
    description: "مجموعه تخصصی زیبایی با تیم حرفه‌ای، مواد معتبر و استانداردهای سخت‌گیرانه بهداشتی.",
  },
  {
    id: "salon-rose",
    slug: "rose-studio",
    name: "استودیو رز",
    city: "تهران",
    area: "پاسداران",
    address: "پاسداران، خیابان گلستان پنجم، پلاک ۴۲",
    rating: 4.8,
    reviewCount: 241,
    successfulBookings: 2912,
    verified: true,
    isOpen: true,
    closesAt: "20:30",
    minPrice: 220000,
    tags: ["تخفیف‌دار", "تایید شده"],
    amenities: ["اتاق VIP", "پرداخت آنلاین", "آسانسور"],
    phone: "021-22889900",
    coverImage: "/placeholder.jpg",
    description: "استودیو تخصصی ناخن، مژه و میکاپ با فضای آرام و رزرو دقیق زمانی.",
  },
  {
    id: "salon-moon",
    slug: "moon-skin",
    name: "مرکز پوست و زیبایی ماه",
    city: "کرج",
    area: "عظیمیه",
    address: "عظیمیه، میدان اسبی، مجتمع آریا",
    rating: 4.7,
    reviewCount: 156,
    successfulBookings: 1780,
    verified: true,
    isOpen: false,
    closesAt: "19:00",
    minPrice: 350000,
    tags: ["متخصص پوست", "تایید شده"],
    amenities: ["پارکینگ", "دسترسی آسان", "پرداخت آنلاین"],
    phone: "026-32556677",
    coverImage: "/placeholder.jpg",
    description: "خدمات تخصصی پوست، فیشیال و مراقبت زیبایی با ارزیابی اولیه و پرونده مشتری.",
  },
]

export const staffMembers: StaffMember[] = [
  {
    id: "staff-niloofar",
    salonId: "salon-luxe",
    fullName: "نیلوفر احمدی",
    title: "متخصص رنگ و لایت",
    specialties: ["بالیاژ", "رنگ مو", "کراتین"],
    rating: 4.9,
    successfulBookings: 1430,
    workDays: [0, 1, 2, 3, 4, 6],
  },
  {
    id: "staff-sara",
    salonId: "salon-luxe",
    fullName: "سارا محمدی",
    title: "متخصص ناخن",
    specialties: ["کاشت ناخن", "ژلیش", "مانیکور"],
    rating: 4.8,
    successfulBookings: 1180,
    workDays: [0, 1, 2, 4, 5, 6],
  },
  {
    id: "staff-elham",
    salonId: "salon-luxe",
    fullName: "الهام رضایی",
    title: "میکاپ آرتیست",
    specialties: ["میکاپ", "شینیون", "عروس"],
    rating: 4.9,
    successfulBookings: 980,
    workDays: [0, 2, 3, 4, 5, 6],
  },
  {
    id: "staff-yasaman",
    salonId: "salon-rose",
    fullName: "یاسمن کریمی",
    title: "لش و براو آرتیست",
    specialties: ["اکستنشن مژه", "لیفت ابرو", "لمینت"],
    rating: 4.8,
    successfulBookings: 730,
    workDays: [0, 1, 2, 3, 5, 6],
  },
]

export const services: BeautyService[] = [
  {
    id: "service-haircut",
    salonId: "salon-luxe",
    categoryId: "hair",
    name: "کوتاهی و براشینگ حرفه‌ای",
    description: "مشاوره فرم صورت، کوتاهی و براشینگ نهایی",
    durationMinutes: 60,
    price: 650000,
    depositAmount: 150000,
    audience: ["women"],
    onlineBookable: true,
    staffIds: ["staff-niloofar", "staff-elham"],
  },
  {
    id: "service-balayage",
    salonId: "salon-luxe",
    categoryId: "color",
    name: "بالیاژ و رنگ تخصصی",
    description: "قیمت نهایی پس از بررسی حجم و قد مو تعیین می‌شود",
    durationMinutes: 240,
    price: 4200000,
    discountPrice: 3650000,
    depositAmount: 800000,
    audience: ["women"],
    onlineBookable: true,
    requiresConsultation: true,
    staffIds: ["staff-niloofar"],
  },
  {
    id: "service-nails",
    salonId: "salon-luxe",
    categoryId: "nails",
    name: "کاشت ناخن با ژلیش",
    description: "کاشت استاندارد، مانیکور خشک و ژلیش",
    durationMinutes: 120,
    price: 1150000,
    discountPrice: 990000,
    depositAmount: 300000,
    audience: ["women"],
    onlineBookable: true,
    staffIds: ["staff-sara"],
  },
  {
    id: "service-facial",
    salonId: "salon-luxe",
    categoryId: "skin",
    name: "فیشیال و آبرسانی پوست",
    description: "پاکسازی چندمرحله‌ای متناسب با نوع پوست",
    durationMinutes: 90,
    price: 1350000,
    depositAmount: 350000,
    audience: ["women", "men"],
    onlineBookable: true,
    staffIds: ["staff-elham"],
  },
  {
    id: "service-makeup",
    salonId: "salon-luxe",
    categoryId: "makeup",
    name: "میکاپ حرفه‌ای مهمانی",
    description: "میکاپ ماندگار با انتخاب سبک متناسب با چهره",
    durationMinutes: 90,
    price: 2200000,
    depositAmount: 600000,
    audience: ["women"],
    onlineBookable: true,
    staffIds: ["staff-elham"],
  },
  {
    id: "service-lash",
    salonId: "salon-rose",
    categoryId: "brows",
    name: "اکستنشن مژه کلاسیک",
    description: "طراحی فرم چشم و اجرای کلاسیک سبک",
    durationMinutes: 120,
    price: 1250000,
    depositAmount: 350000,
    audience: ["women"],
    onlineBookable: true,
    staffIds: ["staff-yasaman"],
  },
]

export const offers = [
  { id: "offer-1", serviceId: "service-balayage", salonId: "salon-luxe", title: "بالیاژ تابستانی", percent: 13, expiresAt: "2026-08-10" },
  { id: "offer-2", serviceId: "service-nails", salonId: "salon-luxe", title: "پکیج ناخن", percent: 14, expiresAt: "2026-08-01" },
  { id: "offer-3", serviceId: "service-lash", salonId: "salon-rose", title: "اکستنشن اولین رزرو", percent: 10, expiresAt: "2026-09-01" },
]

export const blogPosts = [
  {
    slug: "hair-color-care",
    title: "۷ نکته برای ماندگاری بیشتر رنگ مو",
    excerpt: "مراقبت صحیح بعد از رنگ، هم درخشندگی مو را حفظ می‌کند و هم فاصله ترمیم را بیشتر می‌کند.",
    category: "مراقبت مو",
    readTime: "۶ دقیقه",
    publishedAt: "۱۴۰۵/۰۴/۱۸",
  },
  {
    slug: "choose-right-salon",
    title: "چطور سالن مناسب را انتخاب کنیم؟",
    excerpt: "از بررسی مجوز و نمونه‌کار تا کیفیت نظرات و شفافیت قیمت، این چک‌لیست تصمیم را ساده می‌کند.",
    category: "راهنمای رزرو",
    readTime: "۸ دقیقه",
    publishedAt: "۱۴۰۵/۰۴/۱۲",
  },
  {
    slug: "skin-routine-basics",
    title: "روتین پایه مراقبت پوست برای شروع",
    excerpt: "یک روتین ساده و پایدار معمولاً از چندین محصول پراکنده نتیجه بهتری می‌دهد.",
    category: "مراقبت پوست",
    readTime: "۵ دقیقه",
    publishedAt: "۱۴۰۵/۰۴/۰۵",
  },
]

export const frequentlyAskedQuestions = [
  { question: "آیا رزرو نوبت برای مشتری هزینه جداگانه دارد؟", answer: "خیر. هزینه استفاده مشتری از سامانه صفر است و فقط مبلغ خدمت یا بیعانه اعلام‌شده پرداخت می‌شود." },
  { question: "بیعانه چگونه محاسبه می‌شود؟", answer: "مبلغ بیعانه توسط سالن برای هر خدمت تعیین می‌شود و قیمت نهایی همیشه در سرور دوباره محاسبه خواهد شد." },
  { question: "چطور نوبت را لغو یا جابه‌جا کنم؟", answer: "از بخش نوبت‌های من، جزئیات رزرو را باز کنید. امکان لغو یا جابه‌جایی مطابق قوانین همان سالن نمایش داده می‌شود." },
  { question: "آیا می‌توانم آرایشگر مشخصی انتخاب کنم؟", answer: "بله. برای خدماتی که چند ارائه‌دهنده دارند، می‌توانید فرد مشخص یا گزینه هر آرایشگر موجود را انتخاب کنید." },
  { question: "چطور از کیفیت سالن مطمئن شوم؟", answer: "نشان تایید، نظرات رزروهای واقعی، امتیاز معیارها، نمونه‌کار و سابقه رزرو موفق در صفحه هر سالن نمایش داده می‌شود." },
  { question: "اگر پرداخت ناموفق باشد اسلات از دست می‌رود؟", answer: "اسلات برای مدت محدود نگه داشته می‌شود. اگر پرداخت در زمان Hold کامل نشود، اسلات به‌صورت خودکار آزاد خواهد شد." },
]

export function getSalonById(id: string) {
  return salons.find((salon) => salon.id === id || salon.slug === id)
}

export function getServicesForSalon(salonId: string) {
  return services.filter((service) => service.salonId === salonId)
}

export function getStaffForSalon(salonId: string) {
  return staffMembers.filter((staff) => staff.salonId === salonId)
}

export function getCompatibleStaff(serviceIds: string[], salonId: string) {
  const selected = services.filter((service) => service.salonId === salonId && serviceIds.includes(service.id))
  if (selected.length === 0) return getStaffForSalon(salonId)

  return getStaffForSalon(salonId).filter((staff) => selected.every((service) => service.staffIds.includes(staff.id)))
}

export function createDailySlots(salonId: string, staffId: string, date: string): TimeSlot[] {
  const starts = ["09:00", "10:30", "12:00", "14:00", "15:30", "17:00", "18:30"]
  return starts.map((startTime, index) => {
    const [hour, minute] = startTime.split(":").map(Number)
    const end = new Date(2000, 0, 1, hour, minute + 90)
    const endTime = `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`
    return {
      id: `${salonId}-${staffId}-${date}-${index}`,
      salonId,
      staffId,
      date,
      startTime,
      endTime,
      available: true,
    }
  })
}
