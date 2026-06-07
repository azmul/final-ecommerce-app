'use client'

import { queueStateUpdate } from '@/hooks/queueStateUpdate'
import { cn } from '@/utilities/cn'
import React, { useEffect, useState } from 'react'

type Props = {
  className?: string
  enabled?: boolean
  text: string
}

export function ChatRevealText({ className, enabled = true, text }: Props) {
  const [revealed, setRevealed] = useState(enabled ? '' : text)

  useEffect(() => {
    if (!enabled) {
      queueStateUpdate(() => setRevealed(text))
      return
    }

    queueStateUpdate(() => setRevealed(''))
    const tokens = text.match(/\S+\s*/g) ?? [text]
    let index = 0
    let cancelled = false

    const tick = () => {
      if (cancelled) return
      index += 1
      setRevealed(tokens.slice(0, index).join(''))
      if (index < tokens.length) {
        window.setTimeout(tick, 28)
      }
    }

    const start = window.setTimeout(tick, 80)

    return () => {
      cancelled = true
      window.clearTimeout(start)
    }
  }, [enabled, text])

  return (
    <span className={cn(className, enabled && revealed.length < text.length && 'chat-reveal-cursor')}>
      {revealed}
    </span>
  )
}
