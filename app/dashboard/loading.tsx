export default function CustomerDashboardLoading() {
  return (
    <div className="space-y-6" aria-label="در حال بارگیری پنل مشتری">
      <div className="h-48 animate-pulse rounded-[30px] bg-stone-300/70" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-36 animate-pulse rounded-[24px] bg-stone-200/80" />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-[28px] bg-stone-200/70" />
    </div>
  )
}
