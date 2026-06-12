'use client'

import { VoiceInputButton, type VoiceInputHandle } from '@/components/chat/VoiceInputButton'
import { VoiceStatusBar } from '@/components/chat/VoiceStatusBar'
import { Button } from '@/components/ui/button'
import type { SpeechRecognitionState } from '@/hooks/useSpeechRecognition'
import { Loader2, Send } from 'lucide-react'
import React, { useCallback, useEffect, useRef, useState } from 'react'

type Props = {
  disabled?: boolean
  formClassName?: string
  footerHint?: string
  id: string
  inputLabel: string
  isBusy?: boolean
  maxLength?: number
  onChange: (value: string) => void
  onSubmit: (event: React.FormEvent) => void
  onVoiceStart?: () => void
  placeholder?: string
  rows?: number
  value: string
}

export function ChatComposer({
  disabled = false,
  formClassName = 'border-t border-primary/10 bg-background/90 p-3 backdrop-blur-sm',
  footerHint = 'Press Enter to send · Click mic to speak',
  id,
  inputLabel,
  isBusy = false,
  maxLength = 2000,
  onChange,
  onSubmit,
  onVoiceStart,
  placeholder,
  rows = 2,
  value,
}: Props) {
  const [voiceState, setVoiceState] = useState<SpeechRecognitionState>('idle')
  const [voiceInterim, setVoiceInterim] = useState('')
  const voiceInputRef = useRef<VoiceInputHandle>(null)
  const voiceBaseRef = useRef('')
  const voiceSessionTextRef = useRef('')

  const isListening = voiceState === 'listening'

  const abortVoice = useCallback(() => {
    voiceInputRef.current?.abort()
    setVoiceInterim('')
  }, [])

  useEffect(() => {
    if (isBusy) abortVoice()
  }, [abortVoice, isBusy])

  const applyVoicePreview = useCallback(
    (sessionText: string) => {
      voiceSessionTextRef.current = sessionText
      const base = voiceBaseRef.current.trim()
      const next = sessionText ? (base ? `${base} ${sessionText}` : sessionText) : base
      onChange(next.slice(0, maxLength))
    },
    [maxLength, onChange],
  )

  const commitVoiceText = useCallback(
    (spoken: string) => {
      const trimmed = spoken.trim()
      if (!trimmed) return
      const base = voiceBaseRef.current.trim()
      const next = base ? `${base} ${trimmed}` : trimmed
      const clipped = next.slice(0, maxLength)
      voiceBaseRef.current = clipped
      voiceSessionTextRef.current = ''
      onChange(clipped)
    },
    [maxLength, onChange],
  )

  const handleInterimTranscript = useCallback(
    (combined: string) => {
      setVoiceInterim(combined)
      applyVoicePreview(combined)
    },
    [applyVoicePreview],
  )

  const handleFinalTranscript = useCallback(
    (text: string) => {
      commitVoiceText(text)
      setVoiceInterim('')
    },
    [commitVoiceText],
  )

  const handleListeningChange = useCallback(
    (listening: boolean) => {
      if (listening) {
        voiceBaseRef.current = value
        voiceSessionTextRef.current = ''
        onVoiceStart?.()
        return
      }

      setVoiceInterim('')
      if (voiceSessionTextRef.current) {
        onChange(voiceBaseRef.current.slice(0, maxLength))
        voiceSessionTextRef.current = ''
      }
    },
    [maxLength, onChange, onVoiceStart, value],
  )

  const handleSubmit = useCallback(
    (event: React.FormEvent) => {
      abortVoice()
      onSubmit(event)
    },
    [abortVoice, onSubmit],
  )

  return (
    <form className={formClassName} onSubmit={handleSubmit}>
      <VoiceStatusBar className="mb-2" interimText={voiceInterim} state={voiceState} />

      <div className="flex items-end gap-2 rounded-2xl border border-primary/15 bg-muted/30 p-2 shadow-inner focus-within:border-primary/35 focus-within:ring-2 focus-within:ring-primary/15">
        <label className="sr-only" htmlFor={id}>
          {inputLabel}
        </label>
        <textarea
          className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
          disabled={disabled || isBusy || isListening}
          id={id}
          maxLength={maxLength}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              handleSubmit(event)
            }
          }}
          placeholder={placeholder}
          rows={rows}
          value={value}
        />
        <VoiceInputButton
          disabled={disabled || isBusy}
          inputId={id}
          onFinalTranscript={handleFinalTranscript}
          onInterimTranscript={handleInterimTranscript}
          onListeningChange={handleListeningChange}
          onStateChange={setVoiceState}
          ref={voiceInputRef}
        />
        <Button
          aria-label="Send message"
          className="size-9 shrink-0 rounded-xl shadow-sm"
          disabled={isBusy || !value.trim()}
          size="icon"
          type="submit"
        >
          {isBusy ?
            <Loader2 className="size-4 animate-spin" />
          : <Send className="size-4" />}
        </Button>
      </div>
      <p className="mt-2 text-center text-[10px] text-muted-foreground">{footerHint}</p>
    </form>
  )
}
