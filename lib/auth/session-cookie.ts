import { cookies } from "next/headers"
import type { NextRequest, NextResponse } from "next/server"

import { authConfig, isProduction } from "@/lib/auth/config"
import { AuthError } from "@/lib/auth/errors"
import { principalFromToken } from "@/lib/auth/service"
import type { SessionPrincipal } from "@/lib/auth/types"

export function sessionTokenFromRequest(request: NextRequest): string | undefined {
  return request.cookies.get(authConfig.sessionCookieName)?.value
}

export async function sessionTokenFromServerCookies(): Promise<string | undefined> {
  const store = await cookies()
  return store.get(authConfig.sessionCookieName)?.value
}

export function setSessionCookie(response: NextResponse, token: string, expiresAt: Date): void {
  response.cookies.set({
    name: authConfig.sessionCookieName,
    value: token,
    httpOnly: true,
    secure: isProduction(),
    sameSite: "strict",
    path: "/",
    expires: expiresAt,
    priority: "high",
  })
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set({
    name: authConfig.sessionCookieName,
    value: "",
    httpOnly: true,
    secure: isProduction(),
    sameSite: "strict",
    path: "/",
    expires: new Date(0),
  })
}

export async function requirePrincipalFromRequest(request: NextRequest): Promise<SessionPrincipal> {
  const principal = await principalFromToken(sessionTokenFromRequest(request))
  if (!principal) throw new AuthError("UNAUTHENTICATED", "ابتدا وارد حساب کاربری شوید.", 401)
  return principal
}

export async function requirePrincipalFromServerCookies(): Promise<SessionPrincipal> {
  const principal = await principalFromToken(await sessionTokenFromServerCookies())
  if (!principal) throw new AuthError("UNAUTHENTICATED", "ابتدا وارد حساب کاربری شوید.", 401)
  return principal
}
