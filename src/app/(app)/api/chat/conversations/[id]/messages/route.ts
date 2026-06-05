import { maybeReplyWithShoppingAssistant } from '@/lib/ai/chatAssistant'
import { loadConversationForParticipant } from '@/lib/chat/access'
import { toConversationDTO } from '@/lib/chat/conversation'
import { createChatMessage, toMessageDTO } from '@/lib/chat/messages'
import { participantCanChat, resolveChatParticipant } from '@/lib/chat/request'
import { parsePositiveInt, sanitizeMessageBody } from '@/lib/chat/validators'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(request: Request, context: RouteContext) {
  const payload = await getPayload({ config: configPromise })
  const participant = await resolveChatParticipant({
    headers: request.headers,
    payload,
    url: new URL(request.url),
  })

  if (!participantCanChat(participant)) {
    return NextResponse.json({ error: 'Chat session required.' }, { status: 401 })
  }

  const { id } = await context.params
  const conversationId = parsePositiveInt(id)
  if (!conversationId) {
    return NextResponse.json({ error: 'Invalid conversation id.' }, { status: 400 })
  }

  const conversation = await loadConversationForParticipant({
    conversationId,
    guestSessionId: participant.guestSessionId,
    payload,
    user: participant.user,
  })

  if (!conversation) {
    return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 })
  }

  let json: { body?: unknown } = {}
  try {
    json = (await request.json()) as { body?: unknown }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const body = sanitizeMessageBody(json.body)
  if (!body) {
    return NextResponse.json({ error: 'Message body is required.' }, { status: 400 })
  }

  const { conversation: updated, messageId } = await createChatMessage({
    body,
    conversationId,
    payload,
    senderId: participant.user?.id ?? null,
    senderType: 'customer',
  })

  const message = await payload.findByID({
    collection: 'chat-messages',
    depth: 1,
    id: messageId,
    overrideAccess: true,
  })

  let aiMessage = null as ReturnType<typeof toMessageDTO> | null
  let aiConversation = updated

  try {
    const aiResult = await maybeReplyWithShoppingAssistant({
      conversationId,
      payload,
      userMessage: body,
    })

    if (aiResult.replied && aiResult.messageId) {
      const aiDoc = await payload.findByID({
        collection: 'chat-messages',
        depth: 1,
        id: aiResult.messageId,
        overrideAccess: true,
      })

      aiMessage = toMessageDTO({
        body: aiDoc.body,
        createdAt: aiDoc.createdAt,
        id: aiDoc.id,
        sender: aiDoc.sender,
        senderType: aiDoc.senderType,
      })

      const refreshed = await payload.findByID({
        collection: 'chat-conversations',
        depth: 0,
        id: conversationId,
        overrideAccess: true,
      })
      aiConversation = refreshed
    }
  } catch (error) {
    payload.logger.error({ err: error, msg: 'chat-ai-assistant' })
  }

  return NextResponse.json({
    aiMessage,
    conversation: toConversationDTO(aiConversation),
    message: toMessageDTO({
      body: message.body,
      createdAt: message.createdAt,
      id: message.id,
      sender: message.sender,
      senderType: message.senderType,
    }),
  })
}
