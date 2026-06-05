import type { Access } from 'payload'

import { adminOrStaffAction } from '@/access/staffAccess'
import { hasStaffPermission, isFullAdmin } from '@/lib/permissions/check'
import type { User } from '@/payload-types'

export const chatConversationsStaffRead: Access = adminOrStaffAction('chat', 'view')

export const chatConversationsStaffUpdate: Access = adminOrStaffAction('chat', 'edit')

export const chatConversationsStaffDelete: Access = adminOrStaffAction('chat', 'delete')

/** Customers read only their own threads; staff read all. Guests use API routes. */
export const chatConversationsCustomerRead: Access = ({ req }) => {
  const user = req?.user as User | undefined
  if (!user) return false
  if (isFullAdmin(user)) return true
  if (hasStaffPermission(user, 'chat', 'view')) return true

  return {
    customer: {
      equals: user.id,
    },
  }
}

/** All writes go through /api/chat or /api/admin/chat with overrideAccess. */
export const chatApiOnlyWrite: Access = () => false

export const chatMessagesStaffRead: Access = adminOrStaffAction('chat', 'view')

export const chatMessagesCustomerRead: Access = ({ req }) => {
  const user = req?.user as User | undefined
  if (!user) return false
  if (isFullAdmin(user)) return true
  if (hasStaffPermission(user, 'chat', 'view')) return true

  return {
    'conversation.customer': {
      equals: user.id,
    },
  }
}

export const chatMessagesApiOnlyWrite: Access = () => false
