import type { Access, Where } from 'payload'

import { checkRole } from '@/access/utilities'

/**
 * Approvals are visible to everyone. Signed-in reviewers also see their own
 * pending (and rejected) reviews for transparency.
 */
export const productReviewsPublicRead: Access = ({ req }) => {
  if (req.user && checkRole(['admin'], req.user)) {
    return true
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
