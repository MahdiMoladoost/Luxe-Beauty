import { randomUUID } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { isIranianMobile } from "@/lib/booking-engine"

type SalonApplication = {
  id: string
  trackingCode: string
  salonName: string
  ownerName: string
  ownerMobile: string
  city: string
  area: string
  address: string
  salonType: string
  services: string[]
  staffCount: number
  instagram?: string
  description?: string
  status: "submitted" | "under_review" | "approved" | "rejected"
  createdAt: string
}

declare global {
  // eslint-disable-next-line no-var
  var __luxeSalonApplications: Map<string, SalonApplication> | undefined
}

const applications = globalThis.__luxeSalonApplications ?? new Map<string, SalonApplication>()
if (process.env.NODE_ENV !== "production") globalThis.__luxeSalonApplications = applications

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const mobile = new URL(request.url).searchParams.get("mobile")?.trim()
  const list = Array.from(applications.values()).filter((item) => !mobile || item.ownerMobile === mobile).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return NextResponse.json({ ok: true, data: { applications: list } })
}

export async function POST(request: NextRequest) {
  let body: Partial<SalonApplication> & { acceptedTerms?: boolean }
  try {
    body = (await request.json()) as Partial<SalonApplication> & { acceptedTerms?: boolean }
  } catch {
    return NextResponse.json({ ok: false, error: { code: "INVALID_JSON", message: "بدنه درخواست معتبر نیست." } }, { status: 400 })
  }

  const errors: Record<string, string> = {}
  if (!body.salonName?.trim()) errors.salonName = "نام سالن الزامی است."
  if (!body.ownerName?.trim()) errors.ownerName = "نام مدیر الزامی است."
  if (!body.ownerMobile || !isIranianMobile(body.ownerMobile)) errors.ownerMobile = "شماره موبایل مدیر معتبر نیست."
  if (!body.city?.trim()) errors.city = "شهر الزامی است."
  if (!body.address?.trim()) errors.address = "آدرس سالن الزامی است."
  if (!body.salonType?.trim()) errors.salonType = "نوع سالن الزامی است."
  if (!Array.isArray(body.services) || body.services.length === 0) errors.services = "حداقل یک گروه خدمت انتخاب کنید."
  if (!body.staffCount || body.staffCount < 1) errors.staffCount = "تعداد پرسنل باید حداقل یک نفر باشد."
  if (!body.acceptedTerms) errors.acceptedTerms = "پذیرش قوانین همکاری الزامی است."

  if (Object.keys(errors).length) {
    return NextResponse.json({ ok: false, error: { code: "INVALID_APPLICATION", message: "اطلاعات درخواست کامل نیست.", fields: errors } }, { status: 422 })
  }

  const duplicate = Array.from(applications.values()).find((item) => item.ownerMobile === body.ownerMobile && item.status !== "rejected")
  if (duplicate) {
    return NextResponse.json({ ok: false, error: { code: "DUPLICATE_APPLICATION", message: `برای این شماره درخواست فعال ${duplicate.trackingCode} وجود دارد.` } }, { status: 409 })
  }

  const application: SalonApplication = {
    id: randomUUID(),
    trackingCode: `SL-${Date.now().toString(36).slice(-6).toUpperCase()}`,
    salonName: body.salonName!.trim(),
    ownerName: body.ownerName!.trim(),
    ownerMobile: body.ownerMobile!,
    city: body.city!.trim(),
    area: body.area?.trim() ?? "",
    address: body.address!.trim(),
    salonType: body.salonType!.trim(),
    services: body.services!,
    staffCount: Number(body.staffCount),
    instagram: body.instagram?.trim(),
    description: body.description?.trim(),
    status: "submitted",
    createdAt: new Date().toISOString(),
  }
  applications.set(application.id, application)
  return NextResponse.json({ ok: true, data: { application } }, { status: 201 })
}
