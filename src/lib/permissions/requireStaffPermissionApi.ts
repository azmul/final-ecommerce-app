import { headers as nextHeaders } from 'next/headers'
import { getPayload } from 'payload'

import { hasStaffPermission, isFullAdmin } from '@/lib/permissions/check'
import { logSecurityEvent } from '@/monitoring/logSecurityEvent'
import { clientIpFromHeaders } from '@/lib/risk/captureRequestContext'
import type { StaffAction, StaffPage } from '@/lib/permissions/types'
import config from '@payload-config'
import type { User } from '@/payload-types'

export type StaffAuthResult =
  | { ok: true; user: User }
  | { ok: false; status: 401 | 403; message: string }

export async function getAuthenticatedUser(requestHeaders?: Headers): Promise<User | null> {
  const payload = await getPayload({ config })
  const headersList = requestHeaders ?? (await nextHeaders())
  const { user } = await payload.auth({ headers: headersList })
  return (user as User | null) ?? null
}

function extractIp(headers?: Headers): string | null {
  return headers ? clientIpFromHeaders(headers) : null
}

function extractUserAgent(headers?: Headers): string | null {
  return headers?.get('user-agent') ?? null
}

export async function requireStaffPermissionApi(
  page: StaffPage,
  action: StaffAction,
  requestHeaders?: Headers,
): Promise<StaffAuthResult> {
  const payload = await getPayload({ config })
  const headersList = requestHeaders ?? (await nextHeaders())
  const { user } = await payload.auth({ headers: headersList })

  if (!user) {
    return { ok: false, status: 401, message: 'Authentication required.' }
  }

  const userTyped = user as User

  if (isFullAdmin(userTyped) || hasStaffPermission(userTyped, page, action)) {
    return { ok: true, user: userTyped }
  }

  await logSecurityEvent(payload, {
    eventType: 'access_denied',
    actor: userTyped.id,
    ip: extractIp(headersList),
    metadata: { action, page },
    summary: `Staff permission denied: user #${userTyped.id} attempted ${action} on ${page}`,
    userAgent: extractUserAgent(headersList),
  })

  return { ok: false, status: 403, message: 'You do not have permission to perform this action.' }
}

export async function requireFullAdminApi(requestHeaders?: Headers): Promise<StaffAuthResult> {
  const payload = await getPayload({ config })
  const headersList = requestHeaders ?? (await nextHeaders())
  const { user } = await payload.auth({ headers: headersList })

  if (!user) {
    return { ok: false, status: 401, message: 'Authentication required.' }
  }

  const userTyped = user as User

  if (isFullAdmin(userTyped)) {
    return { ok: true, user: userTyped }
  }

  await logSecurityEvent(payload, {
    eventType: 'access_denied',
    actor: userTyped.id,
    ip: extractIp(headersList),
    metadata: { action: 'admin', page: 'admin' },
    summary: `Admin access denied: user #${userTyped.id} attempted admin operation`,
    userAgent: extractUserAgent(headersList),
  })

  return { ok: false, status: 403, message: 'Admin access required.' }
}
