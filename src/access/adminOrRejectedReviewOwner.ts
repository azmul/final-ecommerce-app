import type { Access } from 'payload'

import { checkRole } from '@/access/utilities'

/** Moderators retain full edit access; reviewers may only edit rejected feedback to revise and resubmit. */
export const adminOrRejectedReviewOwner: Access = ({ req }) => {
  const user = req?.user

  if (!user) return false

  if (checkRole(['admin'], user)) return true

  return {
    and: [
      {
        author: {
          equals: user.id,
        },
      },
      {
        moderationStatus: {
          equals: 'rejected',
        },
      },
    ],
  }
}
