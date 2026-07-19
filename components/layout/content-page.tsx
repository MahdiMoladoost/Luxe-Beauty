import type { ReactNode } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

export function ContentPage({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <section className="border-b border-border bg-gradient-to-b from-primary/10 to-background px-4 pb-16 pt-32">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-sm font-bold text-primary">{eyebrow}</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-foreground md:text-5xl">{title}</h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">{description}</p>
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-4 py-14 lg:px-8">{children}</section>
      </main>
      <Footer />
    </div>
  )
}

export function ContentCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="rounded-3xl border border-border bg-card p-6 shadow-sm">
      <h2 className="text-xl font-black text-foreground">{title}</h2>
      <div className="mt-4 text-sm leading-8 text-muted-foreground">{children}</div>
    </article>
  )
}
