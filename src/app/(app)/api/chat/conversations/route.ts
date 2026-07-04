import {
  conversationBelongsToCustomer,
  conversationBelongsToGuest,
} from '@/lib/chat/access'
import { createOrResumeConversation, toConversationDTO } from '@/lib/chat/conversation'
import { participantCanChat, resolveChatParticipant } from '@/lib/chat/request'
import { parsePositiveInt } from '@/lib/chat/validators'
import configPromise from '@payload-config'
import type { Where } from 'payload'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

type CreateBody = {
  subject?: string
  conversationId?: number
  pageUrl?: string
  productSlug?: string
  cartId?: number
  cartSecret?: string
  orderId?: number
  orderAccessToken?: string
}

export async function GET(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const participant = await resolveChatParticipant({
    headers: request.headers,
    payload,
    url: new URL(request.url),
  })

  if (!participantCanChat(participant)) {
    return NextResponse.json({ error: 'Chat session required.' }, { status: 401 })
  }

  let where: Where
  if (participant.user) {
    where = { customer: { equals: participant.user.id } }
  } else {
    where = { guestSessionId: { equals: participant.guestSessionId as string } }
  }

  const result = await payload.find({
    collection: 'chat-conversations',
    depth: 0,
    limit: 20,
    overrideAccess: true,
    sort: '-lastMessageAt',
    where,
  })

  return NextResponse.json({
    conversations: result.docs.map((doc) => toConversationDTO(doc)),
  })
}

export async function POST(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const participant = await resolveChatParticipant({
    headers: request.headers,
    payload,
    url: new URL(request.url),
  })

  if (!participantCanChat(participant)) {
    return NextResponse.json({ error: 'Chat session required.' }, { status: 401 })
  }

  let body: CreateBody = {}
  try {
    body = (await request.json()) as CreateBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const conversationId = parsePositiveInt(body.conversationId)

  if (conversationId) {
    const existing = await payload.findByID({
      collection: 'chat-conversations',
      depth: 0,
      id: conversationId,
      overrideAccess: true,
    })

    const allowed =
      (participant.user && conversationBelongsToCustomer(existing, participant.user)) ||
      conversationBelongsToGuest(existing, participant.guestSessionId)

    if (!allowed) {
      return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 })
    }

    return NextResponse.json({ conversation: toConversationDTO(existing) })
  }

  const conversation = await createOrResumeConversation({
    contextInput: {
      cartId: body.cartId,
      cartSecret: body.cartSecret,
      orderAccessToken: body.orderAccessToken,
      orderId: body.orderId,
      pageUrl: body.pageUrl,
      productSlug: body.productSlug,
    },
    guestSessionId: participant.guestSessionId,
    payload,
    subject: body.subject,
    user: participant.user,
  })

  return NextResponse.json({ conversation: toConversationDTO(conversation) }, { status: 201 })
}
