import { UserRound } from "lucide-react"

import { AccountManager } from "@/components/customer-panel/account-manager"

export default function CustomerAccountPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-[#5b4033]/10 bg-white p-5 shadow-[0_18px_55px_rgba(66,43,32,0.06)] sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#3a251e] text-[#e8c58d]">
            <UserRound className="size-5" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-[#34231d]">اطلاعات حساب</h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[#806e64]">
              اطلاعات عمومی حساب را مدیریت کنید. شماره موبایل و هویت حساس فقط از مسیرهای تأییدشده و مستقل تغییر می‌کنند.
            </p>
          </div>
        </div>
      </section>

      <AccountManager />
    </div>
  )
}
