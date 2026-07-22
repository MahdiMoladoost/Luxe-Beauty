"use client"

import { useEffect } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function ProviderPanelError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(
      JSON.stringify({
        event: "provider-panel.render-error",
        errorName: error.name,
        errorMessage: error.message,
        digest: error.digest,
      }),
    )
  }, [error])

  return (
    <section dir="rtl" className="mx-auto flex min-h-[65vh] max-w-2xl items-center justify-center">
      <div className="w-full rounded-[30px] border border-rose-200 bg-white p-8 text-center shadow-[0_24px_70px_rgba(65,42,31,0.08)] sm:p-10">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-700">
          <AlertTriangle className="size-7" />
        </div>
        <h2 className="mt-5 text-2xl font-black text-[#34231d]">این بخش از پنل بارگیری نشد</h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-[#79685f]">
          اطلاعات شما حذف نشده است. اتصال یا وضعیت سرور را بررسی کنید و دوباره تلاش کنید.
        </p>
        <Button type="button" onClick={reset} className="mt-6 bg-[#3a251e] text-white hover:bg-[#4a3027]">
          <RefreshCw className="size-4" />
          تلاش دوباره
        </Button>
        {error.digest ? (
          <p className="mt-4 text-xs text-[#9b8980]">شناسه پیگیری: {error.digest}</p>
        ) : null}
      </div>
    </section>
  )
}
