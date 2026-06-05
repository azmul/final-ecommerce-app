'use client'

import { ChatPanel } from '@/components/chat/ChatPanel'
import { useChat } from '@/components/chat/ChatContext'
import { cn } from '@/utilities/cn'
import { MessageCircle } from 'lucide-react'
import React from 'react'

export function ChatWidget() {
  const { isOpen, open, unreadCount } = useChat()

  return (
    <>
      <button
        type="button"
        aria-expanded={isOpen}
        aria-label={unreadCount ? `Open chat, ${unreadCount} unread` : 'Open chat'}
        className={cn(
          'fixed bottom-4 left-4 z-45 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-opacity hover:opacity-95',
          isOpen && 'hidden',
        )}
        onClick={() => open()}
      >
        <MessageCircle className="size-7" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>
      <ChatPanel />
    </>
  )
}
