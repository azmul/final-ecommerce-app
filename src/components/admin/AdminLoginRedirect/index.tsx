'use client'

import { useAuth } from '@payloadcms/ui'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, type ReactNode } from 'react'

type MeResponse = {
  user?: {
    id?: number | string
    roles?: string[]
  } | null
}

type AccessResponse = {
  canAccessAdmin?: boolean
}

function hasAdminRole(roles: string[] | undefined): boolean {
  if (!roles?.length) return false
  return roles.includes('admin') || roles.includes('officeStaff')
}

async function shouldRedirectToAdmin(): Promise<boolean> {
  const meRes = await fetch('/api/users/me', { credentials: 'include' })
  if (meRes.ok) {
    const me = (await meRes.json()) as MeResponse
    if (me.user?.id != null && hasAdminRole(me.user.roles)) {
      return true
    }
  }

  const accessRes = await fetch('/api/access', { credentials: 'include' })
  if (!accessRes.ok) return false

  const access = (await accessRes.json()) as AccessResponse
  return access.canAccessAdmin === true
}

function redirectToAdmin(): void {
  if (typeof window === 'undefined') return
  window.location.replace('/admin')
}

/**
 * On the login page: poll auth once per second (max 10s) then hard-navigate.
 * Client fallback when the edge proxy cannot redirect (e.g. missing JWT roles).
 */
export function AdminLoginHardRedirect() {
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    let attempts = 0
    let cancelled = false

    const tryRedirect = async () => {
      if (cancelled || attempts >= 10) return
      attempts += 1

      if (await shouldRedirectToAdmin()) {
        redirectToAdmin()
      }
    }

    void tryRedirect()
    const interval = window.setInterval(() => void tryRedirect(), 1000)

    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [])

  return null
}

/** Instant redirect when Payload auth context already has an admin user on `/admin/login`. */
export function AdminLoginRedirect({ children }: { children?: ReactNode }) {
  const pathname = usePathname()
  const { user } = useAuth()

  useEffect(() => {
    if (!pathname?.includes('/login') || user?.id == null) return
    if (!hasAdminRole(user.roles)) return
    redirectToAdmin()
  }, [pathname, user])

  return <>{children}</>
}
