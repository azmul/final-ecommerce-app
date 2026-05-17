import { STAFF_PAGE_REGISTRY } from '@/lib/permissions/registry'
import type {
  StaffAction,
  StaffGrantRow,
  StaffPage,
  StaffPermissionMap,
} from '@/lib/permissions/types'
import { STAFF_ACTIONS, STAFF_PAGES } from '@/lib/permissions/types'
import type { User } from '@/payload-types'

function isStaffPage(value: unknown): value is StaffPage {
  return typeof value === 'string' && (STAFF_PAGES as readonly string[]).includes(value)
}

function isStaffAction(value: unknown): value is StaffAction {
  return typeof value === 'string' && (STAFF_ACTIONS as readonly string[]).includes(value)
}

export function normalizeStaffGrants(
  grants: StaffGrantRow[] | null | undefined,
): StaffPermissionMap {
  const map: StaffPermissionMap = {}

  if (!Array.isArray(grants)) return map

  for (const row of grants) {
    if (!row || !isStaffPage(row.page)) continue

    const allowed = STAFF_PAGE_REGISTRY[row.page].actions
    const actions = Array.isArray(row.actions)
      ? row.actions.filter((a): a is StaffAction => isStaffAction(a) && allowed.includes(a))
      : []

    if (actions.length === 0) continue

    const existing = map[row.page] ?? []
    map[row.page] = [...new Set([...existing, ...actions])]
  }

  return map
}

export function staffGrantsFromPermissionMap(map: StaffPermissionMap | null | undefined): StaffGrantRow[] {
  if (!map || typeof map !== 'object') return []

  return Object.entries(map)
    .filter(([page, actions]) => isStaffPage(page) && Array.isArray(actions) && actions.length > 0)
    .map(([page, actions]) => ({
      page: page as StaffPage,
      actions: (actions ?? []).filter(isStaffAction),
    }))
}

/** Parse JSON field value from admin form or API into a permission map */
export function parseStaffPermissionsInput(value: unknown): StaffPermissionMap {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  return normalizeStaffGrants(staffGrantsFromPermissionMap(value as StaffPermissionMap))
}

export function readStaffPermissionsFromUser(
  user: Pick<User, 'staffPermissions' | 'staffGrants'> | null | undefined,
): StaffPermissionMap {
  if (!user) return {}

  const permissions = user.staffPermissions
  if (permissions && typeof permissions === 'object' && !Array.isArray(permissions)) {
    return parseStaffPermissionsInput(permissions)
  }

  return normalizeStaffGrants(user.staffGrants as StaffGrantRow[] | null | undefined)
}
