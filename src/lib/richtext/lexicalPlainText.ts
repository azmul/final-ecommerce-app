import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

type LexicalNode = {
  children?: LexicalNode[]
  text?: string
  type?: string
}

/** First paragraph of plain text from Lexical rich text (for teasers and previews). */
export function lexicalPlainText(
  data: SerializedEditorState | null | undefined,
  maxLength = 280,
): string | null {
  if (!data?.root) return null

  const parts: string[] = []

  function walk(node: LexicalNode) {
    if (typeof node.text === 'string' && node.text.trim()) {
      parts.push(node.text.trim())
    }
    node.children?.forEach(walk)
  }

  walk(data.root as LexicalNode)

  const text = parts.join(' ').replace(/\s+/g, ' ').trim()
  if (!text) return null

  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength).trimEnd()}…`
}
