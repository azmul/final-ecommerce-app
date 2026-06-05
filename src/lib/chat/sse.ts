import { CHAT_SSE_POLL_MS } from '@/lib/chat/constants'

export function createChatSseResponse(args: {
  request: Request
  poll: () => Promise<unknown>
  pollIntervalMs?: number
}): Response {
  const enc = new TextEncoder()
  const intervalMs = args.pollIntervalMs ?? CHAT_SSE_POLL_MS

  const stream = new ReadableStream({
    start(controller) {
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
          const payload = await args.poll()
          safeEnqueue(enc.encode(`data: ${JSON.stringify(payload)}\n\n`))
        } catch {
          safeEnqueue(enc.encode('event: error\ndata: {}\n\n'))
        }
      }

      void send()
      const interval = setInterval(() => void send(), intervalMs)

      const onAbort = () => {
        closed = true
        clearInterval(interval)
        try {
          controller.close()
        } catch {
          //
        }
      }

      args.request.signal.addEventListener('abort', onAbort)
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
