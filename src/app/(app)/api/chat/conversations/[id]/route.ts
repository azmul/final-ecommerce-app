import { loadConversationForParticipant } from '@/lib/chat/access'
import { toConversationDTO } from '@/lib/chat/conversation'
import { markConversationReadByCustomer, toMessageDTO } from '@/lib/chat/messages'
import { participantCanChat, resolveChatParticipant } from '@/lib/chat/request'
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

  const url = new URL(request.url)
  const afterId = parsePositiveInt(url.searchParams.get('afterId'))

  const messages = await payload.find({
    collection: 'chat-messages',
    depth: 1,
    limit: 100,
    overrideAccess: true,
    sort: 'createdAt',
    where: {
      and: [
        { conversation: { equals: conversationId } },
        ...(afterId ? [{ id: { greater_than: afterId } }] : []),
      ],
    },
  })

  await markConversationReadByCustomer({ conversationId, payload })

  return NextResponse.json({
    conversation: toConversationDTO(conversation),
    messages: messages.docs.map((doc) =>
      toMessageDTO({
        body: doc.body,
        createdAt: doc.createdAt,
        id: doc.id,
        sender: doc.sender,
        senderType: doc.senderType,
      }),
    ),
  })
}
