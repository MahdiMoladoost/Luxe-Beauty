import { Footer } from "@/components/layout/footer"
import { Header } from "@/components/layout/header"
import { BookingHero } from "@/components/home/booking-hero"
import { HomepageSections } from "@/components/home/homepage-sections"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#211411]">
      <Header />
      <main className="flex-1 pt-16">
        <BookingHero />
        <HomepageSections />
      </main>
      <Footer />
    </div>
  )
}
