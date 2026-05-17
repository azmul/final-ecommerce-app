import type { PayloadRequest } from 'payload'

import { readStaffPermissionsFromUser } from '@/lib/permissions/normalize'
import type { StaffAction, StaffPage, StaffPermissionMap } from '@/lib/permissions/types'
import { checkRole } from '@/access/utilities'
import type { User } from '@/payload-types'

export function isFullAdmin(user?: User | null): boolean {
  return checkRole(['admin'], user)
}

export function isOfficeStaff(user?: User | null): boolean {
  return checkRole(['officeStaff'], user)
}

export function getStaffPermissionMap(user?: User | null): StaffPermissionMap {
  if (!user || !isOfficeStaff(user)) return {}
  return readStaffPermissionsFromUser(user)
}

export function hasStaffPermission(
  user: User | null | undefined,
  page: StaffPage,
  action: StaffAction,
): boolean {
  if (!user) return false
  if (isFullAdmin(user)) return true
  if (!isOfficeStaff(user)) return false

  const map = getStaffPermissionMap(user)
  return map[page]?.includes(action) ?? false
}

export function hasAnyStaffPermission(user?: User | null): boolean {
  if (!user || !isOfficeStaff(user)) return false
  const map = getStaffPermissionMap(user)
  return Object.values(map).some((actions) => Array.isArray(actions) && actions.length > 0)
}

export function requireStaffPermission(
  req: PayloadRequest,
  page: StaffPage,
  action: StaffAction,
): boolean {
  return hasStaffPermission(req.user as User | undefined, page, action)
}
