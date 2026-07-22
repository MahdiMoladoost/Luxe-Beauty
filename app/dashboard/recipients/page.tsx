import { UsersRound } from "lucide-react"

import { RecipientManager } from "@/components/customer-panel/recipient-manager"

export default function CustomerRecipientsPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-[#5b4033]/10 bg-white p-5 shadow-[0_18px_55px_rgba(66,43,32,0.06)] sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#3a251e] text-[#e8c58d]">
            <UsersRound className="size-5" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-[#34231d]">دریافت‌کنندگان خدمت</h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[#806e64]">
              اطلاعات خودتان یا اعضای خانواده را برای رزرو نگه‌داری کنید. حذف از این صفحه نرم است و سوابق نوبت‌های قبلی را از بین نمی‌برد.
            </p>
          </div>
        </div>
      </section>

      <RecipientManager />
    </div>
  )
}
