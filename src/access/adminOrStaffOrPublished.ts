import type { Access } from 'payload'

import { hasStaffPermission, isFullAdmin, isOfficeStaff } from '@/lib/permissions/check'
import type { StaffPage } from '@/lib/permissions/types'
import type { User } from '@/payload-types'

export function adminOrStaffOrPublished(page: StaffPage): Access {
  return ({ req: { user } }) => {
    const u = user as User | undefined
    if (u) {
    if (isFullAdmin(u)) return true
    if (isOfficeStaff(u)) {
      return hasStaffPermission(u, page, 'view')
    }
    }

    return {
      _status: {
        equals: 'published',
      },
    }
  }
}
