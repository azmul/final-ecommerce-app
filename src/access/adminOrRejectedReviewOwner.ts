import type { Access } from 'payload'

import { hasStaffPermission, isFullAdmin } from '@/lib/permissions/check'
import type { User } from '@/payload-types'

/** Moderators retain full edit access; reviewers may only edit rejected feedback to revise and resubmit. */
export const adminOrRejectedReviewOwner: Access = ({ req }) => {
  const user = req?.user as User | undefined

  if (!user) return false

  if (
    isFullAdmin(user) ||
    hasStaffPermission(user, 'product-reviews', 'edit') ||
    hasStaffPermission(user, 'product-reviews', 'approve')
  ) {
    return true
  }

  return {
    author: {
      equals: user.id,
    },
    moderationStatus: {
      equals: 'rejected',
    },
  }
}
