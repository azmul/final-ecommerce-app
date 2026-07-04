'use client'

import { ChatPanel } from '@/components/chat/ChatPanel'
import { useChat } from '@/components/chat/ChatContext'
import { CHAT_THEME_CLASS } from '@/components/chat/chatTheme'
import { useProductPageFloatingLayout } from '@/hooks/useProductPageFloatingLayout'
import { cn } from '@/utilities/cn'
import { MessageCircle, Sparkles } from 'lucide-react'
import { usePathname } from 'next/navigation'
import React from 'react'

export function ChatWidget() {
  const { isOpen, open, unreadCount } = useChat()
  const { isProductPage, mobileBottomClass } = useProductPageFloatingLayout()
  const pathname = usePathname()

  // Checkout is a form-dense funnel page — a floating bubble sits on top of
  // the guest form fields on mobile and distracts mid-purchase.
  if (pathname?.startsWith('/checkout')) return <ChatPanel />

  return (
    <>
      <button
        type="button"
        aria-expanded={isOpen}
        aria-label={unreadCount ? `Open chat, ${unreadCount} unread` : 'Open shopping assistant'}
        className={cn(
          CHAT_THEME_CLASS,
          'group fixed z-45 flex size-14 items-center justify-center rounded-full max-lg:transition-[bottom] max-lg:duration-300',
          isProductPage ? 'max-lg:left-auto max-lg:right-4 lg:left-4 lg:right-auto' : 'left-4',
          isProductPage ? cn(mobileBottomClass, 'lg:bottom-4') : 'bottom-4',
          'bg-gradient-to-br from-primary to-primary/85 text-white ring-2 ring-inset ring-[color:var(--chat-ring-inner)]',
          'shadow-lg shadow-primary/30 transition-all hover:scale-105 hover:shadow-xl hover:shadow-primary/35',
          'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-90 motion-safe:duration-500',
          isOpen && 'pointer-events-none scale-0 opacity-0',
        )}
        onClick={() => open()}
      >
        <span
          aria-hidden
          className="absolute inset-0 rounded-full bg-primary/30 motion-safe:animate-ping motion-safe:duration-[2.5s]"
        />
        <span
          aria-hidden
          className="absolute -inset-1 rounded-full border border-primary/30 motion-safe:animate-pulse"
        />

        <span className="relative flex items-center justify-center text-white">
          <MessageCircle className="size-7 text-white transition-transform group-hover:scale-110" />
          <Sparkles className="absolute -right-1 -top-1 size-3.5 text-white/95" />
        </span>

        {unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white shadow-md">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>
      <ChatPanel />
    </>
  )
}
