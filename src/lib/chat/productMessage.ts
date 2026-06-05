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
