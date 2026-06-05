import type { Payload, PayloadRequest, Where } from 'payload'

import { verifyOrderAccess } from '@/lib/chat/orderAccess'
import type { ChatConversationContextInput, ChatConversationDTO } from '@/lib/chat/types'
import type { ChatConversation, User } from '@/payload-types'

export async function buildConversationContext(args: {
  payload: Payload
  input: ChatConversationContextInput
  user?: User | null
}): Promise<ChatConversation['context']> {
  const context: ChatConversation['context'] = {
    pageUrl: args.input.pageUrl?.trim() || undefined,
    productSlug: args.input.productSlug?.trim() || undefined,
  }

  if (args.input.cartId) {
    const cart = await args.payload.findByID({
      collection: 'carts',
      depth: 0,
      id: args.input.cartId,
      overrideAccess: true,
    }).catch(() => null)

    if (cart) {
      const cartCustomer =
        typeof cart.customer === 'object' && cart.customer ? cart.customer.id : cart.customer

      if (!args.user || cartCustomer === args.user.id || !cartCustomer) {
        context.cart = args.input.cartId
      }
    }
  }

  if (args.input.orderId) {
    const order = await verifyOrderAccess({
      accessToken: args.input.orderAccessToken,
      orderId: args.input.orderId,
      payload: args.payload,
      user: args.user,
    })

    if (order) {
      context.order = order.id
      if (args.input.orderAccessToken) {
        context.guestOrderAccessToken = args.input.orderAccessToken.trim()
      }
    }
  }

  return context
}

export async function findLatestActiveConversation(args: {
  payload: Payload
  user?: User | null
  guestSessionId?: string | null
}): Promise<ChatConversation | null> {
  let participantWhere: Where
  if (args.user) {
    participantWhere = { customer: { equals: args.user.id } }
  } else if (args.guestSessionId) {
    participantWhere = { guestSessionId: { equals: args.guestSessionId } }
  } else {
    return null
  }

  const result = await args.payload.find({
    collection: 'chat-conversations',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    sort: '-lastMessageAt',
    where: {
      and: [
        participantWhere,
        { status: { in: ['open', 'pending'] } },
      ],
    },
  })

  return (result.docs[0] as ChatConversation | undefined) ?? null
}

export async function createOrResumeConversation(args: {
  payload: Payload
  req?: PayloadRequest
  user?: User | null
  guestSessionId?: string | null
  subject?: string | null
  contextInput?: ChatConversationContextInput
  conversationId?: number | null
}): Promise<ChatConversation> {
  if (args.conversationId) {
    const existing = await args.payload.findByID({
      collection: 'chat-conversations',
      depth: 0,
      id: args.conversationId,
      overrideAccess: true,
    })
    return existing as ChatConversation
  }

  const latest = await findLatestActiveConversation({
    guestSessionId: args.guestSessionId,
    payload: args.payload,
    user: args.user,
  })

  if (latest) {
    if (args.contextInput) {
      const context = await buildConversationContext({
        input: args.contextInput,
        payload: args.payload,
        user: args.user,
      })

      return (await args.payload.update({
        collection: 'chat-conversations',
        data: {
          context: {
            ...latest.context,
            ...context,
          },
        },
        id: latest.id,
        overrideAccess: true,
        ...(args.req ? { req: args.req } : {}),
      })) as ChatConversation
    }

    return latest
  }

  const context = args.contextInput
    ? await buildConversationContext({
        input: args.contextInput,
        payload: args.payload,
        user: args.user,
      })
    : undefined

  const conversation = await args.payload.create({
    collection: 'chat-conversations',
    data: {
      context,
      customer: args.user?.id,
      guestSessionId: args.guestSessionId || undefined,
      status: 'open',
      subject: args.subject?.trim() || 'Support chat',
      unreadByAgent: 0,
      unreadByCustomer: 0,
    },
    overrideAccess: true,
    ...(args.req ? { req: args.req } : {}),
  })

  return conversation as ChatConversation
}

export function toConversationDTO(conversation: ChatConversation): ChatConversationDTO {
  const assignedAgent =
    typeof conversation.assignedAgent === 'object' && conversation.assignedAgent
      ? conversation.assignedAgent.id
      : conversation.assignedAgent

  const customer =
    typeof conversation.customer === 'object' && conversation.customer
      ? conversation.customer.id
      : conversation.customer

  return {
    assignedAgent: assignedAgent ?? null,
    context: conversation.context,
    customer: customer ?? null,
    guestSessionId: conversation.guestSessionId,
    id: conversation.id,
    lastMessageAt: conversation.lastMessageAt,
    lastMessagePreview: conversation.lastMessagePreview,
    status: conversation.status,
    subject: conversation.subject,
    unreadByAgent: conversation.unreadByAgent ?? 0,
    unreadByCustomer: conversation.unreadByCustomer ?? 0,
  }
}
