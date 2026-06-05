import { toConversationDTO } from '@/lib/chat/conversation'
import { createChatMessage, toMessageDTO } from '@/lib/chat/messages'
import { requireStaffPermissionApi } from '@/lib/permissions/requireStaffPermissionApi'
import { parsePositiveInt, sanitizeMessageBody } from '@/lib/chat/validators'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireStaffPermissionApi('chat', 'edit', request.headers)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status })
  }

  const { id } = await context.params
  const conversationId = parsePositiveInt(id)
  if (!conversationId) {
    return NextResponse.json({ error: 'Invalid conversation id.' }, { status: 400 })
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

  const payload = await getPayload({ config: configPromise })

  const { conversation: updated, messageId } = await createChatMessage({
    body,
    conversationId,
    payload,
    senderId: auth.user.id,
    senderType: 'agent',
  })

  const message = await payload.findByID({
    collection: 'chat-messages',
    depth: 1,
    id: messageId,
    overrideAccess: true,
  })

  return NextResponse.json({
    conversation: toConversationDTO(updated),
    message: toMessageDTO({
      body: message.body,
      createdAt: message.createdAt,
      id: message.id,
      sender: message.sender,
      senderType: message.senderType,
    }),
  })
}
