'use client'

import { useAuth } from '@payloadcms/ui'
import { usePathname } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'

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

const REDIRECT_ATTEMPTS_KEY = 'admin-login-redirect-attempts'
const REDIRECT_WINDOW_MS = 30_000
const MAX_REDIRECTS_PER_WINDOW = 2

const LOOP_ERROR_MESSAGE =
  'This usually means the production build was compiled with a NEXT_PUBLIC_SERVER_URL / ' +
  'PAYLOAD_PUBLIC_SERVER_URL / ALLOWED_ORIGINS that does not match this browser origin. ' +
  'Update the server .env, run `pnpm build`, and restart the app. ' +
  'See README → "Payload Admin on VPS IP".'

/**
 * Track hard-redirect attempts in sessionStorage (shared by both components so
 * they cannot double each other past the threshold). Returns false when we have
 * already bounced to /admin repeatedly — the server keeps rejecting the session,
 * so redirecting again would just loop.
 */
function tryRegisterRedirect(): boolean {
  try {
    const now = Date.now()
    let state = { count: 0, firstAt: now }

    const raw = window.sessionStorage.getItem(REDIRECT_ATTEMPTS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as { count?: number; firstAt?: number }
      if (
        typeof parsed.count === 'number' &&
        typeof parsed.firstAt === 'number' &&
        now - parsed.firstAt <= REDIRECT_WINDOW_MS
      ) {
        state = { count: parsed.count, firstAt: parsed.firstAt }
      }
    }

    if (state.count >= MAX_REDIRECTS_PER_WINDOW) return false

    window.sessionStorage.setItem(
      REDIRECT_ATTEMPTS_KEY,
      JSON.stringify({ count: state.count + 1, firstAt: state.firstAt }),
    )
    return true
  } catch {
    // sessionStorage unavailable (private mode / storage policy) — allow the
    // redirect; the middleware guard cookie still breaks a real loop.
    return true
  }
}

/** @returns false when the redirect was blocked because a loop was detected. */
function redirectToAdmin(): boolean {
  if (typeof window === 'undefined') return false
  if (!tryRegisterRedirect()) {
    console.error(`[admin-login] Redirect loop detected — staying on the login page. ${LOOP_ERROR_MESSAGE}`)
    return false
  }
  window.location.replace('/admin')
  return true
}

/**
 * On the login page: poll auth once per second (max 10s) then hard-navigate.
 * Client fallback when the edge proxy cannot redirect (e.g. missing JWT roles).
 * If the server keeps bouncing us back here, stop and show the operator why.
 */
export function AdminLoginHardRedirect() {
  const [loopDetected, setLoopDetected] = useState(false)

  useEffect(() => {
    let attempts = 0
    let cancelled = false
    let done = false
    let interval: number | undefined

    const stop = () => {
      done = true
      if (interval !== undefined) window.clearInterval(interval)
    }

    const tryRedirect = async () => {
      if (cancelled || done || attempts >= 10) return
      attempts += 1

      const wantsRedirect = await shouldRedirectToAdmin()
      if (cancelled || done || !wantsRedirect) return

      // Either way we're finished: navigation is in flight, or the budget says
      // we've already bounced back here too often — keep polling and we'd paint
      // a false loop banner while a healthy (slow) navigation commits.
      stop()
      if (!redirectToAdmin()) {
        setLoopDetected(true)
      }
    }

    void tryRedirect()
    interval = window.setInterval(() => void tryRedirect(), 1000)

    return () => {
      cancelled = true
      stop()
    }
  }, [])

  if (!loopDetected) return null

  return (
    <div
      role="alert"
      style={{
        background: '#fdecea',
        border: '1px solid #b71c1c',
        borderRadius: '4px',
        color: '#611a15',
        fontSize: '14px',
        lineHeight: 1.5,
        margin: '0 0 16px',
        padding: '12px 16px',
      }}
    >
      <strong>Admin redirect loop detected.</strong> The server keeps bouncing between{' '}
      <code>/admin</code> and <code>/admin/login</code>: your login succeeds in the browser but the
      server rejects the session (origin <code>{window.location.origin}</code>).{' '}
      {LOOP_ERROR_MESSAGE}
    </div>
  )
}

/**
 * Redirect when Payload auth context has an admin user on `/admin/login`.
 * Delayed: right after a normal login Payload navigates to /admin itself while
 * the pathname still reads /admin/login — replacing immediately would race that
 * navigation and burn the redirect budget. Only fire if we're still here.
 */
export function AdminLoginRedirect({ children }: { children?: ReactNode }) {
  const pathname = usePathname()
  const { user } = useAuth()

  useEffect(() => {
    if (!pathname?.includes('/login') || user?.id == null) return
    if (!hasAdminRole(user.roles)) return

    const timeout = window.setTimeout(() => {
      redirectToAdmin()
    }, 2000)

    return () => window.clearTimeout(timeout)
  }, [pathname, user])

  return <>{children}</>
}
