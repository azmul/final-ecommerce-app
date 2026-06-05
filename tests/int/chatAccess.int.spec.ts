import { describe, expect, it } from 'vitest'

import {
  conversationBelongsToCustomer,
  conversationBelongsToGuest,
  isChatStaff,
} from '@/lib/chat/access'
import { STAFF_PAGE_REGISTRY } from '@/lib/permissions/registry'
import { isValidGuestSessionId, sanitizeMessageBody } from '@/lib/chat/validators'
import type { ChatConversation, User } from '@/payload-types'

const guestSession = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'

const staffUser = {
  id: 2,
  roles: ['officeStaff'],
  staffPermissions: { chat: ['view', 'edit'] },
} as unknown as User

const customerUser = {
  id: 3,
  roles: ['customer'],
} as unknown as User

const conversation = {
  id: 1,
  customer: 3,
  guestSessionId: guestSession,
} as ChatConversation

describe('chat access', () => {
  it('registers chat in staff page registry', () => {
    expect(STAFF_PAGE_REGISTRY.chat.collectionSlug).toBe('chat-conversations')
    expect(STAFF_PAGE_REGISTRY.chat.actions).toContain('view')
    expect(STAFF_PAGE_REGISTRY.chat.apiRoutes).toContain('/api/admin/chat')
  })

  it('validates guest session ids', () => {
    expect(isValidGuestSessionId(guestSession)).toBe(true)
    expect(isValidGuestSessionId('not-a-uuid')).toBe(false)
  })

  it('sanitizes message bodies', () => {
    expect(sanitizeMessageBody('  hello  ')).toBe('hello')
    expect(sanitizeMessageBody('')).toBeNull()
    expect(sanitizeMessageBody('a'.repeat(2001))).toBeNull()
  })

  it('matches guest and customer conversation ownership', () => {
    expect(conversationBelongsToGuest(conversation, guestSession)).toBe(true)
    expect(conversationBelongsToGuest(conversation, 'wrong-session')).toBe(false)
    expect(conversationBelongsToCustomer(conversation, customerUser)).toBe(true)
    expect(conversationBelongsToCustomer(conversation, { ...customerUser, id: 99 })).toBe(false)
  })

  it('identifies chat staff', () => {
    expect(isChatStaff(staffUser)).toBe(true)
    expect(isChatStaff(customerUser)).toBe(false)
    expect(isChatStaff({ ...staffUser, roles: ['admin'] } as User)).toBe(true)
  })
})
