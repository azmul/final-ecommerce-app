import configPromise from '@payload-config'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: request.headers })

  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const stream = new ReadableStream({
    start(controller) {
      const enc = new TextEncoder()
      let closed = false
      const safeEnqueue = (chunk: Uint8Array) => {
        if (closed) return
        try {
          controller.enqueue(chunk)
        } catch {
          closed = true
        }
      }
      const send = async () => {
        const unread = await payload.find({
          collection: 'user-notifications',
          depth: 0,
          limit: 0,
          overrideAccess: false,
          pagination: false,
          user,
          where: {
            or: [{ readAt: { equals: null } }, { readAt: { exists: false } }],
          },
        })
        safeEnqueue(enc.encode(`data: ${JSON.stringify({ unreadCount: unread.totalDocs })}\n\n`))
      }

      void send()
      const interval = setInterval(() => void send(), 20000)

      const onAbort = () => {
        closed = true
        clearInterval(interval)
        try {
          controller.close()
        } catch {
          //
        }
      }

      request.signal.addEventListener('abort', onAbort)
    },
  })

  return new Response(stream, {
    headers: {
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'Content-Type': 'text/event-stream',
    },
  })
}
