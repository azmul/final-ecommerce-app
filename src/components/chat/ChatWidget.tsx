'use client'

import { ChatPanel } from '@/components/chat/ChatPanel'
import { useChat } from '@/components/chat/ChatContext'
import { cn } from '@/utilities/cn'
import { MessageCircle, Sparkles } from 'lucide-react'
import React from 'react'

export function ChatWidget() {
  const { isOpen, open, unreadCount } = useChat()

  return (
    <>
      <button
        type="button"
        aria-expanded={isOpen}
        aria-label={unreadCount ? `Open chat, ${unreadCount} unread` : 'Open shopping assistant'}
        className={cn(
          'group fixed bottom-4 left-4 z-45 flex size-14 items-center justify-center rounded-full',
          'bg-gradient-to-br from-primary to-primary/85 text-primary-foreground',
          'shadow-lg shadow-primary/30 transition-all hover:scale-105 hover:shadow-xl hover:shadow-primary/35',
          'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-90 motion-safe:duration-500',
          isOpen && 'pointer-events-none scale-0 opacity-0',
        )}
        onClick={() => open()}
      >
        <span
          aria-hidden
          className="absolute inset-0 rounded-full bg-primary/40 motion-safe:animate-ping motion-safe:duration-[2.5s]"
        />
        <span
          aria-hidden
          className="absolute -inset-1 rounded-full border border-primary/30 motion-safe:animate-pulse"
        />

        <span className="relative flex items-center justify-center">
          <MessageCircle className="size-7 transition-transform group-hover:scale-110" />
          <Sparkles className="absolute -right-1 -top-1 size-3.5 text-primary-foreground/90" />
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
