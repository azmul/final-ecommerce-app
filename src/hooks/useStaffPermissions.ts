'use client'

import { useCallback, useEffect, useState } from 'react'

import type { StaffAction, StaffPage, StaffPermissionMap } from '@/lib/permissions/types'

type StaffPermissionsResponse = {
  userId: number | string
  roles?: string[]
  isAdmin: boolean
  isOfficeStaff: boolean
  staffPermissions: StaffPermissionMap
}

export function useStaffPermissions() {
  const [data, setData] = useState<StaffPermissionsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/staff/me/permissions', { credentials: 'include' })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? `Request failed (${res.status})`)
      }
      const json = (await res.json()) as StaffPermissionsResponse
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load permissions')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const can = useCallback(
    (page: StaffPage, action: StaffAction) => {
      if (!data) return false
      if (data.isAdmin) return true
      return data.staffPermissions[page]?.includes(action) ?? false
    },
    [data],
  )

  return { can, data, error, loading, refresh }
}
