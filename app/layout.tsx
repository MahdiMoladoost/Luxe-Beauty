import type { Metadata, Viewport } from "next"
import { Vazirmatn } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-vazirmatn",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "لوکس بیوتی | رزرو آنلاین سالن و خدمات زیبایی",
    template: "%s | لوکس بیوتی",
  },
  description: "جستجو، مقایسه قیمت، انتخاب آرایشگر و رزرو آنلاین نوبت سالن‌ها و خدمات زیبایی.",
  applicationName: "لوکس بیوتی",
  keywords: ["رزرو آرایشگاه", "سالن زیبایی", "نوبت آنلاین", "خدمات زیبایی", "آرایشگر"],
  authors: [{ name: "Luxe Beauty" }],
  creator: "Luxe Beauty",
  publisher: "Luxe Beauty",
  formatDetection: { telephone: false, address: false, email: false },
  openGraph: {
    type: "website",
    locale: "fa_IR",
    siteName: "لوکس بیوتی",
    title: "لوکس بیوتی | رزرو آنلاین سالن و خدمات زیبایی",
    description: "سالن مناسب را پیدا کنید، قیمت و نظرات را مقایسه کنید و آنلاین نوبت بگیرید.",
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: "/icon-light-32x32.png", media: "(prefers-color-scheme: light)" },
      { url: "/icon-dark-32x32.png", media: "(prefers-color-scheme: dark)" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.png",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa-IR" dir="rtl" className="bg-background" suppressHydrationWarning>
      <body className={`${vazirmatn.variable} font-sans antialiased`}>
        {children}
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
