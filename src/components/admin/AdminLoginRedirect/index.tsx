'use client'

import { useAuth } from '@payloadcms/ui'
import { useEffect, type ReactNode } from 'react'

type AuthUser = {
  roles?: string[] | null
}

function canOpenAdminPanel(user: AuthUser | null | undefined): boolean {
  if (!user?.roles?.length) return false
  return user.roles.includes('admin') || user.roles.includes('officeStaff')
}

/**
 * Payload admin login uses client-side `router.push('/admin')` after POST
 * /api/users/login. On some self-hosted setups (VPS IP, stale RSC bundles) that
 * soft navigation fails while the session cookie is valid. Force a full document
 * navigation so the dashboard load sends the cookie on a top-level GET.
 */
export function AdminLoginRedirect({ children }: { children?: ReactNode }) {
  const { user } = useAuth()

  useEffect(() => {
    if (!canOpenAdminPanel(user as AuthUser | null | undefined)) return
    window.location.replace('/admin')
  }, [user])

  return <>{children}</>
}
