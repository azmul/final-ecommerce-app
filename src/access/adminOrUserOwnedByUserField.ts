import type { Access } from 'payload'

import { hasStaffPermission, isFullAdmin, isOfficeStaff } from '@/lib/permissions/check'
import type { StaffAction, StaffPage } from '@/lib/permissions/types'
import type { User } from '@/payload-types'

/**
 * Admin full access; authenticated users limited to documents where `user` matches their id.
 */
export function staffOrUserOwnedByUserField(
  page: StaffPage,
  staffAction: StaffAction = 'view',
): Access {
  return ({ req }) => {
    const user = req.user as User | undefined
    if (!user) return false
    if (isFullAdmin(user)) return true
    if (isOfficeStaff(user)) {
      return hasStaffPermission(user, page, staffAction)
    }

    return {
      user: {
        equals: user.id,
      },
    }
  }
}

