import type { AiProductResult } from '@/lib/ai/types'

export type ChatProductMessagePayload = {
  kind: 'product_results'
  products: AiProductResult[]
  text: string
}

export function encodeProductMessage(payload: ChatProductMessagePayload): string {
  return JSON.stringify(payload)
}

export function parseChatMessageBody(body: string): {
  products: AiProductResult[]
  text: string
} {
  try {
    const parsed = JSON.parse(body) as Partial<ChatProductMessagePayload>
    if (parsed.kind === 'product_results' && typeof parsed.text === 'string') {
      return {
        products: Array.isArray(parsed.products) ? parsed.products : [],
        text: parsed.text,
      }
    }
  } catch {
    //
  }

  return {
    products: [],
    text: body,
  }
}

function truncatePreview(text: string, maxLength: number): string {
  return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text
}

function stripMarkdownForPreview(text: string): string {
  return text
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

function previewFromTruncatedProductPayload(body: string, maxLength: number): string | null {
  const trimmed = body.trim()
  if (!trimmed.startsWith('{"kind":"product_results"')) {
    return null
  }

  const textMatch = /"text"\s*:\s*"((?:\\.|[^"\\])*)"/.exec(trimmed)
  if (textMatch?.[1]) {
    try {
      const unescaped = JSON.parse(`"${textMatch[1]}"`) as string
      if (unescaped.trim()) {
        return truncatePreview(stripMarkdownForPreview(unescaped), maxLength)
      }
    } catch {
      //
    }
  }

  if (/"products"\s*:\s*\[/.test(trimmed)) {
    return truncatePreview('Product recommendations', maxLength)
  }

  return truncatePreview('Product recommendations', maxLength)
}

export function chatMessagePreview(body: string, maxLength = 200): string {
  const parsed = parseChatMessageBody(body)
  if (parsed.products.length) {
    const count = parsed.products.length
    const productLabel = count === 1 ? 'product' : 'products'
    const intro =
      stripMarkdownForPreview(parsed.text.trim()) ||
      `Recommended ${count} ${productLabel}`
    return truncatePreview(intro, maxLength)
  }

  const truncatedProductPreview = previewFromTruncatedProductPayload(body, maxLength)
  if (truncatedProductPreview) {
    return truncatedProductPreview
  }

  const plain = stripMarkdownForPreview(body)
  return truncatePreview(plain, maxLength)
}

export function chatMessageInboxBody(body: string): string {
  const parsed = parseChatMessageBody(body)
  if (parsed.products.length) {
    return body
  }

  return chatMessagePreview(body, 500)
}

export function dedupeAiProducts(products: AiProductResult[]): AiProductResult[] {
  const seen = new Set<number>()
  const unique: AiProductResult[] = []

  for (const product of products) {
    if (seen.has(product.id)) continue
    seen.add(product.id)
    unique.push(product)
  }

  return unique
}
