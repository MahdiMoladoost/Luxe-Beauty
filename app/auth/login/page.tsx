"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Phone, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    // Simulate login
    setTimeout(() => setIsLoading(false), 1500)
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

          <h1 className="mt-8 text-3xl font-bold">خوش آمدید</h1>
          <p className="mt-2 text-muted-foreground">
            برای ادامه وارد حساب کاربری خود شوید
          </p>

          <Tabs defaultValue="phone" className="mt-8">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="phone">شماره موبایل</TabsTrigger>
              <TabsTrigger value="email">ایمیل</TabsTrigger>
            </TabsList>

            <TabsContent value="phone" className="mt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
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
              </form>
            </TabsContent>

            <TabsContent value="email" className="mt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">ایمیل</Label>
                  <Input 
                    id="email"
                    type="email"
                    placeholder="example@email.com"
                    dir="ltr"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">رمز عبور</Label>
                    <Link href="/auth/forgot-password" className="text-sm text-accent hover:underline">
                      فراموشی رمز عبور
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="رمز عبور"
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

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "در حال ورود..." : "ورود به حساب"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  یا
                </span>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              <Button variant="outline" className="w-full">
                <svg className="ml-2 h-5 w-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                ورود با گوگل
              </Button>
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            حساب کاربری ندارید؟{" "}
            <Link href="/auth/register" className="font-medium text-accent hover:underline">
              ثبت نام کنید
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="hidden flex-1 bg-secondary lg:block">
        <div className="relative flex h-full items-center justify-center p-12">
          <div className="max-w-lg text-center">
            <h2 className="text-4xl font-bold">
              بهترین آرایشگاه‌ها را پیدا کنید
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              با سالن یاب، نوبت‌دهی آنلاین آرایشگاه هیچوقت به این راحتی نبوده است.
              از میان هزاران سالن، بهترین را انتخاب کنید.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
