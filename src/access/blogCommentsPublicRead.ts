import type { Access } from 'payload'

import { checkRole } from '@/access/utilities'

/** Admins see all comments (including pending/rejected); everyone else sees only approved. */
export const blogCommentsPublicRead: Access = ({ req }) => {
  if (req.user && checkRole(['admin'], req.user)) {
    return true
  }

  return {
    moderationStatus: {
      equals: 'approved',
    },
  }
}
