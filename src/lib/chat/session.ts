import {
  CHAT_ACTIVE_CONVERSATION_KEY,
  CHAT_GUEST_SESSION_KEY,
  CHAT_SESSION_HEADER,
} from '@/lib/chat/constants'

const CHAT_SESSION_COOKIE = 'chat_guest_session'

export function getGuestSessionIdFromRequest(headers: Headers, url?: URL): string | null {
  const headerValue = headers.get(CHAT_SESSION_HEADER)?.trim()
  if (headerValue) return headerValue

  if (url) {
    const queryValue = url.searchParams.get('guestSession')?.trim()
    if (queryValue) return queryValue
  }

  const cookie = headers.get('cookie') ?? ''
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${CHAT_SESSION_COOKIE}=([^;]+)`))
  if (match?.[1]) {
    return decodeURIComponent(match[1])
  }

  return null
}

export function getOrCreateGuestSessionId(): string {
  if (typeof window === 'undefined') {
    return ''
  }

  const existing = window.localStorage.getItem(CHAT_GUEST_SESSION_KEY)
  if (existing) {
    document.cookie = `${CHAT_SESSION_COOKIE}=${encodeURIComponent(existing)}; path=/; max-age=31536000; samesite=lax`
    return existing
  }

  const id = crypto.randomUUID()
  window.localStorage.setItem(CHAT_GUEST_SESSION_KEY, id)
  document.cookie = `${CHAT_SESSION_COOKIE}=${encodeURIComponent(id)}; path=/; max-age=31536000; samesite=lax`
  return id
}

export function chatSessionHeaders(guestSessionId: string): HeadersInit {
  return {
    [CHAT_SESSION_HEADER]: guestSessionId,
  }
}

export function chatSessionQuery(guestSessionId: string): string {
  return `guestSession=${encodeURIComponent(guestSessionId)}`
}

export function getStoredConversationId(): number | null {
  if (typeof window === 'undefined') return null

  const raw = window.localStorage.getItem(CHAT_ACTIVE_CONVERSATION_KEY)
  if (!raw || !/^\d+$/.test(raw)) return null

  const id = Number(raw)
  return id > 0 ? id : null
}

export function setStoredConversationId(conversationId: number): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(CHAT_ACTIVE_CONVERSATION_KEY, String(conversationId))
}

export function clearStoredConversationId(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(CHAT_ACTIVE_CONVERSATION_KEY)
}
