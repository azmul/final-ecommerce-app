import { describe, expect, it } from 'vitest'

import { usersReadAccess } from '@/access/adminStaffUsersAccess'
import { canAccessAdminPanel } from '@/access/canAccessAdminPanel'
import { STAFF_PAGE_REGISTRY } from '@/lib/permissions/registry'
import { hasStaffPermission, isFullAdmin, isOfficeStaff } from '@/lib/permissions/check'
import { normalizeStaffGrants, parseStaffPermissionsInput } from '@/lib/permissions/normalize'
import type { User } from '@/payload-types'

const staffUser = {
  id: 1,
  roles: ['officeStaff'],
  staffPermissions: normalizeStaffGrants([
    { page: 'orders', actions: ['view', 'edit'] },
    { page: 'sales-dashboard', actions: ['view'] },
  ]),
} as User

describe('staff permissions', () => {
  it('includes users in the permission registry', () => {
    expect(STAFF_PAGE_REGISTRY.users.collectionSlug).toBe('users')
    expect(STAFF_PAGE_REGISTRY.users.actions).toContain('view')
  })

  it('gates user list read by users view permission', () => {
    expect(usersReadAccess({ req: { user: staffUser } } as never)).toEqual({
      id: { equals: staffUser.id },
    })
    expect(
      usersReadAccess({
        req: {
          user: {
            ...staffUser,
            staffPermissions: { users: ['view'] },
          },
        },
      } as never),
    ).toBe(true)
  })

  it('allows office staff to access the admin panel', () => {
    expect(
      canAccessAdminPanel({
        req: { user: staffUser },
      } as Parameters<typeof canAccessAdminPanel>[0]),
    ).toBe(true)
    expect(
      canAccessAdminPanel({
        req: { user: { ...staffUser, roles: ['customer'] } as User },
      } as Parameters<typeof canAccessAdminPanel>[0]),
    ).toBe(false)
  })

  it('identifies office staff and admins', () => {
    expect(isOfficeStaff(staffUser)).toBe(true)
    expect(isFullAdmin({ ...staffUser, roles: ['admin'] } as User)).toBe(true)
    expect(isFullAdmin(staffUser)).toBe(false)
  })

  it('checks page and action grants', () => {
    expect(hasStaffPermission(staffUser, 'orders', 'view')).toBe(true)
    expect(hasStaffPermission(staffUser, 'orders', 'delete')).toBe(false)
    expect(hasStaffPermission(staffUser, 'sales-dashboard', 'view')).toBe(true)
    expect(hasStaffPermission(staffUser, 'products', 'view')).toBe(false)
  })

  it('grants admins all permissions', () => {
    const admin = { ...staffUser, roles: ['admin'] } as User
    expect(hasStaffPermission(admin, 'products', 'delete')).toBe(true)
  })

  it('parses staffPermissions json from the admin form', () => {
    const map = parseStaffPermissionsInput({
      orders: ['view', 'edit'],
      products: ['view'],
    })
    expect(map.orders).toEqual(['view', 'edit'])
    expect(map.products).toEqual(['view'])
  })

  it('normalizes grant rows', () => {
    const map = normalizeStaffGrants([
      { page: 'orders', actions: ['view', 'view', 'edit'] },
      { page: 'orders', actions: ['edit'] },
    ])
    expect(map.orders).toEqual(['view', 'edit'])
  })
})
