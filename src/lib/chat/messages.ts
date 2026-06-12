import type { Payload, PayloadRequest } from 'payload'

import { chatMessageInboxBody, chatMessagePreview, parseChatMessageBody } from '@/lib/chat/productMessage'
import type { ChatSenderType } from '@/lib/chat/types'
import { deliverToUser } from '@/lib/notifications/deliverToUser'
import type { ChatConversation, User } from '@/payload-types'

export async function createChatMessage(args: {
  payload: Payload
  req?: PayloadRequest
  conversationId: number
  body: string
  senderType: ChatSenderType
  senderId?: number | null
}): Promise<{ messageId: number; conversation: ChatConversation }> {
  const message = await args.payload.create({
    collection: 'chat-messages',
    data: {
      body: args.body,
      conversation: args.conversationId,
      sender: args.senderId ?? undefined,
      senderType: args.senderType,
    },
    overrideAccess: true,
    ...(args.req ? { req: args.req } : {}),
  })

  const preview = chatMessagePreview(args.body)
  const now = new Date().toISOString()

  const current = (await args.payload.findByID({
    collection: 'chat-conversations',
    depth: 0,
    id: args.conversationId,
    overrideAccess: true,
  })) as ChatConversation

  const unreadByAgent =
    args.senderType === 'customer' ? (current.unreadByAgent ?? 0) + 1 : (current.unreadByAgent ?? 0)
  const unreadByCustomer =
    args.senderType === 'agent' || args.senderType === 'system'
      ? (current.unreadByCustomer ?? 0) + 1
      : (current.unreadByCustomer ?? 0)

  const conversation = (await args.payload.update({
    collection: 'chat-conversations',
    id: args.conversationId,
    data: {
      lastMessageAt: now,
      lastMessagePreview: preview,
      unreadByAgent,
      unreadByCustomer,
      ...(args.senderType === 'customer' ? { status: 'open' } : {}),
    },
    overrideAccess: true,
    ...(args.req ? { req: args.req } : {}),
  })) as ChatConversation

  if (args.senderType === 'agent' || args.senderType === 'system') {
    const customerId =
      typeof conversation.customer === 'object' && conversation.customer
        ? conversation.customer.id
        : conversation.customer

    if (typeof customerId === 'number') {
      void deliverToUser({
        payload: args.payload,
        req: args.req,
        userId: customerId,
        title: 'New support message',
        body: chatMessageInboxBody(args.body),
        kind: 'system',
        linkUrl: '/',
        skipPush: true,
      }).catch(() => {
        //
      })
    }
  }

  return { conversation, messageId: message.id as number }
}

export async function markConversationReadByCustomer(args: {
  payload: Payload
  conversationId: number
}): Promise<void> {
  await args.payload.update({
    collection: 'chat-conversations',
    id: args.conversationId,
    data: { unreadByCustomer: 0 },
    overrideAccess: true,
  })
}

export async function markConversationReadByAgent(args: {
  payload: Payload
  conversationId: number
}): Promise<void> {
  await args.payload.update({
    collection: 'chat-conversations',
    id: args.conversationId,
    data: { unreadByAgent: 0 },
    overrideAccess: true,
  })
}

export function toMessageDTO(
  message: {
    id: number
    body: string
    senderType: ChatSenderType
    createdAt: string
    sender?: User | number | null
  },
): {
  id: number
  body: string
  senderType: ChatSenderType
  senderName?: string | null
  createdAt: string
  products?: import('@/lib/ai/types').AiProductResult[]
  knowledgeChunks?: import('@/lib/ai/types').KnowledgeChunkResult[]
} {
  const sender =
    typeof message.sender === 'object' && message.sender ? message.sender.name : null
  const parsed = parseChatMessageBody(message.body)

  return {
    body: parsed.text,
    createdAt: message.createdAt,
    id: message.id,
    knowledgeChunks: parsed.knowledgeChunks.length ? parsed.knowledgeChunks : undefined,
    products: parsed.products.length ? parsed.products : undefined,
    senderName: message.senderType === 'system' ? 'AI Shopping Assistant' : sender,
    senderType: message.senderType,
  }
}
