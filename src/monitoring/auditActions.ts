import type { Payload, PayloadRequest } from 'payload'

import { logAdminAudit } from '@/lib/admin/logAdminAudit'

type UserLike = {
  email?: string | null
  id: number
  name?: string | null
}

/**
 * Log a user account creation to the admin audit log.
 */
export async function logUserCreated(
  payload: Payload,
  user: UserLike,
  req?: PayloadRequest,
): Promise<void> {
  await logAdminAudit({
    action: 'user_created',
    actorId: user.id,
    collection: 'users',
    documentId: user.id,
    metadata: {
      email: user.email,
      name: user.name,
    },
    payload,
    req,
    summary: `User created: ${user.name ?? user.email ?? `#${user.id}`}`,
  })
}

/**
 * Log a password change to the admin audit log.
 */
export async function logPasswordChanged(
  payload: Payload,
  userId: number,
  req?: PayloadRequest,
): Promise<void> {
  await logAdminAudit({
    action: 'password_changed',
    collection: 'users',
    documentId: userId,
    payload,
    req,
    summary: `Password changed for user #${userId}`,
  })
}

/**
 * Log a role change to the admin audit log.
 */
export async function logRoleChanged(
  payload: Payload,
  userId: number,
  oldRoles: string[],
  newRoles: string[],
  req?: PayloadRequest,
): Promise<void> {
  const added = newRoles.filter((r) => !oldRoles.includes(r))
  const removed = oldRoles.filter((r) => !newRoles.includes(r))

  await logAdminAudit({
    action: 'role_changed',
    collection: 'users',
    documentId: userId,
    metadata: {
      added: added.length ? added : undefined,
      newRoles,
      oldRoles,
      removed: removed.length ? removed : undefined,
    },
    payload,
    req,
    summary: [
      added.length ? `Added roles: ${added.join(', ')}` : '',
      removed.length ? `Removed roles: ${removed.join(', ')}` : '',
    ]
      .filter(Boolean)
      .join('; ') || `Roles updated for user #${userId}`,
  })
}

type AccessDenialInfo = {
  action: string
  ip?: string | null
  page: string
  userAgent?: string | null
  userId?: number | null
}

/**
 * Log an access control denial to the admin audit log.
 *
 * Only records denials for authenticated staff/admin users —
 * unauthenticated public access denials are too noisy to log.
 */
export async function logAccessDenied(
  payload: Payload,
  info: AccessDenialInfo,
): Promise<void> {
  if (!info.userId) return

  await logAdminAudit({
    action: 'access_denied',
    collection: 'users',
    documentId: info.userId,
    metadata: {
      action: info.action,
      ip: info.ip,
      page: info.page,
      userAgent: info.userAgent,
    },
    payload,
    summary: `Access denied for user #${info.userId}: ${info.page}/${info.action}`,
  })
}
