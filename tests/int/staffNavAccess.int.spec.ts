import { describe, expect, it } from 'vitest'

import { staffAwarePublicRead } from '@/access/staffNavAccess'
import { staffOrUserOwnedByUserField } from '@/access/adminOrUserOwnedByUserField'
import type { User } from '@/payload-types'

const staffWithOrders = {
  id: 1,
  roles: ['officeStaff'],
  staffPermissions: { orders: ['view'] },
} as unknown as User

const staffNoPerms = {
  id: 2,
  roles: ['officeStaff'],
  staffPermissions: {},
} as unknown as User

describe('staff nav access', () => {
  it('denies office staff public collection read without view grant', () => {
    const read = staffAwarePublicRead('categories')
    expect(read({ req: { user: staffNoPerms } } as never)).toBe(false)
    expect(read({ req: { user: staffWithOrders } } as never)).toBe(false)
    expect(read({ req: { user: null } } as never)).toBe(true)
  })

  it('denies notification read for office staff without view grant', () => {
    const read = staffOrUserOwnedByUserField('notification-preferences', 'view')
    expect(read({ req: { user: staffNoPerms } } as never)).toBe(false)
    expect(
      read({
        req: {
          user: {
            ...staffNoPerms,
            staffPermissions: { 'notification-preferences': ['view'] },
          },
        },
      } as never),
    ).toBe(true)
  })
})
