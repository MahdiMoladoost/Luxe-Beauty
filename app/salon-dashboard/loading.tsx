export default function ProviderPanelLoading() {
  return (
    <div dir="rtl" className="space-y-6" aria-label="در حال بارگیری پنل">
      <div className="h-44 animate-pulse rounded-[30px] bg-stone-200/80" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-40 animate-pulse rounded-[24px] bg-stone-200/70" />
        ))}
      </div>
      <div className="space-y-3 rounded-[28px] border border-stone-200 bg-white p-5">
        <div className="h-7 w-48 animate-pulse rounded bg-stone-200" />
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-20 animate-pulse rounded-2xl bg-stone-100" />
        ))}
      </div>
    </div>
  )
}
