import type { Access } from 'payload'

import { isFullAdmin } from '@/lib/permissions/check'
import type { User } from '@/payload-types'

/**
 * Full admin only (not office staff). Used by the ecommerce plugin for operations
 * that must stay admin-only unless overridden per collection.
 */
export const isAdmin: Access = ({ req }) => {
  return isFullAdmin(req.user as User | undefined)
}
