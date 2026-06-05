const STORAGE_KEY = 'analytics_session_id'

export function getAnalyticsSessionId(): string {
  if (typeof window === 'undefined') {
    return ''
  }

  try {
    const existing = localStorage.getItem(STORAGE_KEY)
    if (existing) return existing

    const created =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto ?
        crypto.randomUUID()
      : `sess-${Date.now()}-${Math.random().toString(36).slice(2)}`

    localStorage.setItem(STORAGE_KEY, created)
    return created
  } catch {
    return ''
  }
}
