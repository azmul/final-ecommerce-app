import { beforeEach, describe, expect, it } from 'vitest'

import { CHAT_ACTIVE_CONVERSATION_KEY } from '@/lib/chat/constants'
import {
  clearStoredConversationId,
  getStoredConversationId,
  setStoredConversationId,
} from '@/lib/chat/session'

describe('chat session persistence', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('stores and reads active conversation id', () => {
    expect(getStoredConversationId()).toBeNull()
    setStoredConversationId(42)
    expect(window.localStorage.getItem(CHAT_ACTIVE_CONVERSATION_KEY)).toBe('42')
    expect(getStoredConversationId()).toBe(42)
  })

  it('clears invalid stored conversation id', () => {
    window.localStorage.setItem(CHAT_ACTIVE_CONVERSATION_KEY, 'abc')
    expect(getStoredConversationId()).toBeNull()
    clearStoredConversationId()
    expect(getStoredConversationId()).toBeNull()
  })
})
