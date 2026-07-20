import { RoleManager } from "@/components/admin/role-manager"

export default function RolesPage() {
  return (
    <main className="mx-auto max-w-7xl p-4 py-10 md:p-8" dir="rtl">
      <h1 className="text-3xl font-bold">نقش‌ها و مجوزها</h1>
      <p className="mt-2 text-muted-foreground">نقش‌های سیستمی Seed شده‌اند و نقش یا مجوز سفارشی در PostgreSQL ذخیره می‌شود.</p>
      <div className="mt-8"><RoleManager /></div>
    </main>
  )
}
