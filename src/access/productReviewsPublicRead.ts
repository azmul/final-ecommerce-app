import type { Access, Where } from 'payload'

import { hasStaffPermission, isFullAdmin, isOfficeStaff } from '@/lib/permissions/check'
import type { User } from '@/payload-types'

/**
 * Approvals are visible to everyone. Signed-in reviewers also see their own
 * pending (and rejected) reviews for transparency.
 */
export const productReviewsPublicRead: Access = ({ req }) => {
  const user = req.user as User | undefined
  if (user) {
    if (isFullAdmin(user)) return true
    if (isOfficeStaff(user)) {
      return hasStaffPermission(user, 'product-reviews', 'view')
    }
  }

  const approvedOnly: Where = {
    moderationStatus: {
      equals: 'approved',
    },
  }

  if (!req?.user?.id) {
    return approvedOnly
  }

  const userId = req.user.id

  return {
    or: [approvedOnly, { author: { equals: userId } }],
  }
}
