import type { Access } from 'payload'

import { hasStaffPermission, isFullAdmin, isOfficeStaff } from '@/lib/permissions/check'
import type { User } from '@/payload-types'

export const adminOrPublishedStatus: Access = ({ req: { user } }) => {
  const u = user as User | undefined
  if (u) {
    if (isFullAdmin(u)) return true
    if (isOfficeStaff(u)) {
      return hasStaffPermission(u, 'products', 'view')
    }
  }

  return {
    _status: {
      equals: 'published',
    },
  }
}
