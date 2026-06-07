/** Full plain-text extraction from Payload Lexical JSON (no truncation). */
export function extractLexicalPlainTextFull(data: unknown): string {
  const parts: string[] = []

  const walk = (node: unknown): void => {
    if (!node || typeof node !== 'object') return
    const row = node as Record<string, unknown>

    if (typeof row.text === 'string') {
      const text = row.text.trim()
      if (text) parts.push(text)
    }

    if (Array.isArray(row.children)) {
      for (const child of row.children) walk(child)
    }
  }

  if (data && typeof data === 'object' && data !== null && 'root' in data) {
    walk((data as { root: unknown }).root)
  } else {
    walk(data)
  }

  return parts.join(' ').replace(/\s+/g, ' ').trim()
}
