'use client'

import type { ChatConversationDTO, ChatMessageDTO } from '@/lib/chat/types'
import { readGuestCartSecret } from '@/lib/carts/guestCartSecret'
import {
  chatSessionHeaders,
  chatSessionQuery,
  clearStoredConversationId,
  getOrCreateGuestSessionId,
  getStoredConversationId,
  setStoredConversationId,
} from '@/lib/chat/session'
import { CLIENT_DATA_CLEARED_EVENT } from '@/utilities/clearBrowserClientData'
import { useAuth } from '@/providers/Auth'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

type ChatContextValue = {
  isOpen: boolean
  open: (options?: ChatOpenOptions) => void
  close: () => void
  conversation: ChatConversationDTO | null
  messages: ChatMessageDTO[]
  pendingUserMessage: ChatMessageDTO | null
  isLoading: boolean
  isSending: boolean
  unreadCount: number
  sendMessage: (body: string) => Promise<boolean>
  error: string | null
}

export type ChatOpenOptions = {
  orderId?: number
  orderAccessToken?: string
  subject?: string
}

const ChatContext = createContext<ChatContextValue | null>(null)

function capturePageContext() {
  if (typeof window === 'undefined') {
    return { pageUrl: '', productSlug: undefined as string | undefined }
  }

  const pageUrl = window.location.href
  const productMatch = window.location.pathname.match(/^\/products\/([^/]+)/)
  return {
    pageUrl,
    productSlug: productMatch?.[1],
  }
}

function parseOrderPageContext(): { orderId?: number; orderAccessToken?: string } {
  if (typeof window === 'undefined') return {}

  const match = window.location.pathname.match(/^\/orders\/(\d+)/)
  if (!match) return {}

  const params = new URLSearchParams(window.location.search)
  return {
    orderAccessToken: params.get('accessToken') ?? undefined,
    orderId: Number(match[1]),
  }
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const { cart } = useCart()
  const [isOpen, setIsOpen] = useState(false)
  const [conversation, setConversation] = useState<ChatConversationDTO | null>(null)
  const [messages, setMessages] = useState<ChatMessageDTO[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [pendingUserMessage, setPendingUserMessage] = useState<ChatMessageDTO | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [openOptions, setOpenOptions] = useState<ChatOpenOptions>({})
  const eventSourceRef = useRef<EventSource | null>(null)
  const [guestSessionId, setGuestSessionId] = useState(() => getOrCreateGuestSessionId())
  const restoredForKeyRef = useRef('')

  useEffect(() => {
    const reset = () => {
      eventSourceRef.current?.close()
      eventSourceRef.current = null
      setGuestSessionId(getOrCreateGuestSessionId())
      restoredForKeyRef.current = ''
      setConversation(null)
      setMessages([])
      setPendingUserMessage(null)
      setError(null)
      setOpenOptions({})
      setIsOpen(false)
      setIsLoading(false)
      setIsSending(false)
    }

    window.addEventListener(CLIENT_DATA_CLEARED_EVENT, reset)
    return () => window.removeEventListener(CLIENT_DATA_CLEARED_EVENT, reset)
  }, [])

  const headers = useMemo(() => chatSessionHeaders(guestSessionId), [guestSessionId])

  const unreadCount = conversation?.unreadByCustomer ?? 0

  const loadConversation = useCallback(
    async (id: number) => {
      const res = await fetch(`/api/chat/conversations/${id}`, {
        credentials: 'include',
        headers,
      })

      if (!res.ok) {
        throw new Error('Failed to load conversation')
      }

      const json = (await res.json()) as {
        conversation: ChatConversationDTO
        messages: ChatMessageDTO[]
      }

      setConversation(json.conversation)
      setMessages(json.messages)
      setStoredConversationId(json.conversation.id)
    },
    [headers],
  )

  const restoreConversation = useCallback(async () => {
    const storedId = getStoredConversationId()

    if (storedId) {
      try {
        await loadConversation(storedId)
        return
      } catch {
        clearStoredConversationId()
      }
    }

    const res = await fetch('/api/chat/conversations', {
      credentials: 'include',
      headers,
    })

    if (!res.ok) return

    const json = (await res.json()) as { conversations: ChatConversationDTO[] }
    const latest = json.conversations[0]
    if (!latest?.id) return

    await loadConversation(latest.id)
  }, [headers, loadConversation])

  useEffect(() => {
    const restoreKey = `${user?.id ?? 'guest'}:${guestSessionId}`
    if (restoredForKeyRef.current === restoreKey) return

    const schedule =
      typeof window.requestIdleCallback === 'function'
        ? window.requestIdleCallback
        : (cb: IdleRequestCallback) => window.setTimeout(cb, 2500)

    const cancel =
      typeof window.cancelIdleCallback === 'function'
        ? window.cancelIdleCallback
        : window.clearTimeout

    const id = schedule(() => {
      restoredForKeyRef.current = restoreKey
      void restoreConversation().catch(() => {
        restoredForKeyRef.current = ''
      })
    })

    return () => cancel(id)
  }, [guestSessionId, restoreConversation, user?.id])

  const ensureConversation = useCallback(
    async (options: ChatOpenOptions = {}): Promise<ChatConversationDTO | null> => {
      setIsLoading(true)
      setError(null)

      try {
        const page = capturePageContext()
        const orderPage = parseOrderPageContext()

        const res = await fetch('/api/chat/conversations', {
          body: JSON.stringify({
            cartId: cart?.id,
            // Lets the server confirm this is the shopper's own cart before the
            // assistant is allowed to read it.
            cartSecret: cart?.id ? readGuestCartSecret(cart) : undefined,
            orderAccessToken: options.orderAccessToken ?? orderPage.orderAccessToken,
            orderId: options.orderId ?? orderPage.orderId,
            pageUrl: page.pageUrl,
            productSlug: page.productSlug,
            subject: options.subject ?? 'Support chat',
          }),
          credentials: 'include',
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
          method: 'POST',
        })

        if (!res.ok) {
          throw new Error('Failed to start chat')
        }

        const json = (await res.json()) as { conversation: ChatConversationDTO }
        setConversation(json.conversation)
        await loadConversation(json.conversation.id)
        return json.conversation
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to start chat')
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [cart, headers, loadConversation],
  )

  const lastMessageIdRef = useRef(0)

  useEffect(() => {
    lastMessageIdRef.current = messages.at(-1)?.id ?? 0
  }, [messages])

  const connectStream = useCallback(
    (conversationId: number) => {
      eventSourceRef.current?.close()

      const streamUrl = `/api/chat/conversations/${conversationId}/stream?afterId=${lastMessageIdRef.current}&${chatSessionQuery(guestSessionId)}`
      const source = new EventSource(streamUrl, { withCredentials: true })

      source.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as {
            conversation?: ChatConversationDTO
            messages?: ChatMessageDTO[]
          }

          if (data.conversation) {
            setConversation(data.conversation)
          }

          if (data.messages?.length) {
            setMessages((prev) => {
              const ids = new Set(prev.map((m) => m.id))
              const next = [...prev]
              for (const message of data.messages ?? []) {
                if (!ids.has(message.id)) next.push(message)
              }
              return next
            })
          }
        } catch {
          //
        }
      }

      eventSourceRef.current = source
    },
    [guestSessionId],
  )

  useEffect(() => {
    const id = conversation?.id
    if (!id) return

    // Keep the live stream tied to tab visibility: connect when visible, drop the
    // connection while the tab is hidden so we don't poll the DB for nothing, and
    // reconnect on return. (Previously closing the panel killed the stream with no
    // way to reconnect, so live agent replies silently stopped after reopen.)
    const sync = () => {
      if (typeof document !== 'undefined' && document.hidden) {
        eventSourceRef.current?.close()
        eventSourceRef.current = null
      } else if (!eventSourceRef.current) {
        connectStream(id)
      }
    }

    sync()
    document.addEventListener('visibilitychange', sync)

    return () => {
      document.removeEventListener('visibilitychange', sync)
      eventSourceRef.current?.close()
      eventSourceRef.current = null
    }
  }, [connectStream, conversation?.id])

  const open = useCallback(
    async (options: ChatOpenOptions = {}) => {
      setOpenOptions(options)
      setIsOpen(true)

      // Only touch the network when there is an existing thread to refresh. A brand
      // new conversation is created lazily on the first send (see sendMessage), so
      // simply opening the widget no longer writes an empty conversation row.
      if (conversation?.id) {
        try {
          await loadConversation(conversation.id)
        } catch {
          // Stale/unreachable thread — fall back to a fresh start on first message.
          clearStoredConversationId()
          setConversation(null)
          setMessages([])
        }
      }
    },
    [conversation, loadConversation],
  )

  const close = useCallback(() => {
    setIsOpen(false)
  }, [])

  const sendMessage = useCallback(
    async (body: string): Promise<boolean> => {
      const trimmed = body.trim()
      if (!trimmed) return false

      setIsSending(true)
      setError(null)
      setPendingUserMessage({
        body: trimmed,
        createdAt: new Date().toISOString(),
        id: -Date.now(),
        senderType: 'customer',
      })

      try {
        let activeId = conversation?.id
        if (!activeId) {
          const created = await ensureConversation(openOptions)
          activeId = created?.id
        }

        if (!activeId) return false

        const res = await fetch(`/api/chat/conversations/${activeId}/messages`, {
          body: JSON.stringify({ body: trimmed }),
          credentials: 'include',
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
          method: 'POST',
        })

        if (!res.ok) {
          throw new Error('Failed to send message')
        }

        const json = (await res.json()) as {
          aiMessage?: ChatMessageDTO | null
          conversation: ChatConversationDTO
          message: ChatMessageDTO
        }

        setConversation(json.conversation)
        setMessages((prev) => {
          const next = [...prev]
          if (!next.some((m) => m.id === json.message.id)) next.push(json.message)
          if (json.aiMessage && !next.some((m) => m.id === json.aiMessage?.id)) {
            next.push(json.aiMessage)
          }
          return next
        })
        return true
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send message')
        return false
      } finally {
        setPendingUserMessage(null)
        setIsSending(false)
      }
    },
    [conversation, ensureConversation, headers, openOptions],
  )

  const value = useMemo(
    () => ({
      close,
      conversation,
      error,
      isLoading,
      isOpen,
      isSending,
      messages,
      pendingUserMessage,
      open,
      sendMessage,
      unreadCount,
    }),
    [
      close,
      conversation,
      error,
      isLoading,
      isOpen,
      isSending,
      messages,
      pendingUserMessage,
      open,
      sendMessage,
      unreadCount,
    ],
  )

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChat() {
  const ctx = useContext(ChatContext)
  if (!ctx) {
    throw new Error('useChat must be used within ChatProvider')
  }
  return ctx
}
