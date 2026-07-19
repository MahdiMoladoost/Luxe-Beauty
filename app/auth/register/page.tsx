"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Phone, User, Lock, Eye, EyeOff, Mail } from "lucide-react"

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState(1)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (step === 1) {
      setIsLoading(true)
      setTimeout(() => {
        setIsLoading(false)
        setStep(2)
      }, 1500)
    } else {
      setIsLoading(true)
      setTimeout(() => setIsLoading(false), 1500)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Form */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 md:px-8 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <span className="text-lg font-bold text-primary-foreground">س</span>
            </div>
            <span className="text-xl font-bold">سالن یاب</span>
          </Link>

          <h1 className="mt-8 text-3xl font-bold">ثبت نام</h1>
          <p className="mt-2 text-muted-foreground">
            برای استفاده از خدمات سالن یاب ثبت نام کنید
          </p>

          {/* Progress Steps */}
          <div className="mt-8 flex items-center justify-center gap-4">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
              step >= 1 ? "bg-accent text-white" : "bg-muted text-muted-foreground"
            }`}>
              ۱
            </div>
            <div className={`h-1 w-16 rounded ${step >= 2 ? "bg-accent" : "bg-muted"}`} />
            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
              step >= 2 ? "bg-accent text-white" : "bg-muted text-muted-foreground"
            }`}>
              ۲
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="phone">شماره موبایل</Label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      id="phone"
                      type="tel"
                      placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                      className="pr-10"
                      dir="ltr"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "در حال ارسال..." : "دریافت کد تایید"}
                </Button>
              </>
            )}

            {step === 2 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="code">کد تایید</Label>
                  <Input 
                    id="code"
                    type="text"
                    placeholder="کد ۶ رقمی"
                    dir="ltr"
                    className="text-center text-lg tracking-widest"
                  />
                  <p className="text-center text-sm text-muted-foreground">
                    کد تایید به شماره ۰۹۱۲۳۴۵۶۷۸۹ ارسال شد
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">نام و نام خانوادگی</Label>
                  <div className="relative">
                    <User className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      id="name"
                      type="text"
                      placeholder="نام و نام خانوادگی"
                      className="pr-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">ایمیل (اختیاری)</Label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      id="email"
                      type="email"
                      placeholder="example@email.com"
                      className="pr-10"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">رمز عبور</Label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="حداقل ۸ کاراکتر"
                      className="pl-10 pr-10"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Checkbox id="terms" className="mt-1" />
                  <Label htmlFor="terms" className="text-sm leading-relaxed text-muted-foreground">
                    با{" "}
                    <Link href="/terms" className="text-accent hover:underline">
                      قوانین و مقررات
                    </Link>
                    {" "}و{" "}
                    <Link href="/privacy" className="text-accent hover:underline">
                      حریم خصوصی
                    </Link>
                    {" "}سالن یاب موافقم
                  </Label>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "در حال ثبت نام..." : "تکمیل ثبت نام"}
                </Button>

                <Button 
                  type="button" 
                  variant="ghost" 
                  className="w-full"
                  onClick={() => setStep(1)}
                >
                  بازگشت
                </Button>
              </>
            )}
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            حساب کاربری دارید؟{" "}
            <Link href="/auth/login" className="font-medium text-accent hover:underline">
              وارد شوید
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="hidden flex-1 bg-secondary lg:block">
        <div className="relative flex h-full items-center justify-center p-12">
          <div className="max-w-lg text-center">
            <h2 className="text-4xl font-bold">
              به جمع هزاران کاربر سالن یاب بپیوندید
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              با ثبت نام در سالن یاب، از تخفیف‌های ویژه و امکانات خاص بهره‌مند شوید.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
