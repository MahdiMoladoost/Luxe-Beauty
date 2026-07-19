import type { Metadata } from 'next'
import { Vazirmatn } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const vazirmatn = Vazirmatn({ 
  subsets: ["arabic", "latin"],
  variable: '--font-vazirmatn',
})

export const metadata: Metadata = {
  title: 'سالن یاب | پلتفرم رزرو آنلاین آرایشگاه',
  description: 'بزرگترین پلتفرم جستجو و رزرو آنلاین آرایشگاه در ایران - نوبت‌دهی آنلاین، مقایسه قیمت و مشاهده نمونه‌کارها',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
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
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
