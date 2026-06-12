'use client'

import {
  speechErrorMessage,
  useSpeechRecognition,
  type SpeechRecognitionState,
} from '@/hooks/useSpeechRecognition'
import { Button } from '@/components/ui/button'
import { cn } from '@/utilities/cn'
import { Loader2, Mic, MicOff } from 'lucide-react'
import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { toast } from 'sonner'

export type VoiceInputHandle = {
  abort: () => void
}

type Props = {
  className?: string
  disabled?: boolean
  inputId?: string
  lang?: string
  onFinalTranscript: (text: string) => void
  onInterimTranscript?: (text: string) => void
  onListeningChange?: (listening: boolean) => void
  onStateChange?: (state: SpeechRecognitionState) => void
}

export const VoiceInputButton = forwardRef<VoiceInputHandle, Props>(function VoiceInputButton(
  {
    className,
    disabled = false,
    inputId,
    lang,
    onFinalTranscript,
    onInterimTranscript,
    onListeningChange,
    onStateChange,
  },
  ref,
) {
  const {
    abortListening,
    errorKind,
    interimTranscript,
    isSupported,
    state,
    toggleListening,
    transcript,
  } = useSpeechRecognition({
    lang,
    onError: (kind) => {
      const message = speechErrorMessage(kind)
      if (message) toast.error(message)
    },
    onFinalTranscript,
    onInterimTranscript,
    onStateChange,
  })

  useImperativeHandle(ref, () => ({ abort: abortListening }), [abortListening])

  useEffect(() => {
    if (disabled) abortListening()
  }, [abortListening, disabled])

  const isListening = state === 'listening'
  const prevListeningRef = useRef(isListening)

  useEffect(() => {
    if (prevListeningRef.current !== isListening) {
      prevListeningRef.current = isListening
      onListeningChange?.(isListening)
    }
  }, [onListeningChange, isListening])

  if (!isSupported) return null

  const isProcessing = state === 'processing'

  const ariaLabel =
    isListening ? 'Stop listening'
    : isProcessing ? 'Processing speech'
    : 'Start voice input'

  return (
    <Button
      aria-controls={inputId}
      aria-label={ariaLabel}
      aria-pressed={isListening}
      className={cn(
        'relative size-9 shrink-0 rounded-xl',
        isListening && 'border-primary/40 bg-primary/10 text-primary',
        className,
      )}
      disabled={disabled || isProcessing}
      onClick={() => toggleListening()}
      size="icon"
      type="button"
      variant={isListening ? 'default' : 'ghost'}
    >
      {isProcessing ?
        <Loader2 className="size-4 animate-spin" />
      : isListening ?
        <>
          <Mic className="size-4" />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 motion-safe:animate-ping rounded-xl border border-primary/30 motion-reduce:hidden"
          />
        </>
      : errorKind ?
        <MicOff className="size-4 text-muted-foreground" />
      : <Mic className="size-4" />}
      <span className="sr-only">
        {transcript || interimTranscript ?
          `Transcript: ${transcript || interimTranscript}`
        : ariaLabel}
      </span>
    </Button>
  )
})
