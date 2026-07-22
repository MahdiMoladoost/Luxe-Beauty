import Link from "next/link"
import { Scissors, Store } from "lucide-react"

import { ServiceManager } from "@/components/provider-panel/service-manager"
import { Button } from "@/components/ui/button"
import { requirePrincipalFromServerCookies } from "@/lib/auth/session-cookie"
import { providerPanelBootstrap } from "@/lib/provider-panel/service"

export default async function ProviderServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ providerId?: string }>
}) {
  const principal = await requirePrincipalFromServerCookies()
  const query = await searchParams
  const bootstrap = await providerPanelBootstrap(principal, query.providerId)
  const provider = bootstrap.selectedProvider

  if (!provider) {
    return (
      <section className="mx-auto flex min-h-[65vh] max-w-2xl items-center justify-center">
        <div className="w-full rounded-[30px] border border-[#5b4033]/10 bg-white p-9 text-center shadow-[0_24px_70px_rgba(65,42,31,0.08)]">
          <Store className="mx-auto size-12 text-[#7c5a45]" />
          <h2 className="mt-5 text-2xl font-black text-[#34231d]">مجموعه‌ای برای مدیریت خدمات وجود ندارد</h2>
          <p className="mt-3 text-sm leading-7 text-[#79685f]">ابتدا سالن یا فعالیت حرفه‌ای خود را ثبت کنید.</p>
          <Button asChild className="mt-6 bg-[#3a251e] text-white hover:bg-[#4a3027]">
            <Link href="/salon-register">ثبت مجموعه</Link>
          </Button>
        </div>
      </section>
    )
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-[#5b4033]/10 bg-white p-5 shadow-[0_18px_55px_rgba(66,43,32,0.06)] sm:p-7">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#3a251e] text-[#e8c58d]">
            <Scissors className="size-5" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-[#34231d]">مدیریت خدمات</h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[#79685f]">
              خدمات {provider.nameFa} را با قیمت واقعی، مدت، مخاطب، روش تأیید و وضعیت انتشار مدیریت کنید. انتشار فقط زمانی انجام می‌شود که خدمت و مقصد ارائه معتبر باشند.
            </p>
          </div>
        </div>
      </section>

      <ServiceManager key={provider.id} providerId={provider.id} />
    </div>
  )
}
