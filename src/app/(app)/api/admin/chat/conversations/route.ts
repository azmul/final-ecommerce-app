import { toConversationDTO } from '@/lib/chat/conversation'
import { requireStaffPermissionApi } from '@/lib/permissions/requireStaffPermissionApi'
import configPromise from '@payload-config'
import type { Where } from 'payload'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const auth = await requireStaffPermissionApi('chat', 'view', request.headers)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status })
  }

  const payload = await getPayload({ config: configPromise })
  const url = new URL(request.url)
  const filter = url.searchParams.get('filter') ?? 'all'
  const status = url.searchParams.get('status')

  const where: Where = {
    and: [],
  }

  if (status && ['open', 'pending', 'resolved', 'closed'].includes(status)) {
    where.and?.push({ status: { equals: status } })
  }

  if (filter === 'unassigned') {
    where.and?.push({ assignedAgent: { exists: false } })
  } else if (filter === 'mine') {
    where.and?.push({ assignedAgent: { equals: auth.user.id } })
  } else if (filter === 'open') {
    where.and?.push({ status: { in: ['open', 'pending'] } })
  }

  if (!where.and?.length) {
    delete where.and
  }

  const result = await payload.find({
    collection: 'chat-conversations',
    depth: 1,
    limit: 50,
    overrideAccess: true,
    sort: '-lastMessageAt',
    where,
  })

  const totalUnread = result.docs.reduce((sum, doc) => sum + (doc.unreadByAgent ?? 0), 0)

  return NextResponse.json({
    conversations: result.docs.map((doc) => toConversationDTO(doc)),
    totalUnread,
  })
}
