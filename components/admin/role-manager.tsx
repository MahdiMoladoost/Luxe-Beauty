"use client"

import { type FormEvent, useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Permission = { id: string; key: string; description: string | null }
type Role = {
  id: string
  key: string
  nameFa: string
  description: string | null
  system: boolean
  permissions: Array<{ permission: Permission }>
}
type ApiPayload<T> = { ok: true; data: T } | { ok: false; error: { message: string } }

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: "no-store", ...init })
  const payload = await response.json() as ApiPayload<T>
  if (!payload.ok) throw new Error(payload.error.message)
  return payload.data
}

async function loadRbacData(): Promise<[Role[], Permission[]]> {
  return Promise.all([
    api<Role[]>("/api/admin/rbac/roles"),
    api<Permission[]>("/api/admin/rbac/permissions"),
  ])
}

export function RoleManager() {
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [key, setKey] = useState("")
  const [nameFa, setNameFa] = useState("")
  const [description, setDescription] = useState("")
  const [selected, setSelected] = useState<string[]>([])
  const [permissionKey, setPermissionKey] = useState("")
  const [permissionDescription, setPermissionDescription] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function refresh() {
    const [roleRows, permissionRows] = await loadRbacData()
    setRoles(roleRows)
    setPermissions(permissionRows)
  }

  useEffect(() => {
    let cancelled = false

    void loadRbacData()
      .then(([roleRows, permissionRows]) => {
        if (cancelled) return
        setRoles(roleRows)
        setPermissions(permissionRows)
      })
      .catch((reason: unknown) => {
        if (cancelled) return
        setError(reason instanceof Error ? reason.message : "دریافت نقش‌ها انجام نشد.")
      })

    return () => {
      cancelled = true
    }
  }, [])

  const selectedSet = useMemo(() => new Set(selected), [selected])

  async function createRole(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError("")
    try {
      await api("/api/admin/rbac/roles", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ key, nameFa, description, permissionKeys: selected }),
      })
      setKey("")
      setNameFa("")
      setDescription("")
      setSelected([])
      await refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ساخت نقش انجام نشد.")
    } finally {
      setLoading(false)
    }
  }

  async function createPermission(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError("")
    try {
      await api("/api/admin/rbac/permissions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ key: permissionKey, description: permissionDescription }),
      })
      setPermissionKey("")
      setPermissionDescription("")
      await refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ساخت مجوز انجام نشد.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]" dir="rtl">
      <section className="rounded-2xl border bg-background p-5">
        <h2 className="text-xl font-bold">نقش‌های فعال</h2>
        <div className="mt-4 space-y-3">
          {roles.map((role) => (
            <article key={role.id} className="rounded-xl border p-4">
              <div className="flex items-center justify-between gap-3">
                <div><h3 className="font-semibold">{role.nameFa}</h3><p className="text-xs text-muted-foreground" dir="ltr">{role.key}</p></div>
                <span className="rounded-full bg-muted px-2 py-1 text-xs">{role.system ? "سیستمی" : "سفارشی"}</span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{role.description || "بدون توضیح"}</p>
              <div className="mt-3 flex flex-wrap gap-2">{role.permissions.map(({ permission }) => <span key={permission.id} className="rounded-md bg-muted px-2 py-1 text-xs" dir="ltr">{permission.key}</span>)}</div>
            </article>
          ))}
        </div>
      </section>

      <div className="space-y-6">
        <form onSubmit={createPermission} className="rounded-2xl border bg-background p-5">
          <h2 className="text-xl font-bold">مجوز سفارشی</h2>
          <div className="mt-4 space-y-3">
            <div className="space-y-2"><Label htmlFor="permission-key">کلید مجوز</Label><Input id="permission-key" value={permissionKey} onChange={(event) => setPermissionKey(event.target.value)} dir="ltr" placeholder="resource.action" required /></div>
            <div className="space-y-2"><Label htmlFor="permission-description">توضیح</Label><Input id="permission-description" value={permissionDescription} onChange={(event) => setPermissionDescription(event.target.value)} required /></div>
            <Button disabled={loading}>ایجاد مجوز</Button>
          </div>
        </form>

        <form onSubmit={createRole} className="rounded-2xl border bg-background p-5">
          <h2 className="text-xl font-bold">نقش سفارشی</h2>
          {error && <p role="alert" className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          <div className="mt-4 space-y-3">
            <div className="space-y-2"><Label htmlFor="role-key">کلید نقش</Label><Input id="role-key" value={key} onChange={(event) => setKey(event.target.value)} dir="ltr" placeholder="custom_role" required /></div>
            <div className="space-y-2"><Label htmlFor="role-name">نام فارسی</Label><Input id="role-name" value={nameFa} onChange={(event) => setNameFa(event.target.value)} required /></div>
            <div className="space-y-2"><Label htmlFor="role-description">توضیح</Label><Input id="role-description" value={description} onChange={(event) => setDescription(event.target.value)} /></div>
            <fieldset className="space-y-2"><legend className="text-sm font-medium">مجوزها</legend><div className="max-h-64 space-y-2 overflow-auto rounded-xl border p-3">{permissions.map((permission) => <label key={permission.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={selectedSet.has(permission.key)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, permission.key] : current.filter((item) => item !== permission.key))} /><span dir="ltr">{permission.key}</span></label>)}</div></fieldset>
            <Button disabled={loading}>ایجاد نقش</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
