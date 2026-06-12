'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export type SpeechRecognitionState = 'idle' | 'listening' | 'processing' | 'error'

export type SpeechRecognitionErrorKind =
  | 'unsupported'
  | 'permission-denied'
  | 'no-speech'
  | 'network'
  | 'timeout'
  | 'aborted'
  | 'unknown'

type SpeechRecognitionInstance = {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  onend: (() => void) | null
  onerror: ((event: { error: string }) => void) | null
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null
  onstart: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

type SpeechRecognitionResultEvent = {
  resultIndex: number
  results: {
    length: number
    [index: number]: {
      isFinal: boolean
      [index: number]: { transcript: string }
    }
  }
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

const SILENCE_MS = 1500
const MAX_LISTEN_MS = 30000

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null
}

function mapSpeechError(error: string): SpeechRecognitionErrorKind {
  switch (error) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'permission-denied'
    case 'no-speech':
      return 'no-speech'
    case 'network':
      return 'network'
    case 'aborted':
      return 'aborted'
    default:
      return 'unknown'
  }
}

export function speechErrorMessage(kind: SpeechRecognitionErrorKind): string {
  switch (kind) {
    case 'unsupported':
      return "Voice input isn't supported in this browser. Type your question instead."
    case 'permission-denied':
      return 'Microphone access blocked. Enable it in browser settings and try again.'
    case 'no-speech':
      return "Didn't catch that. Try again."
    case 'network':
      return 'Voice recognition failed. Check your connection or type instead.'
    case 'timeout':
      return 'Listening timed out.'
    case 'aborted':
      return ''
    default:
      return 'Voice recognition failed. Try again or type instead.'
  }
}

export function isSpeechRecognitionSupported(): boolean {
  return getSpeechRecognitionConstructor() !== null
}

type SpeechResultsList = SpeechRecognitionResultEvent['results']

/** MDN speech-recognition pattern: append only new finals, interim from this event slice. */
export function applySpeechResultSlice(
  persistedFinal: string,
  results: SpeechResultsList,
  resultIndex: number,
): { display: string; interim: string; persistedFinal: string } {
  let interim = ''
  let finals = persistedFinal

  for (let i = resultIndex; i < results.length; i += 1) {
    const result = results[i]
    const text = result[0]?.transcript ?? ''
    if (!text) continue

    if (result.isFinal) {
      const trimmed = text.trim()
      const committed = finals.trim()

      if (
        trimmed &&
        (committed === trimmed ||
          committed.endsWith(` ${trimmed}`) ||
          (trimmed.startsWith(committed) && trimmed.length > committed.length))
      ) {
        if (trimmed.startsWith(committed) && trimmed.length > committed.length) {
          finals = `${trimmed} `
        }
        continue
      }

      finals += text
    } else {
      interim += text
    }
  }

  return {
    display: (finals + interim).trim(),
    interim: interim.trim(),
    persistedFinal: finals,
  }
}

type UseSpeechRecognitionOptions = {
  lang?: string
  onFinalTranscript?: (text: string) => void
  onInterimTranscript?: (text: string) => void
  onStateChange?: (state: SpeechRecognitionState) => void
  onError?: (kind: SpeechRecognitionErrorKind) => void
}

export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}) {
  const { lang = 'en-US', onFinalTranscript, onInterimTranscript, onStateChange, onError } =
    options

  const onFinalTranscriptRef = useRef(onFinalTranscript)
  const onInterimTranscriptRef = useRef(onInterimTranscript)
  const onStateChangeRef = useRef(onStateChange)
  const onErrorRef = useRef(onError)

  useEffect(() => {
    onFinalTranscriptRef.current = onFinalTranscript
    onInterimTranscriptRef.current = onInterimTranscript
    onStateChangeRef.current = onStateChange
    onErrorRef.current = onError
  }, [onError, onFinalTranscript, onInterimTranscript, onStateChange])

  const [state, setState] = useState<SpeechRecognitionState>('idle')
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [errorKind, setErrorKind] = useState<SpeechRecognitionErrorKind | null>(null)
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    setIsSupported(isSpeechRecognitionSupported())
  }, [])

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const wantsListeningRef = useRef(false)
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const maxListenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const finalTranscriptRef = useRef('')
  const lastDisplayRef = useRef('')

  const clearTimers = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
    if (maxListenTimerRef.current) {
      clearTimeout(maxListenTimerRef.current)
      maxListenTimerRef.current = null
    }
  }, [])

  const updateState = useCallback((next: SpeechRecognitionState) => {
    setState(next)
    onStateChangeRef.current?.(next)
  }, [])

  const resetSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
    silenceTimerRef.current = setTimeout(() => {
      wantsListeningRef.current = false
      recognitionRef.current?.stop()
    }, SILENCE_MS)
  }, [])

  const stopListening = useCallback(() => {
    wantsListeningRef.current = false
    clearTimers()
    recognitionRef.current?.stop()
  }, [clearTimers])

  const abortListening = useCallback(() => {
    wantsListeningRef.current = false
    clearTimers()
    recognitionRef.current?.abort()
    finalTranscriptRef.current = ''
    lastDisplayRef.current = ''
    updateState('idle')
  }, [clearTimers, updateState])

  const emitDisplay = useCallback((display: string, interim: string) => {
    if (!display) return

    lastDisplayRef.current = display
    setInterimTranscript(interim)
    setTranscript(display)
    onInterimTranscriptRef.current?.(display)
  }, [])

  const startListening = useCallback(() => {
    const Ctor = getSpeechRecognitionConstructor()
    if (!Ctor) {
      setErrorKind('unsupported')
      updateState('error')
      onErrorRef.current?.('unsupported')
      return
    }

    recognitionRef.current?.abort()

    setErrorKind(null)
    setTranscript('')
    setInterimTranscript('')
    finalTranscriptRef.current = ''
    lastDisplayRef.current = ''
    wantsListeningRef.current = true

    const recognition = new Ctor()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = lang
    recognition.maxAlternatives = 1
    recognitionRef.current = recognition

    recognition.onstart = () => {
      updateState('listening')
      maxListenTimerRef.current = setTimeout(() => {
        wantsListeningRef.current = false
        recognition.stop()
        setErrorKind('timeout')
        updateState('error')
        onErrorRef.current?.('timeout')
      }, MAX_LISTEN_MS)
    }

    recognition.onresult = (event) => {
      resetSilenceTimer()

      const next = applySpeechResultSlice(
        finalTranscriptRef.current,
        event.results,
        event.resultIndex,
      )
      finalTranscriptRef.current = next.persistedFinal

      if (!next.display || next.display === lastDisplayRef.current) return

      emitDisplay(next.display, next.interim)
    }

    recognition.onerror = (event) => {
      clearTimers()
      wantsListeningRef.current = false

      if (event.error === 'aborted') {
        finalTranscriptRef.current = ''
        lastDisplayRef.current = ''
        updateState('idle')
        return
      }

      const kind = mapSpeechError(event.error)
      setErrorKind(kind)
      updateState('error')
      onErrorRef.current?.(kind)
    }

    recognition.onend = () => {
      clearTimers()

      if (wantsListeningRef.current) {
        try {
          recognition.start()
          return
        } catch {
          wantsListeningRef.current = false
        }
      }

      const finals = finalTranscriptRef.current.trim()
      if (finals) {
        setTranscript(finals)
        onFinalTranscriptRef.current?.(finals)
      }

      finalTranscriptRef.current = ''
      lastDisplayRef.current = ''
      updateState('idle')
      setInterimTranscript('')
    }

    try {
      recognition.start()
    } catch {
      setErrorKind('unknown')
      updateState('error')
      onErrorRef.current?.('unknown')
    }
  }, [clearTimers, emitDisplay, lang, resetSilenceTimer, updateState])

  const toggleListening = useCallback(() => {
    if (state === 'listening') {
      stopListening()
      updateState('processing')
      return
    }

    if (state === 'processing') return
    startListening()
  }, [startListening, state, stopListening, updateState])

  useEffect(() => {
    return () => {
      wantsListeningRef.current = false
      clearTimers()
      recognitionRef.current?.abort()
    }
  }, [clearTimers])

  return {
    abortListening,
    errorKind,
    interimTranscript,
    isSupported,
    startListening,
    state,
    stopListening,
    toggleListening,
    transcript,
  }
}
