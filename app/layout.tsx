import type { Metadata } from "next"
import { Vazirmatn } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import "./brand.css"

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-vazirmatn",
})

export const metadata: Metadata = {
  title: "لوکس بیوتی | رزرو آنلاین خدمات زیبایی",
  description:
    "جست‌وجو، مقایسه و رزرو آنلاین سالن‌های زیبایی، آرایشگاه‌های مردانه، متخصصان مستقل و خدمات زیبایی در منزل.",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/luxe-beauty-mark.png",
        type: "image/png",
        sizes: "64x64",
      },
    ],
    shortcut: "/luxe-beauty-mark.png",
    apple: [
      {
        url: "/luxe-beauty-mark.png",
        type: "image/png",
        sizes: "64x64",
      },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fa" dir="rtl" className="bg-background">
      <body className={`${vazirmatn.variable} font-sans antialiased`}>
        {children}
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
