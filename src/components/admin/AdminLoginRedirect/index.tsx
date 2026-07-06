'use client'

import { useAuth } from '@payloadcms/ui'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, type ReactNode } from 'react'

type AuthUser = {
  roles?: string[] | null
}

export function canOpenAdminPanel(user: AuthUser | null | undefined): boolean {
  if (!user?.roles?.length) return false
  return user.roles.includes('admin') || user.roles.includes('officeStaff')
}

async function fetchAuthenticatedAdminUser(): Promise<AuthUser | null> {
  const res = await fetch('/api/users/me', { credentials: 'include' })
  if (!res.ok) return null

  const data = (await res.json()) as { user?: AuthUser | null }
  return data.user ?? null
}

function useAdminLoginHardRedirect(enabled: boolean): void {
  const redirected = useRef(false)

  useEffect(() => {
    if (!enabled || redirected.current) return

    const tryRedirect = async () => {
      if (redirected.current) return

      const user = await fetchAuthenticatedAdminUser()
      if (!canOpenAdminPanel(user)) return

      redirected.current = true
      window.location.replace('/admin')
    }

    void tryRedirect()

    const interval = window.setInterval(() => void tryRedirect(), 400)
    const timeout = window.setTimeout(() => window.clearInterval(interval), 30_000)

    return () => {
      window.clearInterval(interval)
      window.clearTimeout(timeout)
    }
  }, [enabled])
}

/** Mounted on the login page; polls `/api/users/me` and hard-navigates to `/admin`. */
export function AdminLoginHardRedirect() {
  useAdminLoginHardRedirect(true)
  return null
}

/**
 * Provider fallback: same hard redirect when auth context updates or while on
 * `/admin/login`. Payload's default `router.push('/admin')` can fail on VPS IP.
 */
export function AdminLoginRedirect({ children }: { children?: ReactNode }) {
  const pathname = usePathname()
  const { user } = useAuth()
  const onLoginPage = pathname?.includes('/login') ?? false

  useAdminLoginHardRedirect(onLoginPage)

  useEffect(() => {
    if (!canOpenAdminPanel(user as AuthUser | null | undefined)) return
    window.location.replace('/admin')
  }, [user])

  return <>{children}</>
}
