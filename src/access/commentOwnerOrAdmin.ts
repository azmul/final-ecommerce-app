import type { Access } from 'payload'

import { checkRole } from '@/access/utilities'

export const commentOwnerOrAdmin: Access = ({ req }) => {
  if (!req?.user) return false
  if (checkRole(['admin'], req.user)) return true

  return {
    author: {
      equals: req.user.id,
    },
  }
}
