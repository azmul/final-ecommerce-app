import type { Access } from 'payload'

import { checkRole } from '@/access/utilities'

/**
 * Approvals are visible to everyone. Signed-in reviewers also see their own
 * pending (and rejected) reviews for transparency.
 */
export const productReviewsPublicRead: Access = ({ req }) => {
  if (req.user && checkRole(['admin'], req.user)) {
    return true
  }

  if (!req?.user?.id) {
    return {
      moderationStatus: {
        equals: 'approved',
      },
    }
  }

  const userId = req.user.id

  return {
    or: [
      {
        moderationStatus: {
          equals: 'approved',
        },
      },
      {
        author: {
          equals: userId,
        },
      },
    ],
  }
}
