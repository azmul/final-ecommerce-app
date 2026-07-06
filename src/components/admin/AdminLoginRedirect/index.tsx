'use client'

import { useAuth } from '@payloadcms/ui'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, type ReactNode } from 'react'

const REDIRECT_GUARD_KEY = 'admin-login-hard-redirect'

async function canAccessAdminFromApi(): Promise<boolean> {
  const res = await fetch('/api/access', { credentials: 'include' })
  if (!res.ok) return false

  const data = (await res.json()) as { canAccessAdmin?: boolean }
  return data.canAccessAdmin === true
}

function redirectToAdminOnce(): void {
  if (typeof window === 'undefined') return
  if (window.sessionStorage.getItem(REDIRECT_GUARD_KEY) === '1') return

  window.sessionStorage.setItem(REDIRECT_GUARD_KEY, '1')
  window.location.replace('/admin')
}

/**
 * On the login page: check `/api/access` once per second (max 10s) then hard-navigate.
 * Uses access permissions instead of `/api/users/me` roles (roles were admin-only to read).
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

      if (await canAccessAdminFromApi()) {
        redirectToAdminOnce()
        return
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

/** Instant redirect when Payload auth context already has the user on `/admin/login`. */
export function AdminLoginRedirect({ children }: { children?: ReactNode }) {
  const pathname = usePathname()
  const { user } = useAuth()

  useEffect(() => {
    if (!pathname?.includes('/login') || !user?.id) return
    redirectToAdminOnce()
  }, [pathname, user])

  return <>{children}</>
}
