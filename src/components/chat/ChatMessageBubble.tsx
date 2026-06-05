'use client'

import { ChatProductResults } from '@/components/chat/ChatProductResults'
import { ChatRevealText } from '@/components/chat/ChatRevealText'
import type { ChatMessageDTO } from '@/lib/chat/types'
import { cn } from '@/utilities/cn'
import { formatDateTime } from '@/utilities/formatDateTime'
import { Bot, UserRound } from 'lucide-react'
import React from 'react'

type Props = {
  message: ChatMessageDTO
  animate?: boolean
}

export function ChatMessageBubble({ animate = true, message }: Props) {
  const isCustomer = message.senderType === 'customer'
  const isAi = message.senderType === 'system'
  const hasProducts = Boolean(message.products?.length)

  return (
    <div
      className={cn(
        'flex gap-2',
        isCustomer ? 'flex-row-reverse' : 'flex-row',
        animate &&
          'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-3 motion-safe:duration-500 motion-safe:ease-out',
      )}
    >
      {!isCustomer ? (
        <div
          aria-hidden
          className={cn(
            'mt-1 flex size-7 shrink-0 items-center justify-center rounded-full shadow-sm',
            isAi ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
          )}
        >
          {isAi ? <Bot className="size-3.5" /> : <UserRound className="size-3.5" />}
        </div>
      ) : null}

      <div
        className={cn(
          'min-w-0',
          isCustomer ? 'max-w-[82%]' : hasProducts ? 'max-w-full flex-1' : 'max-w-[88%]',
        )}
      >
        {!isCustomer && message.senderName ? (
          <p className="mb-1 px-1 text-[11px] font-medium text-muted-foreground">
            {message.senderName}
          </p>
        ) : null}

        <div
          className={cn(
            'rounded-2xl px-3.5 py-2.5 text-sm shadow-sm',
            isCustomer
              ? 'rounded-tr-md bg-primary text-primary-foreground'
              : isAi
                ? 'rounded-tl-md border border-primary/20 bg-gradient-to-br from-primary/8 via-background to-background text-foreground'
                : 'rounded-tl-md border bg-muted/80 text-foreground',
          )}
        >
          {isAi && animate ? (
            <p className="whitespace-pre-wrap break-words leading-relaxed">
              <ChatRevealText enabled text={message.body} />
            </p>
          ) : (
            <p
              className={cn(
                'whitespace-pre-wrap break-words leading-relaxed',
                animate &&
                  isAi &&
                  'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-700 motion-safe:delay-100',
              )}
            >
              {message.body}
            </p>
          )}

          {message.products?.length ? (
            <>
              <p
                className={cn(
                  'mt-2.5 text-[11px] font-semibold uppercase tracking-wide text-primary/80',
                  animate &&
                    'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-left-2 motion-safe:duration-500 motion-safe:delay-300',
                )}
              >
                {message.products.length} product{message.products.length === 1 ? '' : 's'} found
              </p>
              <ChatProductResults animate={animate} className="mt-2" products={message.products} />
            </>
          ) : null}

          <p
            className={cn(
              'mt-1.5 text-[10px]',
              isCustomer ? 'text-primary-foreground/70' : 'text-muted-foreground',
            )}
          >
            {formatDateTime({ date: message.createdAt, format: 'dd/MM/yyyy HH:mm' })}
          </p>
        </div>
      </div>
    </div>
  )
}
