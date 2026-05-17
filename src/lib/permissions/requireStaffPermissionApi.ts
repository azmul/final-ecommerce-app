import { headers } from 'next/headers'
import { getPayload } from 'payload'

import { hasStaffPermission, isFullAdmin } from '@/lib/permissions/check'
import type { StaffAction, StaffPage } from '@/lib/permissions/types'
import config from '@payload-config'
import type { User } from '@/payload-types'

export type StaffAuthResult =
  | { ok: true; user: User }
  | { ok: false; status: 401 | 403; message: string }

export async function getAuthenticatedUser(requestHeaders?: Headers): Promise<User | null> {
  const payload = await getPayload({ config })
  const headersList = requestHeaders ?? (await headers())
  const { user } = await payload.auth({ headers: headersList })
  return (user as User | null) ?? null
}

export async function requireStaffPermissionApi(
  page: StaffPage,
  action: StaffAction,
  requestHeaders?: Headers,
): Promise<StaffAuthResult> {
  const user = await getAuthenticatedUser(requestHeaders)

  if (!user) {
    return { ok: false, status: 401, message: 'Authentication required.' }
  }

  if (isFullAdmin(user) || hasStaffPermission(user, page, action)) {
    return { ok: true, user }
  }

  return { ok: false, status: 403, message: 'You do not have permission to perform this action.' }
}

export async function requireFullAdminApi(requestHeaders?: Headers): Promise<StaffAuthResult> {
  const user = await getAuthenticatedUser(requestHeaders)

  if (!user) {
    return { ok: false, status: 401, message: 'Authentication required.' }
  }

  if (!isFullAdmin(user)) {
    return { ok: false, status: 403, message: 'Admin access required.' }
  }

  return { ok: true, user }
}
