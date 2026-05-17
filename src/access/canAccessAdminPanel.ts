import type { Access } from 'payload'

import { isFullAdmin, isOfficeStaff } from '@/lib/permissions/check'
import type { User } from '@/payload-types'

/**
 * Payload calls this on the auth (`users`) collection to decide if a user may open /admin.
 * @see node_modules/payload/dist/utilities/canAccessAdmin.js
 */
export const canAccessAdminPanel: Access = ({ req: { user } }) => {
  const u = user as User | undefined
  if (!u) return false
  if (isFullAdmin(u)) return true
  if (isOfficeStaff(u)) return true
  return false
}
