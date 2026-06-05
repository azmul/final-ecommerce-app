import { toConversationDTO } from '@/lib/chat/conversation'
import { requireStaffPermissionApi } from '@/lib/permissions/requireStaffPermissionApi'
import { createChatSseResponse } from '@/lib/chat/sse'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const auth = await requireStaffPermissionApi('chat', 'view', request.headers)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status })
  }

  const payload = await getPayload({ config: configPromise })

  return createChatSseResponse({
    poll: async () => {
      const result = await payload.find({
        collection: 'chat-conversations',
        depth: 0,
        limit: 50,
        overrideAccess: true,
        sort: '-lastMessageAt',
        where: {
          status: { in: ['open', 'pending'] },
        },
      })

      const totalUnread = result.docs.reduce((sum, doc) => sum + (doc.unreadByAgent ?? 0), 0)

      return {
        conversations: result.docs.map((doc) => toConversationDTO(doc)),
        totalUnread,
      }
    },
    request,
  })
}
