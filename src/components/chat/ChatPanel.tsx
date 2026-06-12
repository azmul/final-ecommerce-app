'use client'

import { useChat } from '@/components/chat/ChatContext'
import { useProductPageFloatingLayout } from '@/hooks/useProductPageFloatingLayout'
import { queueStateUpdate } from '@/hooks/queueStateUpdate'
import { Price } from '@/components/Price'
import { CheckoutLoyaltyPoints } from '@/components/checkout/CheckoutLoyaltyPoints'
import { CheckoutPromoCode } from '@/components/checkout/CheckoutPromoCode'
import { ChatMessageBubble } from '@/components/chat/ChatMessageBubble'
import { ChatThinkingIndicator } from '@/components/chat/ChatThinkingIndicator'
import { ChatComposer } from '@/components/chat/ChatComposer'
import { Button } from '@/components/ui/button'
import { cn } from '@/utilities/cn'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { AlertCircle, ChevronDown, Loader2, Sparkles, X } from 'lucide-react'
import Link from 'next/link'
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
  const { cart } = useCart()
  const { isProductPage, mobileBottomClass } = useProductPageFloatingLayout()
  const [draft, setDraft] = useState('')
  const [checkoutExpanded, setCheckoutExpanded] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [initialMessageIds, setInitialMessageIds] = useState<Set<number> | null>(null)

  useEffect(() => {
    if (!isLoading && initialMessageIds === null) {
      queueStateUpdate(() => {
        setInitialMessageIds(new Set(messages.map((message) => message.id)))
      })
    }
  }, [isLoading, initialMessageIds, messages])

  const shouldAnimateMessage = (messageId: number) => !initialMessageIds?.has(messageId)

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTo({
        behavior: 'smooth',
        top: listRef.current.scrollHeight,
      })
    }
  }, [messages, isOpen, isSending])

  useEffect(() => {
    if (!isOpen || !panelRef.current) return

    const panel = panelRef.current
    const focusable = panel.querySelectorAll<HTMLElement>(
      'button:not([disabled]), textarea:not([disabled]), a[href], input:not([disabled])',
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    first?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        close()
        return
      }

      if (event.key !== 'Tab' || focusable.length === 0) return

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }

    panel.addEventListener('keydown', onKeyDown)
    return () => panel.removeEventListener('keydown', onKeyDown)
  }, [close, isOpen])

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
      ref={panelRef}
      aria-labelledby="chat-panel-title"
      aria-modal="true"
      className={cn(
        'fixed z-50 flex flex-col overflow-hidden max-lg:transition-[bottom] max-lg:duration-300',
        isProductPage ? 'max-lg:left-auto max-lg:right-4 lg:left-4 lg:right-auto' : 'left-4',
        isProductPage ? cn(mobileBottomClass, 'lg:bottom-4') : 'bottom-4',
        'h-[min(560px,calc(100vh-2rem))] w-[min(400px,calc(100vw-2rem))]',
        'rounded-2xl border border-primary/15 bg-background/95 shadow-2xl shadow-primary/10 backdrop-blur-xl',
        'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-6 motion-safe:zoom-in-95 motion-safe:duration-500 motion-safe:ease-out',
      )}
      role="dialog"
    >
      <header className="relative overflow-hidden border-b border-primary/10 px-4 py-3.5">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/15 via-primary/5 to-transparent"
        />
        <div className="relative flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
              <Sparkles className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight" id="chat-panel-title">
                AI Shopping Assistant
              </p>
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

      {conversation?.status === 'pending' ? (
        <div className="flex items-center gap-2 border-b border-primary/25 bg-primary/10 px-4 py-2 text-[11px] text-foreground">
          <AlertCircle className="size-3.5 shrink-0" />
          <span>
            Human support has been requested. A live agent will join shortly.
            {typeof conversation.context?.order === 'number' ? ` (Order #${conversation.context.order})` : ''}
          </span>
        </div>
      ) : null}

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

      {cart?.items?.length ? (
        <div className="border-t border-primary/10 bg-muted/20 px-3 py-2">
          <button
            aria-expanded={checkoutExpanded}
            className="group flex w-full items-center justify-between rounded-xl border border-primary/15 bg-background px-3 py-2 text-left transition-colors hover:border-primary/30 hover:bg-primary/5"
            onClick={() => setCheckoutExpanded((value) => !value)}
            type="button"
          >
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-foreground">
                Checkout panel ({cart.items.length} {cart.items.length === 1 ? 'item' : 'items'})
              </p>
              {typeof cart.subtotal === 'number' ? (
                <Price
                  amount={cart.subtotal}
                  as="span"
                  className="text-xs font-semibold text-primary"
                />
              ) : (
                <p className="text-[11px] text-muted-foreground">Ready to checkout</p>
              )}
            </div>
            <ChevronDown
              className={cn(
                'size-4 shrink-0 text-muted-foreground transition-transform',
                checkoutExpanded && 'rotate-180',
              )}
            />
          </button>

          {checkoutExpanded ? (
            <div className="mt-2 rounded-xl border bg-background/95 p-2">
              <div className="flex items-center gap-2">
                <Button asChild className="h-8 flex-1 text-xs">
                  <Link href="/checkout">Checkout</Link>
                </Button>
                <Button asChild className="h-8 px-3 text-xs" variant="outline">
                  <Link href="/cart">View cart</Link>
                </Button>
              </div>
              {cart.id ? (
                <div className="mt-2 rounded-lg border bg-background">
                  <CheckoutPromoCode cartId={cart.id} />
                  <CheckoutLoyaltyPoints cartId={cart.id} />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <ChatComposer
        footerHint="Press Enter to send · Shift+Enter for new line · Click mic to speak"
        id="chat-message-input"
        inputLabel="Message the shopping assistant"
        isBusy={isSending}
        onChange={setDraft}
        onSubmit={(event) => void onSubmit(event)}
        placeholder={isSending ? 'Assistant is thinking…' : 'Ask about products, prices…'}
        value={draft}
      />
    </div>
  )
}
