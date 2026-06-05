'use client'

import { useChat } from '@/components/chat/ChatContext'
import { ChatProductResults } from '@/components/chat/ChatProductResults'
import { Button } from '@/components/ui/button'
import { cn } from '@/utilities/cn'
import { formatDateTime } from '@/utilities/formatDateTime'
import { Loader2, Send, X } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'

export function ChatPanel() {
  const { close, conversation, error, isLoading, isOpen, isSending, messages, sendMessage } =
    useChat()
  const [draft, setDraft] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages, isOpen])

  if (!isOpen) return null

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const body = draft.trim()
    if (!body || isSending) return
    setDraft('')
    await sendMessage(body)
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 flex h-[min(520px,calc(100vh-2rem))] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border bg-background shadow-xl">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <p className="text-sm font-semibold">Live support</p>
          <p className="text-xs text-muted-foreground">
            {conversation?.subject ?? 'We typically reply within a few minutes'}
          </p>
        </div>
        <Button aria-label="Close chat" onClick={close} size="icon" type="button" variant="ghost">
          <X className="size-4" />
        </Button>
      </header>

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="mr-2 size-4 animate-spin" />
            Starting chat...
          </div>
        ) : null}

        {!isLoading && !messages.length ? (
          <p className="text-sm text-muted-foreground">
            Ask about products, compare options, or get shopping help. Our AI assistant searches
            the catalog first, and a human agent can join when needed.
          </p>
        ) : null}

        {messages.map((message) => {
          const isCustomer = message.senderType === 'customer'
          const isAi = message.senderType === 'system'
          return (
            <div
              key={message.id}
              className={cn('flex', isCustomer ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cn(
                  isAi && message.products?.length ? 'max-w-full w-full' : 'max-w-[85%]',
                  'rounded-lg px-3 py-2 text-sm',
                  isCustomer
                    ? 'bg-primary text-primary-foreground'
                    : isAi
                      ? 'border border-primary/20 bg-primary/5 text-foreground'
                      : 'bg-muted text-foreground',
                )}
              >
                {!isCustomer && message.senderName ? (
                  <p className="mb-1 text-xs font-medium opacity-80">{message.senderName}</p>
                ) : null}
                <p className="whitespace-pre-wrap break-words">{message.body}</p>
                {message.products?.length ? (
                  <ChatProductResults products={message.products} />
                ) : null}
                <p className="mt-1 text-[10px] opacity-70">
                  {formatDateTime({ date: message.createdAt, format: 'dd/MM/yyyy HH:mm' })}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {error ? <p className="px-4 pb-2 text-xs text-destructive">{error}</p> : null}

      <form className="flex gap-2 border-t p-3" onSubmit={onSubmit}>
        <textarea
          className="min-h-10 flex-1 resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
          maxLength={2000}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Type your message..."
          rows={2}
          value={draft}
        />
        <Button disabled={isSending || !draft.trim()} size="icon" type="submit">
          {isSending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        </Button>
      </form>
    </div>
  )
}
