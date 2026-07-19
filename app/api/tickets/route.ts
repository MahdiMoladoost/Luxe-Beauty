import { randomUUID } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"

type Ticket = {
  id: string
  trackingCode: string
  requesterName: string
  mobile: string
  type: string
  subject: string
  message: string
  status: "open" | "pending" | "resolved"
  priority: "normal" | "high"
  createdAt: string
}

declare global {
  // eslint-disable-next-line no-var
  var __luxeTickets: Map<string, Ticket> | undefined
}

const tickets = globalThis.__luxeTickets ?? new Map<string, Ticket>()
if (process.env.NODE_ENV !== "production") globalThis.__luxeTickets = tickets

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const mobile = new URL(request.url).searchParams.get("mobile")?.trim()
  const list = Array.from(tickets.values())
    .filter((ticket) => !mobile || ticket.mobile === mobile)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return NextResponse.json({ ok: true, data: { tickets: list } })
}

export async function POST(request: NextRequest) {
  let body: Partial<Ticket>
  try {
    body = (await request.json()) as Partial<Ticket>
  } catch {
    return NextResponse.json({ ok: false, error: { code: "INVALID_JSON", message: "بدنه درخواست معتبر نیست." } }, { status: 400 })
  }

  if (!body.requesterName?.trim() || !/^09\d{9}$/.test(body.mobile ?? "") || !body.type?.trim() || !body.subject?.trim() || !body.message?.trim()) {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_TICKET", message: "نام، موبایل معتبر، نوع درخواست، موضوع و متن پیام الزامی است." } },
      { status: 422 },
    )
  }

  const ticket: Ticket = {
    id: randomUUID(),
    trackingCode: `TK-${Date.now().toString(36).slice(-6).toUpperCase()}`,
    requesterName: body.requesterName.trim(),
    mobile: body.mobile,
    type: body.type.trim(),
    subject: body.subject.trim(),
    message: body.message.trim(),
    status: "open",
    priority: body.type === "مشکل پرداخت" || body.type === "گزارش تخلف" ? "high" : "normal",
    createdAt: new Date().toISOString(),
  }
  tickets.set(ticket.id, ticket)
  return NextResponse.json({ ok: true, data: { ticket } }, { status: 201 })
}
