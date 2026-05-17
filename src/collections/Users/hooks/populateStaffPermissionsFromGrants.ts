import type { CollectionAfterReadHook } from 'payload'

import { normalizeStaffGrants } from '@/lib/permissions/normalize'
import type { StaffGrantRow } from '@/lib/permissions/types'

/** Ensures the admin matrix can load permissions stored only in staffGrants rows */
export const populateStaffPermissionsFromGrants: CollectionAfterReadHook = ({ doc }) => {
  if (!doc) return doc

  const grants = doc.staffGrants as StaffGrantRow[] | undefined
  const permissions = doc.staffPermissions

  const hasPermissions =
    permissions &&
    typeof permissions === 'object' &&
    !Array.isArray(permissions) &&
    Object.keys(permissions as object).length > 0

  if (hasPermissions || !Array.isArray(grants) || grants.length === 0) {
    return doc
  }

  return {
    ...doc,
    staffPermissions: normalizeStaffGrants(grants),
  }
}
