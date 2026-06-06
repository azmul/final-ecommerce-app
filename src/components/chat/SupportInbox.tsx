'use client'

import { ChatMessageBubble } from '@/components/chat/ChatMessageBubble'
import type { ChatContextSidebar, ChatConversationDTO, ChatMessageDTO } from '@/lib/chat/types'
import { Price } from '@/components/Price'
import { Button } from '@/components/ui/button'
import { cn } from '@/utilities/cn'
import { Loader2, Send } from 'lucide-react'
import React, { useCallback, useEffect, useRef, useState } from 'react'

type Filter = 'all' | 'open' | 'unassigned' | 'mine'

export function SupportInbox() {
  const [filter, setFilter] = useState<Filter>('open')
  const [conversations, setConversations] = useState<ChatConversationDTO[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [messages, setMessages] = useState<ChatMessageDTO[]>([])
  const [context, setContext] = useState<ChatContextSidebar | null>(null)
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const loadQueue = useCallback(async () => {
    const res = await fetch(`/api/admin/chat/conversations?filter=${filter}`, {
      credentials: 'include',
    })

    if (!res.ok) {
      throw new Error('Failed to load conversations')
    }

    const json = (await res.json()) as { conversations: ChatConversationDTO[] }
    setConversations(json.conversations)

    if (!selectedId && json.conversations[0]) {
      setSelectedId(json.conversations[0].id)
    }
  }, [filter, selectedId])

  const loadThread = useCallback(async (conversationId: number) => {
    const [threadRes, contextRes] = await Promise.all([
      fetch(`/api/admin/chat/conversations/${conversationId}`, { credentials: 'include' }),
      fetch(`/api/admin/chat/conversations/${conversationId}/context`, { credentials: 'include' }),
    ])

    if (!threadRes.ok) {
      throw new Error('Failed to load conversation')
    }

    const threadJson = (await threadRes.json()) as {
      conversation: ChatConversationDTO
      messages: ChatMessageDTO[]
    }

    setMessages(threadJson.messages)

    if (contextRes.ok) {
      const contextJson = (await contextRes.json()) as { context: ChatContextSidebar }
      setContext(contextJson.context)
    } else {
      setContext(null)
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    void loadQueue()
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load inbox'))
      .finally(() => setLoading(false))
  }, [loadQueue])

  useEffect(() => {
    if (!selectedId) return
    void loadThread(selectedId).catch((err) =>
      setError(err instanceof Error ? err.message : 'Failed to load thread'),
    )
  }, [loadThread, selectedId])

  useEffect(() => {
    const source = new EventSource('/api/admin/chat/stream', { withCredentials: true })

    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as { conversations?: ChatConversationDTO[] }
        if (data.conversations) {
          setConversations(data.conversations)
        }
      } catch {
        //
      }
    }

    return () => source.close()
  }, [])

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages])

  const sendReply = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedId || !draft.trim() || sending) return

    setSending(true)
    setError(null)

    try {
      const res = await fetch(`/api/admin/chat/conversations/${selectedId}/messages`, {
        body: JSON.stringify({ body: draft.trim() }),
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })

      if (!res.ok) {
        throw new Error('Failed to send reply')
      }

      const json = (await res.json()) as { message: ChatMessageDTO }
      setDraft('')
      setMessages((prev) => [...prev, json.message])
      await loadQueue()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reply')
    } finally {
      setSending(false)
    }
  }

  const updateConversation = async (data: Record<string, unknown>) => {
    if (!selectedId) return

    const res = await fetch(`/api/admin/chat/conversations/${selectedId}`, {
      body: JSON.stringify(data),
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      method: 'PATCH',
    })

    if (!res.ok) {
      throw new Error('Failed to update conversation')
    }

    await loadQueue()
    await loadThread(selectedId)
  }

  const selected = conversations.find((c) => c.id === selectedId) ?? null

  return (
    <div className="flex min-h-[70vh] flex-col gap-4 lg:flex-row">
      <aside className="w-full shrink-0 space-y-3 lg:w-72">
        <div className="flex flex-wrap gap-2">
          {(['all', 'open', 'unassigned', 'mine'] as Filter[]).map((value) => (
            <Button
              key={value}
              onClick={() => setFilter(value)}
              size="sm"
              type="button"
              variant={filter === value ? 'default' : 'outline'}
            >
              {value}
            </Button>
          ))}
        </div>

        <div className="max-h-[70vh] space-y-2 overflow-y-auto rounded-lg border p-2">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="mr-2 size-4 animate-spin" />
              Loading...
            </div>
          ) : null}

          {!loading && !conversations.length ? (
            <p className="px-2 py-4 text-sm text-muted-foreground">No conversations yet.</p>
          ) : null}

          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              type="button"
              className={cn(
                'w-full rounded-md border px-3 py-2 text-left text-sm transition-colors hover:bg-muted',
                selectedId === conversation.id && 'border-primary bg-muted',
              )}
              onClick={() => setSelectedId(conversation.id)}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{conversation.subject ?? 'Support chat'}</span>
                {(conversation.unreadByAgent ?? 0) > 0 ? (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] text-primary-foreground">
                    {conversation.unreadByAgent}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                {conversation.lastMessagePreview ?? 'No messages yet'}
              </p>
            </button>
          ))}
        </div>
      </aside>

      <section className="flex min-h-[50vh] min-w-0 flex-1 flex-col rounded-lg border">
        {selected ? (
          <>
            <header className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
              <div>
                <h2 className="font-semibold">{selected.subject ?? 'Support chat'}</h2>
                <p className="text-xs text-muted-foreground">Status: {selected.status}</p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                  {context?.order ? (
                    <span className="rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-primary">
                      Order #{context.order.id} · {context.order.status}
                    </span>
                  ) : null}
                  {context?.cart ? (
                    <span className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-muted-foreground">
                      Cart: {context.cart.itemCount} items
                    </span>
                  ) : null}
                  {context?.cart?.subtotal != null ? (
                    <span className="rounded-full border border-border bg-background px-2 py-0.5 text-foreground">
                      <Price amount={context.cart.subtotal} as="span" className="text-[11px] font-semibold" />
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => void updateConversation({ assignToSelf: true })} size="sm" type="button" variant="outline">
                  Assign to me
                </Button>
                <Button onClick={() => void updateConversation({ status: 'resolved' })} size="sm" type="button" variant="outline">
                  Resolve
                </Button>
                <Button onClick={() => void updateConversation({ status: 'closed' })} size="sm" type="button" variant="outline">
                  Close
                </Button>
              </div>
            </header>

            <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-3">
              {messages.map((message) => (
                <ChatMessageBubble
                  animate={false}
                  key={message.id}
                  message={message}
                  variant="staff"
                />
              ))}
            </div>

            <form className="flex gap-2 border-t p-3" onSubmit={sendReply}>
              <textarea
                className="min-h-10 flex-1 resize-none rounded-md border px-3 py-2 text-sm"
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Reply to customer..."
                rows={2}
                value={draft}
              />
              <Button disabled={sending || !draft.trim()} size="icon" type="submit">
                {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              </Button>
            </form>
          </>
        ) : (
          <p className="p-6 text-sm text-muted-foreground">Select a conversation to view messages.</p>
        )}
      </section>

      <aside className="w-full shrink-0 space-y-4 rounded-lg border p-4 lg:w-64">
        <h3 className="text-sm font-semibold">Customer context</h3>

        {context?.customer ? (
          <div className="space-y-1 text-sm">
            <p>{context.customer.name ?? 'Guest'}</p>
            <p className="text-muted-foreground">{context.customer.email}</p>
            {context.customer.phone ? (
              <p className="text-muted-foreground">{context.customer.phone}</p>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Guest shopper</p>
        )}

        {context?.pageUrl ? (
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">Page</p>
            <p className="break-all text-sm">{context.pageUrl}</p>
          </div>
        ) : null}

        {context?.cart ? (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase text-muted-foreground">Cart</p>
            <p className="text-sm">{context.cart.itemCount} items</p>
            {context.cart.subtotal != null ? (
              <Price amount={context.cart.subtotal} as="p" className="text-sm font-medium" />
            ) : null}
            <ul className="space-y-1 text-xs text-muted-foreground">
              {context.cart.items.map((item, index) => (
                <li key={`${item.title}-${index}`}>
                  {item.quantity}x {item.title}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {context?.order ? (
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">Linked order</p>
            <p className="text-sm">#{context.order.id}</p>
            <p className="text-sm capitalize">{context.order.status}</p>
          </div>
        ) : null}

        {context?.recentOrders?.length ? (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase text-muted-foreground">Recent orders</p>
            <ul className="space-y-1 text-sm">
              {context.recentOrders.map((order) => (
                <li key={order.id}>
                  #{order.id} · {order.status}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </aside>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  )
}
