"use client"

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  Check,
  Clock3,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRoundCheck,
  UserRoundPlus,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type Branch = { id: string; nameFa: string; active: boolean }
type Affiliation = {
  id: string
  status: string
  requestedBy: string
  startsAt: string | null
  endsAt: string | null
  createdAt: string
  updatedAt: string
  permissions: unknown
  professional: {
    id: string
    displayNameFa: string
    verified: boolean
    active: boolean
    bio: string | null
  }
  branch: Branch | null
}
type Candidate = {
  id: string
  displayNameFa: string
  bio: string | null
  verified: boolean
  active: boolean
  existingAffiliation: { id: string; status: string; branchId: string | null } | null
}
type Workspace = {
  provider: { id: string; nameFa: string; status: string; bookingEnabled: boolean }
  affiliations: Affiliation[]
  candidates: Candidate[]
  searchQuery: string
}
type ApiEnvelope<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } }

const statusLabels: Record<string, string> = {
  REQUESTED_BY_PROVIDER: "دعوت ارسال‌شده",
  REQUESTED_BY_PROFESSIONAL: "درخواست متخصص",
  PENDING_COUNTERPART: "در انتظار طرف مقابل",
  ACTIVE: "همکاری فعال",
  REJECTED: "ردشده",
  TERMINATION_REQUESTED: "درخواست قطع همکاری",
  ENDED: "پایان‌یافته",
  DISPUTED: "نیازمند بررسی",
}

function statusClass(status: string) {
  if (status === "ACTIVE") return "border-emerald-200 bg-emerald-50 text-emerald-700"
  if (
    [
      "REQUESTED_BY_PROVIDER",
      "REQUESTED_BY_PROFESSIONAL",
      "PENDING_COUNTERPART",
      "TERMINATION_REQUESTED",
    ].includes(status)
  ) {
    return "border-amber-200 bg-amber-50 text-amber-700"
  }
  if (["REJECTED", "ENDED"].includes(status)) {
    return "border-stone-200 bg-stone-50 text-stone-600"
  }
  return "border-rose-200 bg-rose-50 text-rose-700"
}

async function apiRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: "same-origin",
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  })
  const payload = (await response.json()) as ApiEnvelope<T>
  if (!payload.ok) {
    const error = new Error(payload.error.message) as Error & { code?: string }
    error.code = payload.error.code
    throw error
  }
  return payload.data
}

function providerActions(affiliation: Affiliation) {
  if (affiliation.status === "REQUESTED_BY_PROFESSIONAL") {
    return ["ACCEPT", "REJECT"] as const
  }
  if (affiliation.status === "ACTIVE") return ["REQUEST_TERMINATION"] as const
  if (
    affiliation.status === "TERMINATION_REQUESTED" &&
    affiliation.requestedBy === "TERMINATION_PROFESSIONAL"
  ) {
    return ["ACCEPT_TERMINATION", "REJECT_TERMINATION"] as const
  }
  return [] as const
}

const actionLabels: Record<string, string> = {
  ACCEPT: "پذیرش همکاری",
  REJECT: "رد درخواست",
  REQUEST_TERMINATION: "درخواست قطع همکاری",
  ACCEPT_TERMINATION: "تأیید قطع همکاری",
  REJECT_TERMINATION: "رد قطع همکاری",
}

export function ProfessionalManager({ providerId }: { providerId: string }) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [searchDraft, setSearchDraft] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [inviteCandidate, setInviteCandidate] = useState<Candidate | null>(null)
  const [inviteBranchId, setInviteBranchId] = useState("")
  const [pendingTransition, setPendingTransition] = useState<{
    affiliation: Affiliation
    action: string
  } | null>(null)
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const query = searchQuery ? `&query=${encodeURIComponent(searchQuery)}` : ""
      const [workspaceData, branchRows] = await Promise.all([
        apiRequest<Workspace>(
          `/api/v1/provider-panel/professionals?providerId=${providerId}${query}`,
        ),
        apiRequest<Array<{ id: string; nameFa: string; active: boolean }>>(
          `/api/v1/providers/${providerId}/branches`,
        ),
      ])
      setWorkspace(workspaceData)
      setBranches(branchRows.filter((branch) => branch.active))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "بارگیری متخصصان ناموفق بود.")
    } finally {
      setLoading(false)
    }
  }, [providerId, searchQuery])

  useEffect(() => {
    void load()
  }, [load])

  const currentAffiliations = useMemo(
    () =>
      workspace?.affiliations.filter((item) =>
        [
          "REQUESTED_BY_PROVIDER",
          "REQUESTED_BY_PROFESSIONAL",
          "PENDING_COUNTERPART",
          "ACTIVE",
          "TERMINATION_REQUESTED",
          "DISPUTED",
        ].includes(item.status),
      ) ?? [],
    [workspace],
  )

  function submitSearch(event: FormEvent) {
    event.preventDefault()
    const value = searchDraft.trim()
    if (value && value.length < 2) {
      setError("برای جست‌وجو حداقل دو کاراکتر وارد کنید.")
      return
    }
    setSearchQuery(value)
  }

  async function sendInvite() {
    if (!inviteCandidate) return
    setSaving(true)
    setActionError(null)
    try {
      await apiRequest<Affiliation>("/api/v1/professional-affiliations", {
        method: "POST",
        body: JSON.stringify({
          organizationId: providerId,
          branchId: inviteBranchId || null,
          professionalProfileId: inviteCandidate.id,
          permissions: { booking: true, schedule: true },
        }),
      })
      setInviteCandidate(null)
      setInviteBranchId("")
      setNotice("دعوت همکاری برای متخصص ارسال شد.")
      await load()
    } catch (inviteError) {
      setActionError(
        inviteError instanceof Error ? inviteError.message : "ارسال دعوت ناموفق بود.",
      )
    } finally {
      setSaving(false)
    }
  }

  async function runTransition() {
    if (!pendingTransition) return
    setSaving(true)
    setActionError(null)
    try {
      await apiRequest<Affiliation>(
        `/api/v1/professional-affiliations/${pendingTransition.affiliation.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ action: pendingTransition.action }),
        },
      )
      setNotice(
        `${actionLabels[pendingTransition.action] ?? "تغییر وضعیت"} با موفقیت ثبت شد.`,
      )
      setPendingTransition(null)
      await load()
    } catch (transitionError) {
      setActionError(
        transitionError instanceof Error
          ? transitionError.message
          : "تغییر وضعیت همکاری ناموفق بود.",
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {notice ? (
        <div
          role="status"
          className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          <span className="flex items-center gap-2">
            <Check className="size-5" />
            {notice}
          </span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="font-black"
            aria-label="بستن پیام"
          >
            ×
          </button>
        </div>
      ) : null}

      <section className="rounded-[26px] border border-[#5b4033]/10 bg-white p-5 shadow-[0_15px_45px_rgba(66,43,32,0.055)]">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <h2 className="text-xl font-black text-[#34231d]">دعوت متخصص</h2>
            <p className="mt-1 text-sm leading-7 text-[#806e64]">
              فقط متخصصان فعال و احراز هویت‌شده با نام عمومی قابل جست‌وجو هستند؛ موبایل و اطلاعات خصوصی نمایش داده نمی‌شود.
            </p>
          </div>
          <form onSubmit={submitSearch} className="flex w-full max-w-xl gap-2">
            <label className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#9b887e]" />
              <Input
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                placeholder="نام متخصص"
                className="h-11 pr-10"
              />
            </label>
            <Button
              type="submit"
              className="h-11 bg-[#3a251e] text-white hover:bg-[#4a3027]"
            >
              جست‌وجو
            </Button>
          </form>
        </div>

        {searchQuery && !loading ? (
          <div className="mt-5 border-t border-[#5b4033]/10 pt-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-bold text-[#4a342a]">
                نتایج جست‌وجوی «{searchQuery}»
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchDraft("")
                  setSearchQuery("")
                }}
              >
                پاک‌کردن
              </Button>
            </div>
            {workspace?.candidates.length ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {workspace.candidates.map((candidate) => (
                  <article
                    key={candidate.id}
                    className="rounded-2xl border border-[#5b4033]/10 bg-[#fcfaf7] p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#3a251e] text-[#e8c58d]">
                        <UserRoundCheck className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate font-black text-[#3d2a22]">
                            {candidate.displayNameFa}
                          </h3>
                          <ShieldCheck className="size-4 shrink-0 text-emerald-600" />
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs leading-6 text-[#7d6b61]">
                          {candidate.bio || "توضیح عمومی ثبت نشده است."}
                        </p>
                      </div>
                    </div>
                    {candidate.existingAffiliation ? (
                      <Badge
                        variant="outline"
                        className={cn(
                          "mt-4",
                          statusClass(candidate.existingAffiliation.status),
                        )}
                      >
                        {statusLabels[candidate.existingAffiliation.status] ??
                          candidate.existingAffiliation.status}
                      </Badge>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-4 w-full"
                        onClick={() => {
                          setInviteCandidate(candidate)
                          setInviteBranchId("")
                          setActionError(null)
                        }}
                      >
                        <UserRoundPlus className="size-4" />
                        دعوت به همکاری
                      </Button>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#5b4033]/20 p-7 text-center text-sm text-[#806e64]">
                متخصص تأییدشده‌ای با این نام پیدا نشد.
              </div>
            )}
          </div>
        ) : null}
      </section>

      <section>
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-black text-[#34231d]">
              متخصصان و درخواست‌های همکاری
            </h2>
            <p className="mt-1 text-sm text-[#806e64]">
              همکاری تنها پس از تأیید طرف مقابل فعال می‌شود.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={cn("size-4", loading && "animate-spin")} />
            تازه‌سازی
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-56 animate-pulse rounded-[24px] bg-stone-200/70" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-[26px] border border-rose-200 bg-rose-50 p-8 text-center">
            <AlertCircle className="mx-auto size-10 text-rose-500" />
            <p className="mt-4 font-bold text-rose-900">بارگیری متخصصان ناموفق بود</p>
            <p className="mt-2 text-sm text-rose-700">{error}</p>
            <Button
              type="button"
              variant="outline"
              className="mt-5"
              onClick={() => {
                setError(null)
                void load()
              }}
            >
              تلاش دوباره
            </Button>
          </div>
        ) : currentAffiliations.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-[#5b4033]/20 bg-white p-10 text-center">
            <UserRoundPlus className="mx-auto size-12 text-[#a98f80]" />
            <h3 className="mt-4 text-lg font-black text-[#463128]">
              هنوز همکاری فعالی وجود ندارد
            </h3>
            <p className="mt-2 text-sm text-[#806e64]">
              از جست‌وجوی بالا متخصص تأییدشده دعوت کنید.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {currentAffiliations.map((affiliation) => {
              const actions = providerActions(affiliation)
              return (
                <article
                  key={affiliation.id}
                  className="flex flex-col rounded-[24px] border border-[#5b4033]/10 bg-white p-5 shadow-[0_14px_42px_rgba(66,43,32,0.055)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#3a251e] text-[#e8c58d]">
                        <UserRoundCheck className="size-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate font-black text-[#3d2a22]">
                            {affiliation.professional.displayNameFa}
                          </h3>
                          {affiliation.professional.verified ? (
                            <ShieldCheck className="size-4 shrink-0 text-emerald-600" />
                          ) : null}
                        </div>
                        <p className="mt-1 text-xs text-[#806e64]">
                          {affiliation.branch?.nameFa ?? "همکاری در سطح مجموعه"}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className={statusClass(affiliation.status)}>
                      {statusLabels[affiliation.status] ?? affiliation.status}
                    </Badge>
                  </div>
                  <p className="mt-4 line-clamp-3 text-sm leading-7 text-[#746157]">
                    {affiliation.professional.bio || "توضیح عمومی ثبت نشده است."}
                  </p>
                  <div className="mt-auto flex flex-wrap gap-2 border-t border-[#5b4033]/10 pt-4">
                    {actions.length === 0 ? (
                      <span className="flex items-center gap-1 text-xs text-[#8b786e]">
                        <Clock3 className="size-4" />
                        منتظر اقدام طرف مقابل
                      </span>
                    ) : (
                      actions.map((action) => (
                        <Button
                          key={action}
                          type="button"
                          size="sm"
                          variant={
                            action.includes("REJECT") || action === "REQUEST_TERMINATION"
                              ? "outline"
                              : "default"
                          }
                          className={cn(
                            action === "ACCEPT" &&
                              "bg-emerald-700 text-white hover:bg-emerald-800",
                            action.includes("TERMINATION") && "text-rose-700",
                          )}
                          onClick={() => {
                            setPendingTransition({ affiliation, action })
                            setActionError(null)
                          }}
                        >
                          {actionLabels[action]}
                        </Button>
                      ))
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <Dialog
        open={Boolean(inviteCandidate)}
        onOpenChange={(open) => {
          if (!open && !saving) setInviteCandidate(null)
        }}
      >
        <DialogContent dir="rtl" className="sm:max-w-lg">
          <DialogHeader className="text-right sm:text-right">
            <DialogTitle>دعوت متخصص به همکاری</DialogTitle>
            <DialogDescription>
              دعوت برای «{inviteCandidate?.displayNameFa}» ارسال می‌شود و تا پذیرش متخصص فعال نخواهد شد.
            </DialogDescription>
          </DialogHeader>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold">شعبه اختیاری</span>
            <select
              value={inviteBranchId}
              onChange={(event) => setInviteBranchId(event.target.value)}
              className="h-11 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="">همکاری در سطح مجموعه</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.nameFa}
                </option>
              ))}
            </select>
          </label>
          {actionError ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
              {actionError}
            </p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setInviteCandidate(null)}
              disabled={saving}
            >
              انصراف
            </Button>
            <Button
              type="button"
              onClick={() => void sendInvite()}
              disabled={saving}
              className="bg-[#3a251e] text-white hover:bg-[#4a3027]"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin" />
                  در حال ارسال
                </>
              ) : (
                <>
                  <Plus className="size-4" />
                  ارسال دعوت
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(pendingTransition)}
        onOpenChange={(open) => {
          if (!open && !saving) setPendingTransition(null)
        }}
      >
        <DialogContent dir="rtl" className="sm:max-w-md">
          <DialogHeader className="text-right sm:text-right">
            <DialogTitle>
              {pendingTransition ? actionLabels[pendingTransition.action] : "تغییر همکاری"}
            </DialogTitle>
            <DialogDescription>این تغییر در تاریخچه و Audit ثبت می‌شود.</DialogDescription>
          </DialogHeader>
          <div
            className={cn(
              "rounded-2xl border p-4 text-sm leading-7",
              pendingTransition?.action.includes("REJECT") ||
                pendingTransition?.action.includes("TERMINATION")
                ? "border-rose-200 bg-rose-50 text-rose-900"
                : "border-emerald-200 bg-emerald-50 text-emerald-900",
            )}
          >
            {pendingTransition?.action === "ACCEPT"
              ? "پس از پذیرش، متخصص برای اتصال به خدمات و تقویم مشترک قابل استفاده خواهد بود."
              : pendingTransition?.action === "REQUEST_TERMINATION"
                ? "قطع همکاری تنها پس از تأیید متخصص نهایی می‌شود."
                : pendingTransition?.action === "ACCEPT_TERMINATION"
                  ? "با تأیید، همکاری پایان می‌یابد و برای رزروهای جدید قابل استفاده نخواهد بود."
                  : "آیا از ثبت این تصمیم مطمئن هستید؟"}
          </div>
          {actionError ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
              {actionError}
            </p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPendingTransition(null)}
              disabled={saving}
            >
              انصراف
            </Button>
            <Button
              type="button"
              variant={
                pendingTransition?.action.includes("REJECT") ||
                pendingTransition?.action.includes("TERMINATION")
                  ? "destructive"
                  : "default"
              }
              onClick={() => void runTransition()}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin" />
                  در حال ثبت
                </>
              ) : pendingTransition ? (
                actionLabels[pendingTransition.action]
              ) : (
                "ثبت"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
