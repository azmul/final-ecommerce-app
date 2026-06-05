import { loadConversationForParticipant } from '@/lib/chat/access'
import { toConversationDTO } from '@/lib/chat/conversation'
import { markConversationReadByCustomer, toMessageDTO } from '@/lib/chat/messages'
import { participantCanChat, resolveChatParticipant } from '@/lib/chat/request'
import { createChatSseResponse } from '@/lib/chat/sse'
import { parsePositiveInt } from '@/lib/chat/validators'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: Request, context: RouteContext) {
  const payload = await getPayload({ config: configPromise })
  const participant = await resolveChatParticipant({
    headers: request.headers,
    payload,
    url: new URL(request.url),
  })

  if (!participantCanChat(participant)) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { id } = await context.params
  const conversationId = parsePositiveInt(id)
  if (!conversationId) {
    return new Response('Bad Request', { status: 400 })
  }

  const conversation = await loadConversationForParticipant({
    conversationId,
    guestSessionId: participant.guestSessionId,
    payload,
    user: participant.user,
  })

  if (!conversation) {
    return new Response('Not Found', { status: 404 })
  }

  const url = new URL(request.url)
  let lastMessageId = parsePositiveInt(url.searchParams.get('afterId')) ?? 0

  return createChatSseResponse({
    poll: async () => {
      const current = await loadConversationForParticipant({
        conversationId,
        guestSessionId: participant.guestSessionId,
        payload,
        user: participant.user,
      })

      if (!current) {
        return { error: 'not_found' }
      }

      const messages = await payload.find({
        collection: 'chat-messages',
        depth: 1,
        limit: 50,
        overrideAccess: true,
        sort: 'createdAt',
        where: {
          and: [
            { conversation: { equals: conversationId } },
            ...(lastMessageId ? [{ id: { greater_than: lastMessageId } }] : []),
          ],
        },
      })

      if (messages.docs.length) {
        const last = messages.docs[messages.docs.length - 1]
        lastMessageId = last.id
        await markConversationReadByCustomer({ conversationId, payload })
      }

      return {
        conversation: toConversationDTO(current),
        messages: messages.docs.map((doc) =>
          toMessageDTO({
            body: doc.body,
            createdAt: doc.createdAt,
            id: doc.id,
            sender: doc.sender,
            senderType: doc.senderType,
          }),
        ),
      }
    },
    request,
  })
}
