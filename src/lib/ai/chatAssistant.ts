import { runShoppingAssistant } from '@/lib/ai/agent'
import type { AiShoppingToolContext } from '@/lib/ai/checkoutTools'
import { isAiShoppingAssistantEnabled } from '@/lib/ai/config'
import { createChatMessage } from '@/lib/chat/messages'
import { encodeRichMessage, parseChatMessageBody } from '@/lib/chat/productMessage'
import {
  trimKnowledgeChunksForStorage,
  trimProductsForStorage,
} from '@/lib/chat/trimRichMessageForStorage'
import type { Payload as PayloadInstance } from 'payload'

export async function conversationHasHumanAgentReply(
  payload: PayloadInstance,
  conversationId: number,
): Promise<boolean> {
  const messages = await payload.find({
    collection: 'chat-messages',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: {
      and: [
        { conversation: { equals: conversationId } },
        { senderType: { equals: 'agent' } },
        { sender: { exists: true } },
      ],
    },
  })

  return messages.totalDocs > 0
}

export async function shouldRunShoppingAssistant(args: {
  payload: PayloadInstance
  conversationId: number
}): Promise<boolean> {
  if (!isAiShoppingAssistantEnabled()) return false

  const conversation = await args.payload.findByID({
    collection: 'chat-conversations',
    depth: 0,
    id: args.conversationId,
    overrideAccess: true,
  })

  if (conversation.assignedAgent) return false

  const hasHumanReply = await conversationHasHumanAgentReply(args.payload, args.conversationId)
  return !hasHumanReply
}

export async function maybeReplyWithShoppingAssistant(args: {
  payload: PayloadInstance
  conversationId: number
  userMessage: string
}): Promise<{ replied: boolean; messageId?: number }> {
  const eligible = await shouldRunShoppingAssistant({
    conversationId: args.conversationId,
    payload: args.payload,
  })

  if (!eligible) {
    return { replied: false }
  }

  const historyResult = await args.payload.find({
    collection: 'chat-messages',
    depth: 0,
    limit: 12,
    overrideAccess: true,
    sort: 'createdAt',
    where: {
      conversation: {
        equals: args.conversationId,
      },
    },
  })

  const history = historyResult.docs
    .filter((message) => message.id)
    .slice(0, -1)
    .map((message) => ({
      content: parseChatMessageBody(message.body).text,
      role:
        message.senderType === 'customer'
          ? ('user' as const)
          : message.senderType === 'system'
            ? ('assistant' as const)
            : ('assistant' as const),
    }))

  const conversation = await args.payload.findByID({
    collection: 'chat-conversations',
    depth: 1,
    id: args.conversationId,
    overrideAccess: true,
  })

  const toolContext: AiShoppingToolContext = {}
  const customerId =
    typeof conversation.customer === 'object' && conversation.customer ?
      conversation.customer.id
    : typeof conversation.customer === 'number' ?
      conversation.customer
    : undefined

  if (customerId) {
    toolContext.userId = customerId
    const user =
      typeof conversation.customer === 'object' && conversation.customer ?
        conversation.customer
      : null
    if (user && typeof user.email === 'string') {
      toolContext.userEmail = user.email
    }
  }

  const cartRef = conversation.context?.cart
  if (typeof cartRef === 'number') {
    toolContext.cartId = cartRef
  } else if (cartRef && typeof cartRef === 'object' && 'id' in cartRef) {
    toolContext.cartId = Number(cartRef.id)
  }

  const assistant = await runShoppingAssistant({
    context: toolContext,
    history,
    payload: args.payload,
    userMessage: args.userMessage,
  })

  if (!assistant) {
    return { replied: false }
  }

  const hasRichPayload =
    assistant.products.length > 0 || assistant.knowledgeChunks.length > 0

  const messageBody =
    hasRichPayload
      ? encodeRichMessage({
          kind: 'assistant_results',
          knowledgeChunks:
            assistant.knowledgeChunks.length > 0
              ? trimKnowledgeChunksForStorage(assistant.knowledgeChunks)
              : undefined,
          products:
            assistant.products.length > 0
              ? trimProductsForStorage(assistant.products)
              : undefined,
          text: assistant.reply,
        })
      : assistant.reply

  const { messageId } = await createChatMessage({
    body: messageBody,
    conversationId: args.conversationId,
    payload: args.payload,
    senderId: null,
    senderType: 'system',
  })

  if (assistant.handoffToHuman) {
    await args.payload.update({
      collection: 'chat-conversations',
      data: {
        status: 'pending',
      },
      id: args.conversationId,
      overrideAccess: true,
    })
  }

  return { messageId, replied: true }
}
