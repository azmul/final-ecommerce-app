import type { Payload } from 'payload'

import { isValidGuestSessionId } from '@/lib/chat/validators'
import { hasStaffPermission, isFullAdmin } from '@/lib/permissions/check'
import type { ChatConversation, User } from '@/payload-types'

export function isChatStaff(user: User | null | undefined): boolean {
  if (!user) return false
  return isFullAdmin(user) || hasStaffPermission(user, 'chat', 'view')
}

export function conversationBelongsToGuest(
  conversation: ChatConversation,
  guestSessionId: string | null,
): boolean {
  if (!guestSessionId || !isValidGuestSessionId(guestSessionId)) return false
  return conversation.guestSessionId === guestSessionId
}

export function conversationBelongsToCustomer(
  conversation: ChatConversation,
  user: User,
): boolean {
  const customerId =
    typeof conversation.customer === 'object' && conversation.customer
      ? conversation.customer.id
      : conversation.customer
  return customerId === user.id
}

export async function loadConversationForParticipant(args: {
  payload: Payload
  conversationId: number
  user?: User | null
  guestSessionId?: string | null
}): Promise<ChatConversation | null> {
  const doc = await args.payload.findByID({
    collection: 'chat-conversations',
    depth: 0,
    id: args.conversationId,
    overrideAccess: true,
  })

  const conversation = doc as ChatConversation

  if (args.user && isChatStaff(args.user)) {
    return conversation
  }

  if (args.user && conversationBelongsToCustomer(conversation, args.user)) {
    return conversation
  }

  if (conversationBelongsToGuest(conversation, args.guestSessionId ?? null)) {
    return conversation
  }

  return null
}

export async function mergeGuestConversationsToUser(args: {
  payload: Payload
  guestSessionId: string
  userId: number
}): Promise<void> {
  const { docs } = await args.payload.find({
    collection: 'chat-conversations',
    depth: 0,
    limit: 100,
    overrideAccess: true,
    where: {
      and: [
        { guestSessionId: { equals: args.guestSessionId } },
        { customer: { exists: false } },
      ],
    },
  })

  for (const doc of docs) {
    await args.payload.update({
      collection: 'chat-conversations',
      id: doc.id,
      data: {
        customer: args.userId,
      },
      overrideAccess: true,
    })
  }
}
