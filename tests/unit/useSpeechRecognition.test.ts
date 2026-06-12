/**
 * @vitest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

import {
  applySpeechResultSlice,
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

function toResults(entries: Array<{ isFinal: boolean; transcript: string }>) {
  return entries.map((entry) => ({
    isFinal: entry.isFinal,
    0: { transcript: entry.transcript },
    length: 1,
  }))
}

describe('speechErrorMessage', () => {
  it('maps error kinds to user-friendly messages', () => {
    expect(speechErrorMessage('permission-denied')).toContain('Microphone access blocked')
    expect(speechErrorMessage('no-speech')).toContain("Didn't catch that")
    expect(speechErrorMessage('aborted')).toBe('')
  })
})

describe('applySpeechResultSlice', () => {
  it('builds live transcript from new finals and interim only', () => {
    let finals = ''

    const first = applySpeechResultSlice(
      finals,
      toResults([{ isFinal: false, transcript: 'hi ' }]) as never,
      0,
    )
    finals = first.persistedFinal
    expect(first.display).toBe('hi')

    const second = applySpeechResultSlice(
      finals,
      toResults([
        { isFinal: true, transcript: 'hi ' },
        { isFinal: false, transcript: 'can you ' },
      ]) as never,
      0,
    )
    finals = second.persistedFinal
    expect(second.display).toBe('hi can you')

    const third = applySpeechResultSlice(
      finals,
      toResults([
        { isFinal: true, transcript: 'hi ' },
        { isFinal: true, transcript: 'can you ' },
        { isFinal: false, transcript: 'give me the product list' },
      ]) as never,
      1,
    )

    expect(third.display).toBe('hi can you give me the product list')
    expect(third.display).not.toContain('hi hi can')
  })

  it('does not duplicate when only the interim tail changes', () => {
    const finals = 'hi can you '
    const next = applySpeechResultSlice(
      finals,
      toResults([{ isFinal: false, transcript: 'give me' }]) as never,
      0,
    )

    expect(next.display).toBe('hi can you give me')
  })

  it('collapses overlapping cumulative interim phrases', () => {
    const next = applySpeechResultSlice(
      '',
      toResults([
        { isFinal: false, transcript: 'hi ' },
        { isFinal: false, transcript: 'hi can ' },
        { isFinal: false, transcript: 'hi can you ' },
        { isFinal: false, transcript: 'hi can you give ' },
        { isFinal: false, transcript: 'hi can you give me' },
      ]) as never,
      0,
    )

    expect(next.display).toBe('hi can you give me')
    expect(next.display).not.toContain('hi hi can')
  })

  it('collapses repeated final phrases from overlapping result slices', () => {
    let finals = ''

    const first = applySpeechResultSlice(
      finals,
      toResults([{ isFinal: true, transcript: 'Hi give the product' }]) as never,
      0,
    )
    finals = first.persistedFinal

    const second = applySpeechResultSlice(
      finals,
      toResults([{ isFinal: true, transcript: 'Hi give the product' }]) as never,
      0,
    )

    expect(second.display).toBe('Hi give the product')
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

  it('streams a single clean transcript across result events', () => {
    const onInterimTranscript = vi.fn()
    let recognition: MockSpeechRecognition | null = null

    vi.stubGlobal(
      'SpeechRecognition',
      class extends MockSpeechRecognition {
        constructor() {
          super()
          recognition = this
        }
      },
    )

    const { result } = renderHook(() => useSpeechRecognition({ onInterimTranscript }))

    act(() => {
      result.current.startListening()
    })

    act(() => {
      recognition?.emitResult([{ isFinal: false, transcript: 'hi ' }], 0)
      recognition?.emitResult(
        [
          { isFinal: true, transcript: 'hi ' },
          { isFinal: false, transcript: 'can you ' },
        ],
        0,
      )
      recognition?.emitResult(
        [
          { isFinal: true, transcript: 'hi ' },
          { isFinal: true, transcript: 'can you ' },
          { isFinal: false, transcript: 'give me the product list' },
        ],
        1,
      )
    })

    expect(onInterimTranscript).toHaveBeenLastCalledWith('hi can you give me the product list')
    expect(onInterimTranscript).not.toHaveBeenCalledWith(
      expect.stringMatching(/hi\s+hi\s+can/i),
    )
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
  })
})
