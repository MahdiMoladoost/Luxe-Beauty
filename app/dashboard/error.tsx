"use client"

import { useEffect } from "react"
import { AlertCircle, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function CustomerDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(JSON.stringify({ event: "customer-panel.route-error", digest: error.digest }))
  }, [error])

  return (
    <section className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center">
      <div className="w-full rounded-[30px] border border-rose-200 bg-white p-8 text-center shadow-[0_24px_70px_rgba(65,42,31,0.08)] sm:p-10">
        <div className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-rose-50 text-rose-600">
          <AlertCircle className="size-7" />
        </div>
        <h2 className="mt-6 text-2xl font-black text-[#34231d]">بارگیری این بخش انجام نشد</h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-[#79685f]">
          اطلاعاتی تغییر نکرده است. دوباره تلاش کنید؛ اگر خطا ادامه داشت، بعداً صفحه را تازه‌سازی کنید.
        </p>
        <Button type="button" className="mt-7 bg-[#3a251e] text-white hover:bg-[#4a3027]" onClick={reset}>
          <RefreshCw className="size-4" />
          تلاش دوباره
        </Button>
      </div>
    </section>
  )
}
