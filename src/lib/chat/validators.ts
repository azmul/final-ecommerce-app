import { MAX_MESSAGE_LENGTH } from '@/lib/chat/constants'

const GUEST_SESSION_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function sanitizeMessageBody(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  if (!trimmed) return null
  if (trimmed.length > MAX_MESSAGE_LENGTH) return null
  return trimmed
}

export function isValidGuestSessionId(value: unknown): value is string {
  return typeof value === 'string' && GUEST_SESSION_RE.test(value)
}

export function parsePositiveInt(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value
  if (typeof value === 'string' && /^\d+$/.test(value)) {
    const n = Number(value)
    return n > 0 ? n : null
  }
  return null
}
