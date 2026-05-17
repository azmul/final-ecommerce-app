import type { Access } from 'payload'

import { hasStaffPermission, isFullAdmin, isOfficeStaff } from '@/lib/permissions/check'
import type { StaffAction } from '@/lib/permissions/types'
import type { User } from '@/payload-types'

function staffUsersAction(action: StaffAction): Access {
  return ({ req: { user } }) => {
    const u = user as User | undefined
    if (!u) return false
    if (isFullAdmin(u)) return true
    if (isOfficeStaff(u)) return hasStaffPermission(u, 'users', action)
    return false
  }
}

/** Public signup when unauthenticated; staff need explicit grants when logged in */
export const usersCreateAccess: Access = ({ req: { user } }) => {
  if (!user) return true
  if (isFullAdmin(user as User)) return true
  if (isOfficeStaff(user as User)) {
    return hasStaffPermission(user as User, 'users', 'create')
  }
  return true
}

export const usersReadAccess: Access = ({ req: { user } }) => {
  const u = user as User | undefined
  if (!u) return false
  if (isFullAdmin(u)) return true
  if (isOfficeStaff(u) && hasStaffPermission(u, 'users', 'view')) return true

  return {
    id: {
      equals: u.id,
    },
  }
}

export const usersUpdateAccess: Access = ({ req: { user } }) => {
  const u = user as User | undefined
  if (!u) return false
  if (isFullAdmin(u)) return true
  if (isOfficeStaff(u) && hasStaffPermission(u, 'users', 'edit')) return true

  return {
    id: {
      equals: u.id,
    },
  }
}

export const usersDeleteAccess = staffUsersAction('delete')
export const usersUnlockAccess = staffUsersAction('edit')
