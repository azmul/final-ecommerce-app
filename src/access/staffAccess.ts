import type { Access, FieldAccess, PayloadRequest } from 'payload'

import { hasStaffPermission, isFullAdmin } from '@/lib/permissions/check'
import { staffActionForOperation, type StaffAccessOperation } from '@/lib/permissions/operations'
import type { StaffAction, StaffPage } from '@/lib/permissions/types'
import type { User } from '@/payload-types'

export function adminOrStaff(
  page: StaffPage,
  operation: StaffAccessOperation,
): Access {
  return ({ req: { user } }) => {
    const u = user as User | undefined
    if (!u) return false
    if (isFullAdmin(u)) return true
    return hasStaffPermission(u, page, staffActionForOperation(operation))
  }
}

export function adminOrStaffAction(page: StaffPage, action: StaffAction): Access {
  return ({ req: { user } }) => {
    const u = user as User | undefined
    if (!u) return false
    if (isFullAdmin(u)) return true
    return hasStaffPermission(u, page, action)
  }
}

export function adminOrStaffField(page: StaffPage, action: StaffAction = 'edit'): FieldAccess {
  return ({ req: { user } }) => {
    const u = user as User | undefined
    if (!u) return false
    if (isFullAdmin(u)) return true
    return hasStaffPermission(u, page, action)
  }
}

/** Payload `access.admin` only accepts boolean (not Where queries). */
export type CollectionAdminAccess = (args: {
  req: PayloadRequest
}) => boolean | Promise<boolean>

/** Payload admin panel visibility for a collection/global page */
export function staffCanViewAdminPage(page: StaffPage): CollectionAdminAccess {
  return adminOrStaff(page, 'admin') as CollectionAdminAccess
}

export function adminOrStaffAnyAction(page: StaffPage, actions: StaffAction[]): Access {
  return ({ req: { user } }) => {
    const u = user as User | undefined
    if (!u) return false
    if (isFullAdmin(u)) return true
    return actions.some((action) => hasStaffPermission(u, page, action))
  }
}
