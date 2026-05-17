import type { Access } from 'payload'

import { hasStaffPermission, isFullAdmin } from '@/lib/permissions/check'
import type { StaffAction, StaffPage } from '@/lib/permissions/types'
import type { User } from '@/payload-types'

export function commentOwnerOrAdminOrStaff(
  page: StaffPage,
  action: StaffAction = 'delete',
): Access {
  return ({ req }) => {
    const user = req?.user as User | undefined
    if (!user) return false
    if (isFullAdmin(user)) return true
    if (hasStaffPermission(user, page, action)) return true

    return {
      author: {
        equals: user.id,
      },
    }
  }
}
