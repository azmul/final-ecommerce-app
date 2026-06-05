import { runShoppingAssistant } from '@/lib/ai/agent'
import { isAiShoppingAssistantEnabled } from '@/lib/ai/config'
import { createChatMessage } from '@/lib/chat/messages'
import { encodeProductMessage, parseChatMessageBody } from '@/lib/chat/productMessage'
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

  const assistant = await runShoppingAssistant({
    history,
    payload: args.payload,
    userMessage: args.userMessage,
  })

  if (!assistant) {
    return { replied: false }
  }

  const messageBody =
    assistant.products.length > 0
      ? encodeProductMessage({
          kind: 'product_results',
          products: assistant.products,
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
