"use client"

import Link from "next/link"
import { useEffect, useMemo, useState, type ReactNode } from "react"
import {
  ArrowLeft,
  ArrowUp,
  BadgePercent,
  Banknote,
  BookOpenText,
  Building2,
  CalendarCheck2,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Crown,
  Gift,
  Headphones,
  Heart,
  Home,
  House,
  LocateFixed,
  Map,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  RefreshCw,
  Scissors,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  TicketCheck,
  UserRoundCheck,
  UsersRound,
  WalletCards,
} from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

type LocationState = "idle" | "loading" | "ready" | "error"

const trustItems = [
  { icon: UserRoundCheck, title: "احراز هویت ارائه‌دهندگان", description: "نمایش نشان‌های تأیید فقط پس از بررسی اطلاعات و مدارک." },
  { icon: Banknote, title: "قیمت شفاف", description: "قیمت و شرایط مهم باید پیش از نهایی‌شدن رزرو نمایش داده شوند." },
  { icon: TicketCheck, title: "نظر پس از رزرو واقعی", description: "امکان ثبت نظر معتبر پس از تکمیل خدمت فراهم می‌شود." },
  { icon: CalendarCheck2, title: "رزرو بدون تماس", description: "انتخاب خدمت، متخصص و زمان از مسیر آنلاین انجام می‌شود." },
  { icon: WalletCards, title: "پرداخت منعطف", description: "پرداخت بیعانه، آنلاین یا حضوری براساس قوانین ارائه‌دهنده." },
  { icon: Headphones, title: "پشتیبانی اختلافات", description: "پیگیری رزرو، پرداخت و شکایت از مسیرهای رسمی پشتیبانی." },
]

const categoryGroups = [
  {
    title: "خدمات بانوان",
    eyebrow: "WOMEN",
    icon: Sparkles,
    href: "/salons?audience=women",
    services: ["کوتاهی و اصلاح مو", "رنگ، مش و لایت", "کراتین و احیای مو", "کاشت و طراحی ناخن", "میکاپ و عروس", "ابرو و مژه"],
  },
  {
    title: "خدمات آقایان",
    eyebrow: "MEN",
    icon: Scissors,
    href: "/salons?audience=men",
    services: ["کوتاهی مو", "اصلاح صورت", "خدمات ریش", "رنگ و کراتین", "گریم داماد", "پاک‌سازی غیرپزشکی"],
  },
  {
    title: "خدمات کودک",
    eyebrow: "KIDS",
    icon: Heart,
    href: "/salons?audience=kids",
    services: ["کوتاهی کودک", "اصلاح کودک", "خدمات مخصوص کودک", "محیط مناسب کودک"],
  },
  {
    title: "براساس محل ارائه",
    eyebrow: "LOCATION",
    icon: House,
    href: "/salons?delivery=all",
    services: ["در سالن", "در منزل مشتری", "در محل متخصص", "خدمات فوری"],
  },
]

const quickFilters = [
  { label: "همه", href: "/salons?availability=today" },
  { label: "بانوان", href: "/salons?availability=today&audience=women" },
  { label: "آقایان", href: "/salons?availability=today&audience=men" },
  { label: "کودکان", href: "/salons?availability=today&audience=kids" },
  { label: "در منزل", href: "/salons?availability=today&delivery=home" },
  { label: "رزرو فوری", href: "/salons?availability=today&instant=1" },
  { label: "تخفیف‌دار", href: "/salons?availability=today&discount=1" },
]

const cityServices = [
  { title: "کراتین در تهران", href: "/salons?service=کراتین مو&city=تهران" },
  { title: "کاشت ناخن در کرج", href: "/salons?service=کاشت ناخن&city=کرج" },
  { title: "میکاپ عروس در اصفهان", href: "/salons?service=میکاپ و شینیون&city=اصفهان" },
  { title: "کوتاهی مردانه در مشهد", href: "/salons?service=اصلاح مردانه&city=مشهد" },
  { title: "فیشیال در شیراز", href: "/salons?service=پاکسازی پوست&city=شیراز" },
  { title: "آرایشگاه کودک در تهران", href: "/salons?audience=kids&city=تهران" },
]

const activeCities = ["تهران", "کرج", "مشهد", "اصفهان", "شیراز", "تبریز", "قم", "اهواز", "رشت"]
const popularNeighborhoods = ["ولیعصر", "سعادت‌آباد", "جردن", "تجریش", "پاسداران", "ونک", "الهیه", "شریعتی"]

const bookingSteps = [
  { icon: Search, title: "انتخاب خدمت و موقعیت", description: "خدمت، شهر، محله و بازهٔ زمانی مناسب را انتخاب کنید." },
  { icon: UsersRound, title: "مقایسهٔ انتخاب‌ها", description: "قیمت، نشان‌های اعتماد، نمونه‌کار و زمان‌های خالی را بررسی کنید." },
  { icon: Clock3, title: "انتخاب نوبت", description: "متخصص، شعبه، محل ارائه و ساعت آزاد را مشخص کنید." },
  { icon: CheckCircle2, title: "تأیید یا پرداخت", description: "قوانین را ببینید، در صورت نیاز بیعانه را پرداخت کنید و تأیید بگیرید." },
]

const qualityItems = [
  "تأیید شماره موبایل و مالکیت آن",
  "بررسی هویت و مدارک ارائه‌دهندگان",
  "تأیید آدرس و مجوزهای ثبت‌شده",
  "نظر فقط پس از خدمت تکمیل‌شده",
  "بازبینی نمونه‌کار و امکان گزارش محتوا",
  "ثبت عملیات حساس و پیگیری تخلف",
  "حفاظت از اطلاعات و آدرس مشتری",
  "پشتیبانی اختلاف و بازپرداخت طبق قوانین",
]

const providerBenefits = [
  "صفحه اختصاصی و تقویم آنلاین",
  "مدیریت شعب، متخصصان و خدمات",
  "مدیریت قیمت و دریافت بیعانه",
  "پیامک یادآوری و کاهش عدم حضور",
  "نمونه‌کار، نظر واقعی و گزارش عملکرد",
  "تبلیغات، جایگاه ویژه و پشتیبانی",
]

const pwaFeatures = ["رزرو سریع", "اعلان و یادآوری نوبت", "رزرو مجدد", "علاقه‌مندی‌ها", "کیف پول و پیام‌ها", "دسترسی بهتر در اینترنت ضعیف"]

const magazineItems = [
  { title: "نکات مهم قبل از کراتین", category: "مراقبت مو" },
  { title: "تفاوت کاشت ژل و پودر", category: "ناخن" },
  { title: "راهنمای انتخاب سالن عروس", category: "عروس و داماد" },
  { title: "مراقبت بعد از رنگ مو", category: "رنگ مو" },
  { title: "مدل‌های محبوب موی مردانه", category: "خدمات مردانه" },
  { title: "قوانین بیعانه و لغو نوبت", category: "راهنمای رزرو" },
]

const faqItems = [
  { question: "چگونه نوبت بگیرم؟", answer: "خدمت، شهر و زمان را انتخاب کنید؛ سپس سالن یا متخصص را مقایسه و ساعت آزاد را برای تأیید رزرو انتخاب کنید." },
  { question: "آیا برای رزرو باید پرداخت کنم؟", answer: "نوع پرداخت به قوانین خدمت و ارائه‌دهنده بستگی دارد. مبلغ بیعانه یا امکان پرداخت حضوری باید پیش از تأیید نهایی نمایش داده شود." },
  { question: "چگونه نوبت را تغییر دهم یا لغو کنم؟", answer: "از بخش نوبت‌های من وارد جزئیات رزرو شوید. امکان تغییر یا لغو براساس بازه زمانی و قوانین همان رزرو نمایش داده می‌شود." },
  { question: "اگر سالن نوبت را لغو کند چه می‌شود؟", answer: "وضعیت رزرو به شما اعلام می‌شود و در صورت امکان نزدیک‌ترین زمان یا ارائه‌دهنده جایگزین پیشنهاد خواهد شد. بازپرداخت طبق قوانین انجام می‌شود." },
  { question: "نظرات کاربران واقعی هستند؟", answer: "نشان «رزرو تأییدشده» فقط برای نظری نمایش داده می‌شود که پس از تکمیل خدمت مرتبط ثبت شده باشد." },
  { question: "قیمت نهایی چگونه مشخص می‌شود؟", answer: "قیمت پایه، موارد افزوده، تخفیف و شرایط تغییر قیمت باید پیش از تأیید رزرو نمایش داده شوند. قیمت‌های فاقد منبع معتبر در صفحه اصلی نمایش داده نمی‌شوند." },
  { question: "خدمات در منزل چگونه انجام می‌شود؟", answer: "متخصص باید محدوده فعالیت تأییدشده داشته باشد. آدرس دقیق مشتری فقط پس از تأیید نهایی رزرو و به‌صورت محدود در دسترس قرار می‌گیرد." },
  { question: "چگونه شکایت ثبت کنم؟", answer: "از جزئیات رزرو یا مرکز پشتیبانی، تیکت مرتبط با همان نوبت ثبت کنید تا سوابق رزرو و پرداخت برای بررسی در دسترس تیم پشتیبانی باشد." },
]

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="mb-5 flex items-center justify-center gap-3 text-[#d7b27a]">
      <span className="h-px w-10 bg-gradient-to-r from-transparent to-[#d7b27a]" />
      <span className="text-[10px] font-semibold tracking-[0.32em] sm:text-xs">{children}</span>
      <span className="h-px w-10 bg-gradient-to-l from-transparent to-[#d7b27a]" />
    </div>
  )
}

function SectionHeading({ eyebrow, title, description, align = "center" }: { eyebrow: string; title: string; description: string; align?: "center" | "right" }) {
  return (
    <div className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl text-right"}>
      {align === "center" ? <Eyebrow>{eyebrow}</Eyebrow> : <p className="mb-4 text-[10px] font-semibold tracking-[0.32em] text-[#d7b27a] sm:text-xs">{eyebrow}</p>}
      <h2 className="font-serif text-3xl font-medium leading-tight text-[#fff1dc] md:text-5xl">{title}</h2>
      <p className="mt-4 text-sm leading-7 text-[#d9c5b7]/72 sm:text-base">{description}</p>
    </div>
  )
}

function EmptyState({ icon, title, description, actions }: { icon: ReactNode; title: string; description: string; actions: ReactNode }) {
  return (
    <div className="rounded-[30px] border border-[#dab780]/20 bg-[linear-gradient(145deg,rgba(255,255,255,0.085),rgba(255,255,255,0.025))] px-5 py-10 text-center shadow-[0_24px_70px_rgba(12,6,5,0.18),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl sm:px-8">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] border border-[#dab780]/25 bg-[#c39762]/12 text-[#edca92]">{icon}</div>
      <h3 className="mt-5 text-xl font-bold text-[#fff0dc]">{title}</h3>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[#d7c2b4]/70">{description}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">{actions}</div>
    </div>
  )
}

function PrimaryLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#e1bd7e,#a97436)] px-5 text-sm font-bold text-white shadow-[0_14px_34px_rgba(92,54,20,0.28)] transition hover:-translate-y-0.5 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f0d29f]">
      {children}
    </Link>
  )
}

function SecondaryLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#dfbd87]/30 bg-transparent px-5 text-sm font-bold text-[#efd3a3] transition hover:border-[#efd09b]/60 hover:bg-[#d2a768]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e2bf88]">
      {children}
    </Link>
  )
}

export function HomepageSections() {
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [locationState, setLocationState] = useState<LocationState>("idle")
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [showSupport, setShowSupport] = useState(false)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIos, setIsIos] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [personalizationEnabled, setPersonalizationEnabled] = useState(true)

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 720)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
    setIsStandalone(standalone)
    setIsIos(/iphone|ipad|ipod/i.test(navigator.userAgent))

    const onBeforeInstall = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstall)
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall)
  }, [])

  useEffect(() => {
    const saved = window.localStorage.getItem("luxe-beauty-personalization")
    if (saved === "off") setPersonalizationEnabled(false)
  }, [])

  const nearbyHref = useMemo(() => {
    if (!coords) return "/salons"
    return `/salons?lat=${coords.lat.toFixed(6)}&lng=${coords.lng.toFixed(6)}&sort=distance`
  }, [coords])

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationState("error")
      return
    }
    setLocationState("loading")
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude })
        setLocationState("ready")
      },
      () => setLocationState("error"),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    )
  }

  const togglePersonalization = () => {
    const next = !personalizationEnabled
    setPersonalizationEnabled(next)
    window.localStorage.setItem("luxe-beauty-personalization", next ? "on" : "off")
  }

  const installPwa = async () => {
    if (!installPrompt) return
    await installPrompt.prompt()
    await installPrompt.userChoice
    setInstallPrompt(null)
  }

  return (
    <div className="bg-[#211411] text-[#fff1dc]">
      <section aria-labelledby="trust-heading" className="relative -mt-[2px] bg-[#3b2722] pb-16 pt-5 sm:pb-20 sm:pt-8">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="sr-only" id="trust-heading">مزیت‌ها و نشان‌های اعتماد لوکس بیوتی</div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {trustItems.map((item) => {
              const Icon = item.icon
              return (
                <article key={item.title} className="rounded-[24px] border border-[#dfbd87]/18 bg-white/[0.055] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] backdrop-blur-lg">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#dfbd87]/20 bg-[#c39762]/12 text-[#edca92]">
                    <Icon className="h-5 w-5" strokeWidth={1.6} />
                  </div>
                  <h3 className="mt-4 text-sm font-bold text-[#fff0dc]">{item.title}</h3>
                  <p className="mt-2 text-xs leading-6 text-[#d8c3b5]/65">{item.description}</p>
                </article>
              )
            })}
          </div>
          <p className="mt-5 text-center text-xs leading-6 text-[#cdb8aa]/55">آمار عمومی فقط پس از اتصال به دیتابیس و رسیدن به حجم دادهٔ قابل اتکا نمایش داده خواهد شد.</p>
        </div>
      </section>

      <section aria-labelledby="categories-heading" className="relative overflow-hidden bg-[#2b1b17] py-20 sm:py-24">
        <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-[#bd8e57]/[0.07] blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
          <div id="categories-heading">
            <SectionHeading eyebrow="SERVICE CATEGORIES" title="دسته‌بندی خدمات" description="خدمت موردنظر را براساس مخاطب یا محل ارائه انتخاب کنید. تعداد ارائه‌دهنده، قیمت و اولین نوبت فقط پس از اتصال به دادهٔ واقعی نمایش داده می‌شود." />
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {categoryGroups.map((group, index) => {
              const Icon = group.icon
              return (
                <Link key={group.title} href={group.href} className="group relative overflow-hidden rounded-[30px] border border-[#d9b77f]/20 bg-[linear-gradient(150deg,rgba(255,255,255,0.10),rgba(255,255,255,0.025))] p-6 shadow-[0_24px_70px_rgba(12,6,5,0.20)] transition duration-500 hover:-translate-y-1.5 hover:border-[#e4c087]/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e3bf86]">
                  <span className="absolute left-5 top-4 font-serif text-xs tracking-[0.18em] text-[#cda86f]/35">{String(index + 1).padStart(2, "0")}</span>
                  <div className="flex h-14 w-14 items-center justify-center rounded-[20px] border border-[#d9b77f]/25 bg-[#c39762]/14 text-[#edcc96] transition group-hover:scale-105 group-hover:bg-[#c39762]/22">
                    <Icon className="h-6 w-6" strokeWidth={1.55} />
                  </div>
                  <p className="mt-5 text-[10px] font-semibold tracking-[0.28em] text-[#cda873]">{group.eyebrow}</p>
                  <h3 className="mt-2 text-xl font-bold text-[#fff1df]">{group.title}</h3>
                  <ul className="mt-5 space-y-2.5 text-sm text-[#d9c5b7]/70">
                    {group.services.map((service) => <li key={service} className="flex items-center gap-2"><span className="h-1 w-1 rounded-full bg-[#d8b274]" />{service}</li>)}
                  </ul>
                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#e8c98f]">مشاهده خدمات <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-1" /></span>
                </Link>
              )
            })}
          </div>
          <div className="mt-8 text-center"><SecondaryLink href="/salons">مشاهده همه خدمات <ArrowLeft className="h-4 w-4" /></SecondaryLink></div>
        </div>
      </section>

      <section aria-labelledby="today-heading" className="bg-[#3b2722] py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div id="today-heading"><SectionHeading eyebrow="AVAILABLE TODAY" title="نوبت‌های خالی امروز" description="این بخش فقط زمان‌هایی را نمایش می‌دهد که از سیستم نوبت‌دهی واقعی دریافت و در لحظه قابل رزرو باشند." /></div>
          <div className="mt-8 flex gap-2 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {quickFilters.map((filter) => <Link key={filter.label} href={filter.href} className="shrink-0 rounded-full border border-[#dfbd87]/22 bg-white/[0.055] px-4 py-2.5 text-xs font-bold text-[#e9d2b2] transition hover:border-[#e8c88e]/50 hover:bg-[#d0a366]/12">{filter.label}</Link>)}
          </div>
          <div className="mt-6">
            <EmptyState icon={<Clock3 className="h-7 w-7" strokeWidth={1.5} />} title="زمان قابل رزرو هنوز از منبع واقعی دریافت نشده است" description="برای جلوگیری از نمایش ساعت، قیمت یا ظرفیت ساختگی، پس از اتصال Availability واقعی، کارت‌های نوبت امروز به‌صورت خودکار در این قسمت نمایش داده می‌شوند." actions={<><PrimaryLink href="/salons?availability=tomorrow">مشاهده نوبت‌های فردا</PrimaryLink><SecondaryLink href="/salons">تغییر خدمت یا شهر</SecondaryLink></>} />
          </div>
        </div>
      </section>

      <section aria-labelledby="nearby-heading" className="relative overflow-hidden bg-[#261713] py-20 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8">
          <div id="nearby-heading"><SectionHeading align="right" eyebrow="NEAR YOU" title="نزدیک‌ترین سالن‌ها و متخصصان" description="موقعیت فقط با اجازهٔ شما دریافت می‌شود. آدرس دقیق متخصصان خانگی پیش از رزرو تأییدشده نمایش داده نخواهد شد." /></div>
          <div className="relative min-h-[390px] overflow-hidden rounded-[34px] border border-[#d8b57d]/22 bg-[radial-gradient(circle_at_30%_30%,rgba(211,169,108,0.16),transparent_38%),linear-gradient(145deg,#3c2923,#211512)] shadow-[0_30px_90px_rgba(10,5,4,0.34)]">
            <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(232,199,149,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(232,199,149,0.12)_1px,transparent_1px)] [background-size:44px_44px]" />
            <div className="absolute left-[22%] top-[28%] flex h-12 w-12 items-center justify-center rounded-full border border-[#f0d19d]/35 bg-[#2c1b17]/85 text-[#efcf98] shadow-xl backdrop-blur"><MapPin className="h-5 w-5" /></div>
            <div className="absolute right-[23%] top-[43%] flex h-12 w-12 items-center justify-center rounded-full border border-[#f0d19d]/35 bg-[#2c1b17]/85 text-[#efcf98] shadow-xl backdrop-blur"><Scissors className="h-5 w-5" /></div>
            <div className="absolute bottom-[22%] left-[45%] flex h-14 w-14 items-center justify-center rounded-full border border-[#f0d19d]/45 bg-[linear-gradient(135deg,#d6ae70,#9b6831)] text-white shadow-2xl"><LocateFixed className="h-6 w-6" /></div>
            <div className="absolute inset-x-4 bottom-4 rounded-[24px] border border-white/10 bg-[#241613]/80 p-5 backdrop-blur-xl sm:inset-x-6 sm:bottom-6">
              <div aria-live="polite">
                {locationState === "idle" && <><h3 className="font-bold text-[#fff1dd]">برای مشاهده نزدیک‌ترین گزینه‌ها، موقعیت را فعال کنید</h3><p className="mt-2 text-sm leading-6 text-[#d5c0b2]/65">می‌توانید به‌جای موقعیت فعلی، شهر یا محدوده را دستی انتخاب کنید.</p></>}
                {locationState === "loading" && <div className="flex items-center gap-3 text-[#efd19d]"><RefreshCw className="h-5 w-5 animate-spin" /><span className="font-bold">در حال دریافت موقعیت تقریبی شما…</span></div>}
                {locationState === "ready" && <><h3 className="font-bold text-[#fff1dd]">موقعیت دریافت شد</h3><p className="mt-2 text-sm leading-6 text-[#d5c0b2]/65">برای حفظ حریم خصوصی، مختصات فقط برای مرتب‌سازی نتایج نزدیک استفاده می‌شود.</p></>}
                {locationState === "error" && <><h3 className="font-bold text-rose-200">دسترسی به موقعیت ممکن نشد</h3><p className="mt-2 text-sm leading-6 text-[#d5c0b2]/65">مجوز مرورگر را بررسی کنید یا شهر و منطقه را دستی انتخاب کنید.</p></>}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {locationState !== "ready" ? <button type="button" onClick={requestLocation} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[linear-gradient(135deg,#e1bd7e,#a97436)] px-5 text-sm font-bold text-white"><LocateFixed className="h-4 w-4" /> استفاده از موقعیت فعلی</button> : <PrimaryLink href={nearbyHref}>مشاهده نتایج نزدیک <Navigation className="h-4 w-4" /></PrimaryLink>}
                <SecondaryLink href="/salons?map=1">انتخاب روی نقشه <Map className="h-4 w-4" /></SecondaryLink>
                <SecondaryLink href="/salons">ادامه با شهر انتخاب‌شده</SecondaryLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="selected-heading" className="bg-[#3b2722] py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div id="selected-heading"><SectionHeading eyebrow="SELECTED PROVIDERS" title="سالن‌های منتخب" description="نتایج منتخب باید از رتبه‌بندی واقعی، رزروهای تکمیل‌شده و تنظیمات پنل مدیریت دریافت شوند. جایگاه تبلیغاتی نیز باید برچسب واضح داشته باشد." /></div>
          <div className="mt-10"><EmptyState icon={<Building2 className="h-7 w-7" />} title="فهرست منتخب پس از اتصال دادهٔ واقعی نمایش داده می‌شود" description="این قسمت آمادهٔ تب‌های بالاترین امتیاز، بیشترین رزرو، لوکس، اقتصادی، مناسب عروس، کودک و رزرو فوری است؛ اما تا زمان وجود منبع معتبر، کارت ساختگی نمایش داده نمی‌شود." actions={<PrimaryLink href="/salons">مشاهده فهرست سالن‌ها <ArrowLeft className="h-4 w-4" /></PrimaryLink>} /></div>
        </div>
      </section>

      <section aria-labelledby="personal-heading" className="bg-[#2b1b17] py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div id="personal-heading"><SectionHeading align="right" eyebrow="FOR YOU" title={personalizationEnabled ? "پیشنهادهایی برای شما" : "خدمات محبوب شهر"} description={personalizationEnabled ? "پیشنهادها تنها با استفاده از تعامل‌های غیرحساس مانند خدمات مشاهده‌شده، علاقه‌مندی‌ها، شهر و رزروهای قبلی ساخته می‌شوند." : "شخصی‌سازی خاموش است؛ به‌جای آن مسیرهای عمومی و محبوب نمایش داده می‌شوند."} /></div>
            <button type="button" onClick={togglePersonalization} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#dfbd87]/25 px-4 text-xs font-bold text-[#e8cc9d] transition hover:bg-[#c99d61]/10" aria-pressed={personalizationEnabled}>{personalizationEnabled ? "غیرفعال‌کردن شخصی‌سازی" : "فعال‌کردن شخصی‌سازی"}</button>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {(personalizationEnabled ? [
              { icon: Heart, title: "علاقه‌مندی‌های شما", description: "پس از ورود، سالن‌ها و متخصصان ذخیره‌شده اینجا نمایش داده می‌شوند.", href: "/favorites" },
              { icon: RefreshCw, title: "رزرو مجدد", description: "خدمات تکمیل‌شده و متخصصان قبلی برای رزرو سریع در دسترس خواهند بود.", href: "/dashboard/appointments" },
              { icon: MapPin, title: "پیشنهادهای نزدیک", description: "با انتخاب شهر یا موقعیت، خدمات مرتبط با محدودهٔ شما نمایش داده می‌شوند.", href: "/salons" },
            ] : [
              { icon: Sparkles, title: "خدمات محبوب", description: "مرور دسته‌های اصلی بدون استفاده از سابقهٔ شخصی.", href: "/salons" },
              { icon: Clock3, title: "نوبت‌های امروز", description: "مشاهدهٔ زمان‌های واقعی قابل رزرو در شهر انتخابی.", href: "/salons?availability=today" },
              { icon: BadgePercent, title: "پیشنهادهای فعال", description: "فقط تخفیف‌های معتبر و منقضی‌نشده نمایش داده می‌شوند.", href: "/salons?discount=1" },
            ]).map((item) => {
              const Icon = item.icon
              return <Link key={item.title} href={item.href} className="group rounded-[28px] border border-[#d9b77f]/18 bg-white/[0.055] p-6 transition hover:-translate-y-1 hover:border-[#e4c087]/40"><Icon className="h-6 w-6 text-[#e2bd83]" strokeWidth={1.55} /><h3 className="mt-5 text-lg font-bold text-[#fff0dc]">{item.title}</h3><p className="mt-2 text-sm leading-7 text-[#d5c0b2]/65">{item.description}</p><span className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-[#e8c98f]">مشاهده <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-1" /></span></Link>
            })}
          </div>
        </div>
      </section>

      <section aria-labelledby="deals-heading" className="bg-[#241612] py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div id="deals-heading"><SectionHeading eyebrow="SPECIAL OFFERS" title="تخفیف‌ها و پیشنهادهای ویژه" description="قیمت قبلی، قیمت نهایی، ظرفیت و زمان پایان باید از سرور خوانده شوند؛ پیشنهاد منقضی یا ساختگی نمایش داده نخواهد شد." /></div>
          <div className="mt-10"><EmptyState icon={<BadgePercent className="h-7 w-7" />} title="پیشنهاد فعالی از منبع معتبر دریافت نشده است" description="پس از فعال‌شدن تخفیف واقعی در پنل، این بخش به‌صورت خودکار قیمت اصلی، قیمت نهایی، ظرفیت باقی‌مانده و اولین نوبت آزاد را نمایش می‌دهد." actions={<><PrimaryLink href="/salons?discount=1">بررسی پیشنهادهای فعال</PrimaryLink><SecondaryLink href="/salons">مشاهده خدمات مشابه</SecondaryLink></>} /></div>
        </div>
      </section>

      <section aria-labelledby="home-service-heading" className="relative overflow-hidden bg-[#3b2722] py-20 sm:py-24">
        <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-[#c2935b]/10 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8">
          <div id="home-service-heading"><SectionHeading align="right" eyebrow="BEAUTY AT HOME" title="خدمات زیبایی در منزل" description="متخصصان دارای مدارک و محدودهٔ فعالیت تأییدشده می‌توانند خدمت را در محل مشتری ارائه دهند. آدرس دقیق تنها پس از تأیید نهایی رزرو نمایش داده می‌شود." />
            <div className="mt-7 flex flex-wrap gap-3"><PrimaryLink href="/salons?delivery=home">مشاهده خدمات در منزل <ArrowLeft className="h-4 w-4" /></PrimaryLink><SecondaryLink href="/support/home-services">قوانین و حریم خصوصی</SecondaryLink></div>
          </div>
          <div className="rounded-[34px] border border-[#d9b77f]/20 bg-[linear-gradient(145deg,rgba(255,255,255,0.10),rgba(255,255,255,0.03))] p-6 shadow-[0_30px_90px_rgba(10,5,4,0.28)] backdrop-blur-xl sm:p-8">
            {[{ icon: ShieldCheck, title: "هویت و مدارک تأییدشده", text: "وضعیت احراز هر متخصص با نشان قابل توضیح نمایش داده می‌شود." }, { icon: MapPin, title: "حفاظت از آدرس", text: "آدرس دقیق پیش از تأیید رزرو در اختیار متخصص قرار نمی‌گیرد." }, { icon: Navigation, title: "محدوده و هزینه رفت‌وآمد", text: "شعاع فعالیت و هزینهٔ رفت‌وآمد باید پیش از رزرو مشخص باشد." }, { icon: Clock3, title: "زمان رسیدن و شرایط لغو", text: "زمان تقریبی و قوانین تغییر یا لغو قبل از تأیید نمایش داده می‌شود." }].map((item) => { const Icon = item.icon; return <div key={item.title} className="flex gap-4 border-b border-[#d9b77f]/12 py-4 last:border-0"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#c39762]/14 text-[#edca92]"><Icon className="h-5 w-5" /></div><div><h3 className="text-sm font-bold text-[#fff0dc]">{item.title}</h3><p className="mt-1 text-xs leading-6 text-[#d5c0b2]/65">{item.text}</p></div></div> })}
          </div>
        </div>
      </section>

      <section aria-labelledby="specialists-heading" className="bg-[#2b1b17] py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div id="specialists-heading"><SectionHeading eyebrow="TOP PROFESSIONALS" title="متخصصان برتر" description="رتبه‌بندی باید ترکیبی از رزرو تأییدشده، وقت‌شناسی، پاسخ‌گویی، نرخ لغو، امتیاز خدمت، شکایت معتبر و کامل‌بودن پروفایل باشد." /></div>
          <div className="mt-10"><EmptyState icon={<Crown className="h-7 w-7" />} title="رتبه‌بندی متخصصان پس از اتصال دادهٔ عملکرد نمایش داده می‌شود" description="برای جلوگیری از معرفی نادرست، متخصص برتر بدون محاسبهٔ واقعی معیارهای عملکرد نمایش داده نمی‌شود." actions={<PrimaryLink href="/salons?view=specialists">مشاهده همه متخصصان</PrimaryLink>} /></div>
        </div>
      </section>

      <section aria-labelledby="portfolio-heading" className="bg-[#241612] py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div id="portfolio-heading"><SectionHeading eyebrow="PORTFOLIO" title="نمونه‌کارهای قابل رزرو" description="نمونه‌کار فقط پس از ثبت رضایت انتشار و بازبینی محتوا نمایش داده می‌شود؛ تصاویر قبل و بعد نیز باید برچسب واضح داشته باشند." /></div>
          <div className="mt-10"><EmptyState icon={<Camera className="h-7 w-7" />} title="هنوز نمونه‌کار تأییدشده‌ای برای نمایش دریافت نشده است" description="پس از اتصال سیستم Moderation، هر تصویر یا ویدئو مستقیماً به متخصص، سالن و خدمت قابل رزرو متصل خواهد شد." actions={<><PrimaryLink href="/salons">مشاهده متخصصان</PrimaryLink><SecondaryLink href="/support/report-content">گزارش محتوای نامعتبر</SecondaryLink></>} /></div>
        </div>
      </section>

      <section aria-labelledby="city-services-heading" className="bg-[#3b2722] py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div id="city-services-heading"><SectionHeading eyebrow="TRENDING BY CITY" title="محبوب‌ترین خدمات شهر" description="این مسیرها براساس شهر و خدمت فیلتر می‌شوند. میانگین قیمت و تعداد نوبت تنها در صورت وجود دادهٔ کافی اضافه خواهد شد." /></div>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cityServices.map((item, index) => <Link key={item.title} href={item.href} className="group flex min-h-24 items-center justify-between rounded-[24px] border border-[#d9b77f]/18 bg-white/[0.055] px-5 py-4 transition hover:-translate-y-1 hover:border-[#e4c087]/40"><div><span className="font-serif text-xs tracking-[0.18em] text-[#cda86f]/45">{String(index + 1).padStart(2, "0")}</span><h3 className="mt-2 font-bold text-[#fff0dc]">{item.title}</h3></div><ArrowLeft className="h-5 w-5 text-[#e4c084] transition group-hover:-translate-x-1" /></Link>)}
          </div>
        </div>
      </section>

      <section aria-labelledby="regions-heading" className="bg-[#2b1b17] py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div id="regions-heading"><SectionHeading eyebrow="EXPLORE LOCATIONS" title="مرور استان‌ها، شهرها و محله‌ها" description="شهر و محله را برای مشاهده خدمات، سالن‌ها، متخصصان و نوبت‌های مرتبط انتخاب کنید." /></div>
          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            <div className="rounded-[30px] border border-[#d9b77f]/18 bg-white/[0.05] p-6"><h3 className="flex items-center gap-2 text-lg font-bold text-[#fff0dc]"><MapPin className="h-5 w-5 text-[#e4c084]" /> شهرهای فعال</h3><div className="mt-5 flex flex-wrap gap-2">{activeCities.map((city) => <Link key={city} href={`/salons?city=${city}`} className="rounded-full border border-[#d9b77f]/18 bg-[#c39762]/8 px-4 py-2 text-sm text-[#e5cebd] transition hover:border-[#e4c087]/45 hover:bg-[#c39762]/16">{city}</Link>)}</div></div>
            <div className="rounded-[30px] border border-[#d9b77f]/18 bg-white/[0.05] p-6"><h3 className="flex items-center gap-2 text-lg font-bold text-[#fff0dc]"><Navigation className="h-5 w-5 text-[#e4c084]" /> محله‌های پرتقاضا</h3><div className="mt-5 flex flex-wrap gap-2">{popularNeighborhoods.map((area) => <Link key={area} href={`/salons?neighborhood=${area}`} className="rounded-full border border-[#d9b77f]/18 bg-[#c39762]/8 px-4 py-2 text-sm text-[#e5cebd] transition hover:border-[#e4c087]/45 hover:bg-[#c39762]/16">{area}</Link>)}</div></div>
          </div>
          <div className="mt-6 text-center"><SecondaryLink href="/cities">مشاهده همه شهرهای تحت پوشش</SecondaryLink></div>
        </div>
      </section>

      <section aria-labelledby="how-heading" className="bg-[#241612] py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div id="how-heading"><SectionHeading eyebrow="HOW IT WORKS" title="رزرو در چهار مرحله" description="بدون تماس تلفنی، با نمایش قوانین پیش از تأیید، امکان تغییر یا لغو و یادآوری نوبت." /></div>
          <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {bookingSteps.map((step, index) => { const Icon = step.icon; return <article key={step.title} className="relative rounded-[28px] border border-[#d9b77f]/18 bg-white/[0.055] p-6"><span className="absolute left-5 top-4 font-serif text-xs text-[#cda86f]/40">0{index + 1}</span><div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-[#c39762]/14 text-[#edca92]"><Icon className="h-6 w-6" /></div><h3 className="mt-5 text-lg font-bold text-[#fff0dc]">{step.title}</h3><p className="mt-3 text-sm leading-7 text-[#d5c0b2]/65">{step.description}</p></article> })}
          </div>
          <div className="mt-8 text-center"><PrimaryLink href="/salons">شروع رزرو <ArrowLeft className="h-4 w-4" /></PrimaryLink></div>
        </div>
      </section>

      <section aria-labelledby="reviews-heading" className="bg-[#3b2722] py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div id="reviews-heading"><SectionHeading eyebrow="VERIFIED REVIEWS" title="نظرات واقعی کاربران" description="نظر منفی معتبر حذف نمی‌شود و نظر بدون رزرو تکمیل‌شده نباید با نشان تأیید نمایش داده شود." /></div>
          <div className="mt-10"><EmptyState icon={<Star className="h-7 w-7" />} title="نظر تأییدشده‌ای از منبع واقعی دریافت نشده است" description="پس از اتصال سیستم رزرو و نظر، کارت‌ها شامل خدمت، سالن، متخصص، تاریخ مراجعه، امتیازهای جزئی و پاسخ ارائه‌دهنده خواهند بود." actions={<SecondaryLink href="/support/reviews">قوانین نظرات</SecondaryLink>} /></div>
        </div>
      </section>

      <section aria-labelledby="quality-heading" className="bg-[#2b1b17] py-20 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 lg:grid-cols-[0.85fr_1.15fr] lg:items-start lg:px-8">
          <div id="quality-heading"><SectionHeading align="right" eyebrow="QUALITY & TRUST" title="تضمین کیفیت و اعتماد" description="نشان‌های اعتماد باید معنی شفاف و قابل بررسی داشته باشند؛ کاربر با کلیک روی هر نشان، معیار صدور آن را می‌بیند." /></div>
          <div className="grid gap-3 sm:grid-cols-2">{qualityItems.map((item) => <div key={item} className="flex items-start gap-3 rounded-[22px] border border-[#d9b77f]/16 bg-white/[0.045] p-4"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#e4c084]" /><span className="text-sm leading-6 text-[#e4d1c3]/78">{item}</span></div>)}</div>
        </div>
      </section>

      <section aria-labelledby="club-heading" className="bg-[#241612] py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="relative overflow-hidden rounded-[36px] border border-[#e1bf88]/25 bg-[radial-gradient(circle_at_15%_20%,rgba(220,177,112,0.18),transparent_32%),linear-gradient(135deg,#4a3028,#2a1915)] px-6 py-12 shadow-[0_34px_100px_rgba(10,5,4,0.35)] sm:px-10 lg:px-14">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center"><div id="club-heading"><p className="text-[10px] font-semibold tracking-[0.32em] text-[#e2bd83]">LUXE CLUB</p><h2 className="mt-4 font-serif text-3xl text-[#fff1dc] md:text-5xl">باشگاه مشتریان و معرفی دوستان</h2><p className="mt-4 max-w-3xl text-sm leading-7 text-[#decabd]/72">پس از فعال‌شدن قابلیت، امتیاز رزرو تکمیل‌شده، پاداش نظر معتبر، اعتبار معرفی دوستان و پیشنهادهای اختصاصی در حساب کاربر نمایش داده می‌شود.</p><div className="mt-6 flex flex-wrap gap-3"><PrimaryLink href="/club">مشاهده باشگاه مشتریان <Gift className="h-4 w-4" /></PrimaryLink><SecondaryLink href="/register">ثبت‌نام و دریافت مزایا</SecondaryLink></div></div><div className="flex h-28 w-28 items-center justify-center rounded-full border border-[#e9c88f]/25 bg-white/[0.07] text-[#efce97]"><Gift className="h-12 w-12" strokeWidth={1.3} /></div></div>
          </div>
        </div>
      </section>

      <section aria-labelledby="providers-heading" className="bg-[#3b2722] py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div id="providers-heading"><SectionHeading eyebrow="FOR PROVIDERS" title="سالن یا متخصص زیبایی هستید؟" description="نوبت‌ها، شعب، متخصصان، خدمات، قیمت‌ها و نمونه‌کارهای خود را آنلاین مدیریت کنید و تجربهٔ حرفه‌ای‌تری برای مشتری بسازید." /></div>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{providerBenefits.map((item) => <div key={item} className="flex items-center gap-3 rounded-[22px] border border-[#d9b77f]/16 bg-white/[0.05] p-4"><CheckCircle2 className="h-5 w-5 shrink-0 text-[#e4c084]" /><span className="text-sm font-medium text-[#e8d5c7]/78">{item}</span></div>)}</div>
          <div className="mt-8 flex flex-wrap justify-center gap-3"><PrimaryLink href="/salon-register">ثبت سالن یا متخصص <ArrowLeft className="h-4 w-4" /></PrimaryLink><SecondaryLink href="/pricing">مشاهده تعرفه‌ها</SecondaryLink><SecondaryLink href="/contact?subject=provider-consultation">درخواست مشاوره</SecondaryLink></div>
        </div>
      </section>

      <section aria-labelledby="pwa-heading" className="bg-[#2b1b17] py-20 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:px-8">
          <div className="mx-auto flex h-[420px] w-[230px] items-center justify-center rounded-[42px] border-[8px] border-[#17100e] bg-[linear-gradient(155deg,#4c3129,#251612)] p-5 shadow-[0_40px_100px_rgba(8,4,3,0.48)]"><div className="flex h-full w-full flex-col items-center justify-center rounded-[30px] border border-[#ddb97f]/18 bg-white/[0.045] text-center"><Smartphone className="h-12 w-12 text-[#e6c187]" strokeWidth={1.3} /><p className="mt-5 font-serif text-2xl text-[#fff0dc]">LUXE BEAUTY</p><p className="mt-2 text-xs tracking-[0.18em] text-[#d7b67f]">INSTALLABLE EXPERIENCE</p></div></div>
          <div id="pwa-heading"><SectionHeading align="right" eyebrow="INSTALLABLE PWA" title="لوکس بیوتی را روی گوشی خود داشته باشید" description="نصب فقط زمانی پیشنهاد می‌شود که مرورگر پشتیبانی کند، برنامه قبلاً نصب نشده باشد و کاربر چند بار اعلان را رد نکرده باشد." />
            <div className="mt-7 grid gap-3 sm:grid-cols-2">{pwaFeatures.map((feature) => <div key={feature} className="flex items-center gap-3 rounded-2xl border border-[#d9b77f]/15 bg-white/[0.045] p-3.5"><CheckCircle2 className="h-4 w-4 text-[#e4c084]" /><span className="text-sm text-[#e5d2c4]/75">{feature}</span></div>)}</div>
            <div className="mt-7" aria-live="polite">{!isStandalone && installPrompt ? <button type="button" onClick={installPwa} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[linear-gradient(135deg,#e1bd7e,#a97436)] px-5 text-sm font-bold text-white"><Smartphone className="h-4 w-4" /> نصب نسخه قابل استفاده</button> : isIos && !isStandalone ? <p className="rounded-2xl border border-[#d9b77f]/16 bg-white/[0.045] p-4 text-sm leading-7 text-[#decabd]/72">در Safari گزینهٔ Share را بزنید و سپس «Add to Home Screen» را انتخاب کنید.</p> : isStandalone ? <p className="text-sm font-bold text-[#e6c78f]">نسخهٔ قابل نصب هم‌اکنون فعال است.</p> : <p className="text-sm leading-7 text-[#d5c0b2]/60">دکمهٔ نصب فقط در مرورگرهای سازگار و هنگام فراهم‌بودن شرایط نمایش داده می‌شود.</p>}</div>
          </div>
        </div>
      </section>

      <section aria-labelledby="magazine-heading" className="bg-[#241612] py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between"><div id="magazine-heading"><SectionHeading align="right" eyebrow="BEAUTY MAGAZINE" title="مجله زیبایی" description="راهنماهای کوتاه و کاربردی باید به خدمات، متخصصان و شهرهای مرتبط لینک شوند." /></div><SecondaryLink href="/magazine">مشاهده همه مقاله‌ها <ArrowLeft className="h-4 w-4" /></SecondaryLink></div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{magazineItems.map((item, index) => <Link key={item.title} href="/magazine" className="group rounded-[28px] border border-[#d9b77f]/18 bg-white/[0.05] p-6 transition hover:-translate-y-1 hover:border-[#e4c087]/40"><div className="flex items-center justify-between"><BookOpenText className="h-6 w-6 text-[#e4c084]" /><span className="font-serif text-xs text-[#cda86f]/45">{String(index + 1).padStart(2, "0")}</span></div><p className="mt-5 text-xs font-bold text-[#d4af75]">{item.category}</p><h3 className="mt-2 text-lg font-bold text-[#fff0dc]">{item.title}</h3><span className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-[#e8c98f]">مطالعه راهنما <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-1" /></span></Link>)}</div>
        </div>
      </section>

      <section aria-labelledby="faq-heading" className="bg-[#3b2722] py-20 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 lg:px-8">
          <div id="faq-heading"><SectionHeading eyebrow="FAQ" title="سؤالات پرتکرار" description="پاسخ کوتاه به پرسش‌های اصلی رزرو، پرداخت، لغو، نظرات و خدمات در منزل." /></div>
          <div className="mt-10 space-y-3">{faqItems.map((item, index) => { const open = openFaq === index; return <div key={item.question} className="overflow-hidden rounded-[22px] border border-[#d9b77f]/17 bg-white/[0.045]"><button type="button" onClick={() => setOpenFaq(open ? null : index)} className="flex min-h-14 w-full items-center justify-between gap-4 px-5 py-4 text-right focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#e4c084]" aria-expanded={open}><span className="font-bold text-[#fff0dc]">{item.question}</span>{open ? <ChevronUp className="h-5 w-5 shrink-0 text-[#e4c084]" /> : <ChevronDown className="h-5 w-5 shrink-0 text-[#e4c084]" />}</button>{open ? <div className="border-t border-[#d9b77f]/12 px-5 py-4 text-sm leading-7 text-[#d9c5b7]/70">{item.answer}</div> : null}</div> })}</div>
          <div className="mt-7 flex flex-wrap justify-center gap-3"><SecondaryLink href="/support">مرکز راهنما</SecondaryLink><SecondaryLink href="/contact">تماس با پشتیبانی</SecondaryLink></div>
        </div>
      </section>

      <section aria-labelledby="support-heading" className="bg-[#211411] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="rounded-[34px] border border-[#e0bd86]/22 bg-[linear-gradient(135deg,#4b3028,#2b1915)] px-6 py-9 shadow-[0_30px_90px_rgba(8,4,3,0.35)] sm:px-9 lg:flex lg:items-center lg:justify-between lg:gap-8">
            <div id="support-heading"><p className="text-[10px] font-semibold tracking-[0.3em] text-[#deb77e]">FAST SUPPORT</p><h2 className="mt-3 font-serif text-2xl text-[#fff0dc] sm:text-3xl">برای رزرو، پرداخت یا پیگیری نوبت کمک می‌خواهید؟</h2><p className="mt-3 text-sm leading-7 text-[#dbc7b9]/70">شنبه تا پنجشنبه ۹ تا ۲۱ — جمعه و تعطیلات ۱۰ تا ۱۸ — ثبت تیکت شبانه‌روزی</p></div>
            <div className="mt-6 flex flex-wrap gap-3 lg:mt-0"><a href="tel:09399496078" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[linear-gradient(135deg,#e1bd7e,#a97436)] px-5 text-sm font-bold text-white"><Phone className="h-4 w-4" /> ۰۹۳۹۹۴۹۶۰۷۸</a><SecondaryLink href="/support/tickets">ثبت تیکت</SecondaryLink><SecondaryLink href="/support">مرکز راهنما</SecondaryLink></div>
          </div>
        </div>
      </section>

      <div className="fixed bottom-20 left-4 z-50 flex flex-col items-start gap-2 lg:bottom-6">
        {showSupport ? <div className="w-[min(340px,calc(100vw-32px))] rounded-[26px] border border-[#dfbd87]/25 bg-[#2b1b17]/95 p-5 shadow-[0_26px_80px_rgba(8,4,3,0.5)] backdrop-blur-xl"><div className="flex items-center justify-between"><div><p className="font-bold text-[#fff0dc]">پشتیبانی لوکس بیوتی</p><p className="mt-1 text-xs text-[#d2bdaf]/65">تیکت شبانه‌روزی ثبت می‌شود.</p></div><button type="button" onClick={() => setShowSupport(false)} className="rounded-full p-2 text-[#d9bd91]" aria-label="بستن پنجره پشتیبانی"><ChevronDown className="h-5 w-5" /></button></div><div className="mt-4 grid gap-2"><a href="tel:09399496078" className="flex min-h-11 items-center gap-2 rounded-2xl bg-white/[0.06] px-4 text-sm font-bold text-[#edd1a0]"><Phone className="h-4 w-4" /> تماس تلفنی</a><Link href="/support/tickets" className="flex min-h-11 items-center gap-2 rounded-2xl bg-white/[0.06] px-4 text-sm font-bold text-[#edd1a0]"><MessageCircle className="h-4 w-4" /> ثبت تیکت</Link></div></div> : null}
        <button type="button" onClick={() => setShowSupport((value) => !value)} className="flex h-14 w-14 items-center justify-center rounded-full border border-[#e8c98e]/35 bg-[linear-gradient(135deg,#dcb978,#9b6630)] text-white shadow-[0_18px_45px_rgba(66,35,15,0.42)]" aria-label="پشتیبانی سریع"><Headphones className="h-6 w-6" /></button>
      </div>

      {showBackToTop ? <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="fixed bottom-20 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-[#dfbd87]/25 bg-[#2b1b17]/90 text-[#e8c98f] shadow-xl backdrop-blur lg:bottom-6" aria-label="بازگشت به بالای صفحه"><ArrowUp className="h-5 w-5" /></button> : null}

      <nav aria-label="ناوبری پایین موبایل" className="fixed inset-x-0 bottom-0 z-40 border-t border-[#dfbd87]/15 bg-[#211411]/95 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {[{ icon: Home, label: "خانه", href: "/" }, { icon: Search, label: "جست‌وجو", href: "/salons" }, { icon: CalendarCheck2, label: "نوبت‌ها", href: "/dashboard/appointments" }, { icon: Heart, label: "علاقه‌مندی", href: "/favorites" }, { icon: UserRoundCheck, label: "حساب من", href: "/login" }].map((item) => { const Icon = item.icon; return <Link key={item.label} href={item.href} className="flex min-h-12 flex-col items-center justify-center gap-1 text-[10px] font-bold text-[#cfb9aa]/65 transition hover:text-[#e8c98f]"><Icon className="h-5 w-5" strokeWidth={1.6} />{item.label}</Link> })}
        </div>
      </nav>
    </div>
  )
}
