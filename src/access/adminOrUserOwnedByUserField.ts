import type { Access } from 'payload'

import { checkRole } from '@/access/utilities'

/**
 * Admin full access; authenticated users limited to documents where `user` matches their id.
 */
export const adminOrUserOwnedByUserField: Access = ({ req }) => {
  if (req.user && checkRole(['admin'], req.user)) {
    return true
  }

  if (!req.user?.id) {
    return false
  }

  return {
    user: {
      equals: req.user.id,
    },
  }
}
