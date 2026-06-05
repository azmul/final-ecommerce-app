import { toConversationDTO } from '@/lib/chat/conversation'
import { markConversationReadByAgent, toMessageDTO } from '@/lib/chat/messages'
import { requireStaffPermissionApi } from '@/lib/permissions/requireStaffPermissionApi'
import { parsePositiveInt } from '@/lib/chat/validators'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: Request, context: RouteContext) {
  const auth = await requireStaffPermissionApi('chat', 'view', request.headers)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status })
  }

  const { id } = await context.params
  const conversationId = parsePositiveInt(id)
  if (!conversationId) {
    return NextResponse.json({ error: 'Invalid conversation id.' }, { status: 400 })
  }

  const payload = await getPayload({ config: configPromise })

  const conversation = await payload.findByID({
    collection: 'chat-conversations',
    depth: 1,
    id: conversationId,
    overrideAccess: true,
  })

  const url = new URL(request.url)
  const afterId = parsePositiveInt(url.searchParams.get('afterId'))

  const messages = await payload.find({
    collection: 'chat-messages',
    depth: 1,
    limit: 200,
    overrideAccess: true,
    sort: 'createdAt',
    where: {
      and: [
        { conversation: { equals: conversationId } },
        ...(afterId ? [{ id: { greater_than: afterId } }] : []),
      ],
    },
  })

  await markConversationReadByAgent({ conversationId, payload })

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

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireStaffPermissionApi('chat', 'edit', request.headers)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status })
  }

  const { id } = await context.params
  const conversationId = parsePositiveInt(id)
  if (!conversationId) {
    return NextResponse.json({ error: 'Invalid conversation id.' }, { status: 400 })
  }

  let json: {
    status?: string
    assignToSelf?: boolean
    assignedAgentId?: number | null
  } = {}

  try {
    json = (await request.json()) as typeof json
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const payload = await getPayload({ config: configPromise })
  const data: Record<string, unknown> = {}

  if (json.status && ['open', 'pending', 'resolved', 'closed'].includes(json.status)) {
    data.status = json.status
  }

  if (json.assignToSelf) {
    data.assignedAgent = auth.user.id
  } else if (json.assignedAgentId !== undefined) {
    data.assignedAgent = json.assignedAgentId
  }

  const conversation = await payload.update({
    collection: 'chat-conversations',
    id: conversationId,
    data,
    overrideAccess: true,
  })

  return NextResponse.json({ conversation: toConversationDTO(conversation) })
}
