import type { Access } from 'payload'

import { hasStaffPermission, isFullAdmin, isOfficeStaff } from '@/lib/permissions/check'
import type { User } from '@/payload-types'

/** Admins and permitted staff see all comments; everyone else sees only approved. */
export const blogCommentsPublicRead: Access = ({ req }) => {
  const user = req.user as User | undefined
  if (user) {
    if (isFullAdmin(user)) return true
    if (isOfficeStaff(user)) {
      return hasStaffPermission(user, 'blog-comments', 'view')
    }
  }

  return {
    moderationStatus: {
      equals: 'approved',
    },
  }
}
