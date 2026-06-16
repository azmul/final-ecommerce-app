export function readMetaCookies(): { fbp?: string; fbc?: string } {
  if (typeof document === 'undefined') return {}

  const read = (name: string) => {
    const hit = document.cookie.split('; ').find((row) => row.startsWith(`${name}=`))
    return hit?.split('=').slice(1).join('=')
  }

  const fbp = read('_fbp')
  const fbc = read('_fbc')

  return {
    ...(fbp ? { fbp } : {}),
    ...(fbc ? { fbc } : {}),
  }
}

export function getMetaExternalId(): string {
  if (typeof window === 'undefined') return ''

  const key = 'analytics_client_id'

  try {
    let id = window.localStorage.getItem(key)
    if (!id) {
      id =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto ?
          crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`
      window.localStorage.setItem(key, id)
    }
    return id
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`
  }
}
