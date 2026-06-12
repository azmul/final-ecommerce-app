'use client'

import type { SpeechRecognitionState } from '@/hooks/useSpeechRecognition'
import { cn } from '@/utilities/cn'
import { Mic } from 'lucide-react'
import React from 'react'

type Props = {
  className?: string
  interimText?: string
  state: SpeechRecognitionState
}

export function VoiceStatusBar({ className, interimText, state }: Props) {
  if (state !== 'listening' && state !== 'processing') return null

  const label = state === 'processing' ? 'Processing speech…' : 'Listening…'

  return (
    <div
      aria-live="polite"
      className={cn(
        'flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-foreground',
        className,
      )}
      role="status"
    >
      <Mic
        aria-hidden
        className={cn(
          'size-3.5 shrink-0 text-primary',
          state === 'listening' && 'motion-safe:animate-pulse',
        )}
      />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-primary">{label}</p>
        {interimText ? (
          <p className="mt-0.5 truncate text-muted-foreground">{interimText}</p>
        ) : null}
      </div>
    </div>
  )
}
