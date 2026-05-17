import type { Access, ClientUser } from 'payload'

import { hasStaffPermission, isFullAdmin, isOfficeStaff } from '@/lib/permissions/check'
import type { StaffPage } from '@/lib/permissions/types'
import type { User } from '@/payload-types'

/**
 * Storefront/public read, but office staff need an explicit view grant for admin/API reads.
 */
export function staffAwarePublicRead(page: StaffPage): Access {
  return ({ req: { user } }) => {
    const u = user as User | undefined
    if (!u) return true
    if (isFullAdmin(u)) return true
    if (isOfficeStaff(u)) return hasStaffPermission(u, page, 'view')
    return true
  }
}

/** Hide a collection/global from the admin sidebar unless the user may view that page */
export function staffHideFromAdminNavUnless(page: StaffPage) {
  return ({ user }: { user: ClientUser }) => {
    const u = user as User
    if (!u) return false
    if (isFullAdmin(u)) return false
    if (isOfficeStaff(u)) return !hasStaffPermission(u, page, 'view')
    return false
  }
}
