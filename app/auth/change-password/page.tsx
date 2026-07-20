"use client"

import { type FormEvent, useState } from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type ApiPayload<T> = { ok: true; data: T } | { ok: false; error: { message: string } }

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (newPassword !== confirmPassword) {
      setError("تکرار رمز جدید یکسان نیست.")
      return
    }

    setLoading(true)
    setError("")
    try {
      const response = await fetch("/api/auth/password/change", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const payload = await response.json() as ApiPayload<{ passwordChanged: true }>
      if (!payload.ok) throw new Error(payload.error.message)
      window.location.assign("/auth/login?password=changed")
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "تغییر رمز انجام نشد.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12" dir="rtl">
      <section className="w-full max-w-md rounded-2xl border bg-background p-6 shadow-sm md:p-8">
        <Link href="/" className="text-xl font-bold">لوکس بیوتی</Link>
        <h1 className="mt-8 text-3xl font-bold">تغییر رمز عبور</h1>
        <p className="mt-2 text-sm text-muted-foreground">رمز اولیه مدیر کل باید در نخستین ورود تغییر کند. با تغییر رمز، همه نشست‌ها خارج می‌شوند.</p>
        {error && <p role="alert" className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="space-y-2"><Label htmlFor="current">رمز فعلی</Label><Input id="current" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} dir="ltr" autoComplete="current-password" required /></div>
          <div className="space-y-2"><Label htmlFor="next">رمز جدید</Label><Input id="next" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} dir="ltr" autoComplete="new-password" minLength={12} required /></div>
          <div className="space-y-2"><Label htmlFor="confirm">تکرار رمز جدید</Label><Input id="confirm" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} dir="ltr" autoComplete="new-password" minLength={12} required /></div>
          <Button className="w-full" disabled={loading}>{loading ? "در حال ذخیره..." : "تغییر رمز و خروج از همه دستگاه‌ها"}</Button>
        </form>
      </section>
    </main>
  )
}
