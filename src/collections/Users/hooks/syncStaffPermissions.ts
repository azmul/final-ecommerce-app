import { randomUUID } from 'crypto'

import type { CollectionBeforeChangeHook } from 'payload'

import {
  normalizeStaffGrants,
  parseStaffPermissionsInput,
  staffGrantsFromPermissionMap,
} from '@/lib/permissions/normalize'
import type { StaffGrantRow } from '@/lib/permissions/types'
import { checkRole } from '@/access/utilities'
import type { User } from '@/payload-types'

function staffGrantsWithStableIds(
  grants: StaffGrantRow[],
  existing?: StaffGrantRow[] | null,
): StaffGrantRow[] {
  const idByPage = new Map<string, string>()
  for (const row of existing ?? []) {
    if (row?.page && row.id) {
      idByPage.set(row.page, row.id)
    }
  }

  return grants.map((row) => ({
    ...row,
    id: idByPage.get(row.page) ?? randomUUID(),
  }))
}

export const syncStaffPermissions: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  const roles = (data?.roles ?? originalDoc?.roles) as User['roles']

  if (!checkRole(['officeStaff'], { roles } as User)) {
    return {
      ...data,
      staffPermissions: null,
      staffGrants: [],
    }
  }

  const fromPermissions = parseStaffPermissionsInput(data?.staffPermissions)
  const fromGrants = normalizeStaffGrants(
    (data?.staffGrants ?? originalDoc?.staffGrants) as StaffGrantRow[] | undefined,
  )

  const permissionsSubmitted =
    data != null && Object.prototype.hasOwnProperty.call(data, 'staffPermissions')
  const permissions = permissionsSubmitted ? fromPermissions : fromGrants
  const staffGrants = staffGrantsWithStableIds(
    staffGrantsFromPermissionMap(permissions),
    (originalDoc?.staffGrants as StaffGrantRow[] | undefined) ?? undefined,
  )

  return {
    ...data,
    staffPermissions: permissions,
    staffGrants,
  }
}
