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

  start() {
    this.onstart?.()
  }

  stop() {
    this.onend?.()
  }

  abort() {
    this.onerror?.({ error: 'aborted' })
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
})
