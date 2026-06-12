/**
 * @vitest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

import {
  isSpeechRecognitionSupported,
  speechErrorMessage,
  useSpeechRecognition,
} from '@/hooks/useSpeechRecognition'

class MockSpeechRecognition {
  continuous = false
  interimResults = false
  lang = 'en-US'
  maxAlternatives = 1
  onend: (() => void) | null = null
  onerror: ((event: { error: string }) => void) | null = null
  onresult: ((event: unknown) => void) | null = null
  onstart: (() => void) | null = null
  restartCount = 0

  start() {
    this.onstart?.()
  }

  stop() {
    this.onend?.()
  }

  abort() {
    this.onerror?.({ error: 'aborted' })
  }

  emitResult(
    results: Array<{ isFinal: boolean; transcript: string }>,
    resultIndex = 0,
  ) {
    const payload = {
      resultIndex,
      results: results.map((entry) => ({
        isFinal: entry.isFinal,
        0: { transcript: entry.transcript },
        length: 1,
      })),
    }
    payload.results.length = results.length
    this.onresult?.(payload)
  }
}

describe('speechErrorMessage', () => {
  it('maps error kinds to user-friendly messages', () => {
    expect(speechErrorMessage('permission-denied')).toContain('Microphone access blocked')
    expect(speechErrorMessage('no-speech')).toContain("Didn't catch that")
    expect(speechErrorMessage('aborted')).toBe('')
  })
})

describe('useSpeechRecognition', () => {
  beforeEach(() => {
    vi.stubGlobal('SpeechRecognition', MockSpeechRecognition)
    vi.stubGlobal('webkitSpeechRecognition', MockSpeechRecognition)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('detects browser support', () => {
    expect(isSpeechRecognitionSupported()).toBe(true)
  })

  it('starts in idle state', () => {
    const { result } = renderHook(() => useSpeechRecognition())
    expect(result.current.state).toBe('idle')
    expect(result.current.isSupported).toBe(true)
  })

  it('transitions to listening when started', () => {
    const { result } = renderHook(() => useSpeechRecognition())

    act(() => {
      result.current.startListening()
    })

    expect(result.current.state).toBe('listening')
  })

  it('returns to idle after stop', () => {
    const onFinalTranscript = vi.fn()
    const { result } = renderHook(() => useSpeechRecognition({ onFinalTranscript }))

    act(() => {
      result.current.startListening()
    })

    act(() => {
      result.current.stopListening()
    })

    expect(result.current.state).toBe('idle')
  })

  it('does not duplicate final transcript across auto-restarts', () => {
    const onFinalTranscript = vi.fn()
    const onInterimTranscript = vi.fn()
    let recognition: MockSpeechRecognition | null = null

    vi.stubGlobal(
      'SpeechRecognition',
      class extends MockSpeechRecognition {
        constructor() {
          super()
          recognition = this
        }

        stop() {
          this.restartCount += 1
          this.onend?.()
        }
      },
    )

    const { result } = renderHook(() =>
      useSpeechRecognition({ onFinalTranscript, onInterimTranscript }),
    )

    act(() => {
      result.current.startListening()
    })

    act(() => {
      recognition?.emitResult([{ isFinal: true, transcript: 'Hi give the product' }])
    })

    act(() => {
      recognition?.stop()
    })

    act(() => {
      recognition?.emitResult([{ isFinal: true, transcript: 'Hi give the product' }], 0)
      recognition?.stop()
    })

    act(() => {
      result.current.stopListening()
    })

    expect(onFinalTranscript).toHaveBeenCalledTimes(1)
    expect(onFinalTranscript).toHaveBeenCalledWith('Hi give the product')
    expect(onInterimTranscript).not.toHaveBeenCalledWith('Hi give the product Hi give the product')
  })
})
