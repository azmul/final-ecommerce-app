import type { Access, Where } from 'payload'

import { hasStaffPermission, isFullAdmin, isOfficeStaff } from '@/lib/permissions/check'
import type { User } from '@/payload-types'

export const productQuestionsPublicRead: Access = ({ req }) => {
  const user = req.user as User | undefined
  if (user) {
    if (isFullAdmin(user)) return true
    if (isOfficeStaff(user)) {
      return hasStaffPermission(user, 'product-questions', 'view')
    }
  }

  const answeredOnly: Where = {
    status: {
      equals: 'answered',
    },
  }

  if (!req?.user?.id) {
    return answeredOnly
  }

  return {
    or: [answeredOnly, { author: { equals: req.user.id } }],
  }
}
