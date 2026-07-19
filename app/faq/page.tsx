import { ContentPage } from "@/components/layout/content-page"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { frequentlyAskedQuestions } from "@/lib/mock-data"

const grouped = [
  { title: "رزرو نوبت", items: frequentlyAskedQuestions.slice(0, 2) },
  { title: "لغو و پرداخت", items: frequentlyAskedQuestions.slice(2, 4) },
  { title: "کیفیت و امنیت", items: frequentlyAskedQuestions.slice(4) },
]

export default function FaqPage() {
  return (
    <ContentPage
      eyebrow="مرکز راهنما"
      title="سوالات متداول"
      description="پاسخ روشن به مهم‌ترین سوالات رزرو، پرداخت، لغو، حساب کاربری و همکاری سالن‌ها."
    >
      <div className="mx-auto max-w-4xl space-y-8">
        {grouped.map((group) => (
          <section key={group.title} className="rounded-3xl border border-border bg-card p-5 md:p-7">
            <h2 className="text-xl font-black text-foreground">{group.title}</h2>
            <Accordion type="single" collapsible className="mt-4">
              {group.items.map((item, index) => (
                <AccordionItem key={item.question} value={`${group.title}-${index}`}>
                  <AccordionTrigger className="text-right">{item.question}</AccordionTrigger>
                  <AccordionContent className="leading-7 text-muted-foreground">{item.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        ))}
        <div className="rounded-3xl bg-secondary p-6 text-center">
          <h2 className="font-black text-foreground">پاسخ خود را پیدا نکردید؟</h2>
          <p className="mt-2 text-sm text-muted-foreground">از صفحه تماس با ما، نوع درخواست را روی پشتیبانی مشتری یا همکاری سالن تنظیم کنید.</p>
        </div>
      </div>
    </ContentPage>
  )
}
