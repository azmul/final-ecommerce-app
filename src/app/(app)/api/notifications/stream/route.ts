import configPromise from '@payload-config'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const initialAuth = await payload.auth({ headers: request.headers })

  if (!initialAuth.user) {
    return new Response('Unauthorized', { status: 401 })
  }

  let currentUserId = initialAuth.user.id
  const REAUTH_INTERVAL_MS = 30_000

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

      const safeClose = () => {
        if (closed) return
        closed = true
        try {
          controller.close()
        } catch {
          //
        }
      }

      const send = async () => {
        try {
          const { user: currentUser } = await payload.auth({ headers: request.headers })
          if (!currentUser) {
            safeEnqueue(enc.encode('event: auth_expired\ndata: {}\n\n'))
            safeClose()
            return
          }
          if (currentUser.id !== currentUserId) {
            currentUserId = currentUser.id
          }

          const unread = await payload.find({
            collection: 'user-notifications',
            depth: 0,
            limit: 0,
            overrideAccess: false,
            pagination: false,
            user: currentUser,
            where: {
              or: [{ readAt: { equals: null } }, { readAt: { exists: false } }],
            },
          })
          safeEnqueue(enc.encode(`data: ${JSON.stringify({ unreadCount: unread.totalDocs })}\n\n`))
        } catch {
          safeEnqueue(enc.encode('event: error\ndata: {}\n\n'))
        }
      }

      void send()
      const interval = setInterval(() => void send(), 20000)

      const reauthInterval = setInterval(() => {
        if (closed) {
          clearInterval(reauthInterval)
          return
        }
        void send()
      }, REAUTH_INTERVAL_MS)

      const onAbort = () => {
        closed = true
        clearInterval(interval)
        clearInterval(reauthInterval)
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
