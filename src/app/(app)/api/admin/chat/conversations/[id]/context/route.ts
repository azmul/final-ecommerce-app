import { buildChatContextSidebar } from '@/lib/chat/context'
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

  const contextData = await buildChatContextSidebar({ conversation, payload })

  return NextResponse.json({ context: contextData })
}
