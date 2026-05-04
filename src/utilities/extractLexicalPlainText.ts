/** Pull readable text from Payload Lexical `description` JSON for previews (e.g. compare table). */
export function extractLexicalPlainText(data: unknown, maxLength = 320): string | null {
  const parts: string[] = []

  const walk = (node: unknown): void => {
    if (!node || typeof node !== 'object') return
    const n = node as Record<string, unknown>
    if (typeof n.text === 'string') {
      const t = n.text.trim()
      if (t) parts.push(t)
    }
    const children = n.children
    if (Array.isArray(children)) {
      for (const child of children) walk(child)
    }
  }

  if (data && typeof data === 'object' && data !== null && 'root' in data) {
    walk((data as { root: unknown }).root)
  } else {
    walk(data)
  }

  const joined = parts.join(' ').replace(/\s+/g, ' ').trim()
  if (!joined) return null
  return joined.length <= maxLength ? joined : `${joined.slice(0, Math.max(0, maxLength - 1)).trim()}…`
}
