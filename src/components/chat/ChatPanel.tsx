'use client'

import { useChat } from '@/components/chat/ChatContext'
import { ChatMessageBubble } from '@/components/chat/ChatMessageBubble'
import { ChatThinkingIndicator } from '@/components/chat/ChatThinkingIndicator'
import { Button } from '@/components/ui/button'
import { cn } from '@/utilities/cn'
import { Loader2, Send, Sparkles, X } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'

const QUICK_PROMPTS = [
  'Products under 500 BDT',
  'Show today’s offers',
  'Help me choose a gift',
] as const

export function ChatPanel() {
  const {
    close,
    conversation,
    error,
    isLoading,
    isOpen,
    isSending,
    messages,
    pendingUserMessage,
    sendMessage,
  } = useChat()
  const [draft, setDraft] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const initialMessageIdsRef = useRef<Set<number> | null>(null)

  if (!isLoading && initialMessageIdsRef.current === null) {
    initialMessageIdsRef.current = new Set(messages.map((message) => message.id))
  }

  const shouldAnimateMessage = (messageId: number) =>
    !initialMessageIdsRef.current?.has(messageId)

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTo({
        behavior: 'smooth',
        top: listRef.current.scrollHeight,
      })
    }
  }, [messages, isOpen, isSending])

  if (!isOpen) return null

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const body = draft.trim()
    if (!body || isSending) return
    setDraft('')
    await sendMessage(body)
  }

  const onQuickPrompt = (prompt: string) => {
    if (isSending) return
    void sendMessage(prompt)
  }

  return (
    <div
      className={cn(
        'fixed bottom-4 left-4 z-50 flex flex-col overflow-hidden',
        'h-[min(560px,calc(100vh-2rem))] w-[min(400px,calc(100vw-2rem))]',
        'rounded-2xl border border-primary/15 bg-background/95 shadow-2xl shadow-primary/10 backdrop-blur-xl',
        'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-6 motion-safe:zoom-in-95 motion-safe:duration-500 motion-safe:ease-out',
      )}
      role="dialog"
      aria-label="Shopping assistant chat"
    >
      <header className="relative overflow-hidden border-b border-primary/10 px-4 py-3.5">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/15 via-primary/5 to-transparent"
        />
        <div className="relative flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/25">
              <Sparkles className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight">AI Shopping Assistant</p>
              <p className="truncate text-xs text-muted-foreground">
                {conversation?.subject ?? 'Search products · Compare · Add to cart'}
              </p>
            </div>
          </div>
          <Button aria-label="Close chat" onClick={close} size="icon" type="button" variant="ghost">
            <X className="size-4" />
          </Button>
        </div>
      </header>

      <div
        ref={listRef}
        className="flex-1 space-y-4 overflow-y-auto bg-gradient-to-b from-muted/20 to-background px-4 py-4"
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="mr-2 size-4 animate-spin" />
            Starting chat…
          </div>
        ) : null}

        {!isLoading && !messages.length ? (
          <div className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-500 space-y-4 py-2">
            <div className="rounded-2xl border border-dashed border-primary/25 bg-primary/5 px-4 py-5 text-center">
              <p className="text-sm font-medium text-foreground">What are you looking for?</p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                Ask about products, prices, or availability. I search the catalog first — a human
                agent can join when needed.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  className="rounded-full border border-primary/20 bg-background px-3 py-1.5 text-xs font-medium text-foreground shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/5"
                  disabled={isSending}
                  onClick={() => onQuickPrompt(prompt)}
                  type="button"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {messages.map((message) => (
          <ChatMessageBubble
            animate={shouldAnimateMessage(message.id)}
            key={message.id}
            message={message}
          />
        ))}

        {pendingUserMessage &&
        !messages.some(
          (message) =>
            message.senderType === 'customer' && message.body === pendingUserMessage.body,
        ) ? (
          <ChatMessageBubble animate message={pendingUserMessage} />
        ) : null}

        {isSending ? <ChatThinkingIndicator /> : null}
      </div>

      {error ? (
        <p className="border-t border-destructive/20 bg-destructive/5 px-4 py-2 text-xs text-destructive">
          {error}
        </p>
      ) : null}

      <form
        className="border-t border-primary/10 bg-background/90 p-3 backdrop-blur-sm"
        onSubmit={(event) => void onSubmit(event)}
      >
        <div className="flex items-end gap-2 rounded-2xl border border-primary/15 bg-muted/30 p-2 shadow-inner focus-within:border-primary/35 focus-within:ring-2 focus-within:ring-primary/15">
          <textarea
            className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
            disabled={isSending}
            maxLength={2000}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                void onSubmit(event)
              }
            }}
            placeholder={isSending ? 'Assistant is thinking…' : 'Ask about products, prices…'}
            rows={2}
            value={draft}
          />
          <Button
            className="size-9 shrink-0 rounded-xl shadow-sm"
            disabled={isSending || !draft.trim()}
            size="icon"
            type="submit"
          >
            {isSending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </Button>
        </div>
        <p className="mt-2 text-center text-[10px] text-muted-foreground">
          Press Enter to send · Shift+Enter for new line
        </p>
      </form>
    </div>
  )
}
