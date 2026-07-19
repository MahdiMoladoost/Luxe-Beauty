import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Check, ArrowLeft } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

const plans = [
  {
    name: "پایه",
    price: "رایگان",
    description: "برای شروع کار با سالن یاب",
    features: [
      "ثبت تا ۵ خدمت",
      "نمایش در نتایج جستجو",
      "دریافت نوبت آنلاین",
      "پشتیبانی ایمیلی",
    ],
    notIncluded: [
      "گزارش‌های آماری",
      "تبلیغات ویژه",
      "پشتیبانی تلفنی",
    ],
    popular: false,
  },
  {
    name: "حرفه‌ای",
    price: "۲۹۹,۰۰۰",
    period: "ماهانه",
    description: "برای سالن‌های در حال رشد",
    features: [
      "خدمات نامحدود",
      "نمایش در نتایج جستجو",
      "دریافت نوبت آنلاین",
      "گزارش‌های آماری کامل",
      "نشان سالن تایید شده",
      "پشتیبانی تلفنی",
    ],
    notIncluded: [
      "تبلیغات ویژه",
    ],
    popular: true,
  },
  {
    name: "ویژه",
    price: "۵۹۹,۰۰۰",
    period: "ماهانه",
    description: "برای سالن‌های بزرگ و حرفه‌ای",
    features: [
      "تمام امکانات حرفه‌ای",
      "نمایش در بالای لیست",
      "تبلیغات در صفحه اصلی",
      "بنر اختصاصی",
      "مدیر اکانت اختصاصی",
      "API اختصاصی",
    ],
    notIncluded: [],
    popular: false,
  },
]

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        <section className="px-4 py-20">
          <div className="container mx-auto">
            <div className="text-center">
              <h1 className="text-4xl font-bold">تعرفه‌ها</h1>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                پلن مناسب سالن خود را انتخاب کنید
              </p>
            </div>

            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {plans.map((plan) => (
                <div 
                  key={plan.name}
                  className={`relative rounded-2xl border bg-card p-8 ${
                    plan.popular 
                      ? "border-accent shadow-lg" 
                      : "border-border"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-4 py-1 text-sm font-medium text-white">
                      محبوب‌ترین
                    </div>
                  )}
                  <div className="text-center">
                    <h3 className="text-xl font-semibold">{plan.name}</h3>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      {plan.period && (
                        <span className="text-muted-foreground"> / {plan.period}</span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
                  </div>

                  <ul className="mt-8 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-green-500" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                    {plan.notIncluded.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-muted-foreground">
                        <span className="h-5 w-5 text-center">-</span>
                        <span className="text-sm line-through">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    className="mt-8 w-full" 
                    variant={plan.popular ? "default" : "outline"}
                  >
                    {plan.price === "رایگان" ? "شروع رایگان" : "انتخاب پلن"}
                    <ArrowLeft className="mr-2 h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="mt-16 text-center">
              <p className="text-muted-foreground">
                سوالی دارید؟{" "}
                <Link href="/contact" className="text-accent hover:underline">
                  با ما تماس بگیرید
                </Link>
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
