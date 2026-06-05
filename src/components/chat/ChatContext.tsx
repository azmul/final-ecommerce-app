'use client'

import type { ChatConversationDTO, ChatMessageDTO } from '@/lib/chat/types'
import {
  chatSessionHeaders,
  chatSessionQuery,
  clearStoredConversationId,
  getOrCreateGuestSessionId,
  getStoredConversationId,
  setStoredConversationId,
} from '@/lib/chat/session'
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
  sendMessage: (body: string) => Promise<void>
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
  const guestSessionIdRef = useRef('')
  const restoredForKeyRef = useRef('')

  const headers = useMemo(() => {
    if (!guestSessionIdRef.current) {
      guestSessionIdRef.current = getOrCreateGuestSessionId()
    }
    return chatSessionHeaders(guestSessionIdRef.current)
  }, [user?.id])

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
    const restoreKey = `${user?.id ?? 'guest'}:${guestSessionIdRef.current || getOrCreateGuestSessionId()}`
    if (restoredForKeyRef.current === restoreKey) return
    restoredForKeyRef.current = restoreKey

    void restoreConversation().catch(() => {
      //
    })
  }, [restoreConversation, user?.id])

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
    [cart?.id, headers, loadConversation],
  )

  const lastMessageIdRef = useRef(0)

  useEffect(() => {
    lastMessageIdRef.current = messages.at(-1)?.id ?? 0
  }, [messages])

  const connectStream = useCallback(
    (conversationId: number) => {
      eventSourceRef.current?.close()

      const streamUrl = `/api/chat/conversations/${conversationId}/stream?afterId=${lastMessageIdRef.current}&${chatSessionQuery(guestSessionIdRef.current)}`
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
    [],
  )

  useEffect(() => {
    if (!conversation?.id) return

    connectStream(conversation.id)

    return () => {
      eventSourceRef.current?.close()
      eventSourceRef.current = null
    }
  }, [connectStream, conversation?.id])

  const open = useCallback(
    async (options: ChatOpenOptions = {}) => {
      setOpenOptions(options)
      setIsOpen(true)

      if (conversation?.id) {
        try {
          await loadConversation(conversation.id)
        } catch {
          await ensureConversation(options)
        }
        return
      }

      await ensureConversation(options)
    },
    [conversation?.id, ensureConversation, loadConversation],
  )

  const close = useCallback(() => {
    setIsOpen(false)
    eventSourceRef.current?.close()
    eventSourceRef.current = null
  }, [])

  const sendMessage = useCallback(
    async (body: string) => {
      const trimmed = body.trim()
      if (!trimmed) return

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

        if (!activeId) return

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
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send message')
      } finally {
        setPendingUserMessage(null)
        setIsSending(false)
      }
    },
    [conversation?.id, ensureConversation, headers, openOptions],
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
