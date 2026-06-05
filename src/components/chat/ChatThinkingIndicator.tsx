'use client'

import { cn } from '@/utilities/cn'
import { Sparkles } from 'lucide-react'
import React, { useEffect, useState } from 'react'

const THINKING_PHASES = [
  'Understanding your request…',
  'Searching the catalog…',
  'Checking prices & stock…',
  'Preparing recommendations…',
] as const

type Props = {
  className?: string
}

export function ChatThinkingIndicator({ className }: Props) {
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    let phaseTimeout: number | undefined

    const interval = window.setInterval(() => {
      setVisible(false)
      phaseTimeout = window.setTimeout(() => {
        setPhaseIndex((current) => (current + 1) % THINKING_PHASES.length)
        setVisible(true)
      }, 180)
    }, 2200)

    return () => {
      window.clearInterval(interval)
      if (phaseTimeout) window.clearTimeout(phaseTimeout)
    }
  }, [])

  return (
    <div
      aria-busy="true"
      aria-label="AI is thinking"
      className={cn(
        'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-400',
        'flex justify-start',
        className,
      )}
      role="status"
    >
      <div className="chat-thinking-bubble relative max-w-[88%] overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-background to-primary/5 px-4 py-3 shadow-sm">
        <div
          aria-hidden
          className="chat-thinking-shimmer pointer-events-none absolute inset-0 opacity-40"
        />

        <div className="relative flex items-start gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Sparkles className="size-4 motion-safe:animate-pulse" />
          </div>

          <div className="min-w-0 space-y-2 pt-0.5">
            <p className="text-xs font-semibold text-primary">AI Shopping Assistant</p>

            <p
              className={cn(
                'text-sm text-muted-foreground transition-all duration-200 motion-safe:duration-200',
                visible ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0',
              )}
            >
              {THINKING_PHASES[phaseIndex]}
            </p>

            <div aria-hidden className="flex items-center gap-1">
              {[0, 1, 2].map((dot) => (
                <span
                  key={dot}
                  className="chat-thinking-dot size-1.5 rounded-full bg-primary/70"
                  style={{ animationDelay: `${dot * 160}ms` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
