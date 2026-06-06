import { callDeepSeekChat } from '@/lib/ai/deepseek'
import { isAiShoppingAssistantEnabled } from '@/lib/ai/config'
import { extractLexicalPlainText } from '@/utilities/extractLexicalPlainText'
import type { Product, Variant } from '@/payload-types'

export type CompareProductSnapshot = {
  availability: string
  brand: string | null
  categories: string[]
  id: number
  priceLabel: string
  slug: string
  specs: { label: string; value: string }[]
  summary: string | null
  title: string
}

export type CompareAiResult = {
  recommendation: string
  tradeoffs: string[]
  valueWinnerId: number | null
  valueWinnerTitle: string | null
  winnerId: number | null
  winnerTitle: string | null
}

export function buildCompareProductSnapshot(product: Product): CompareProductSnapshot {
  const brand =
    product.brand && typeof product.brand === 'object' && product.brand.title ?
      product.brand.title
    : null

  const categories =
    product.categories
      ?.map((c) => (typeof c === 'object' && c?.title ? c.title : ''))
      .filter(Boolean) ?? []

  const specs =
    product.technicalSpecs
      ?.map((s) => ({
        label: typeof s.label === 'string' ? s.label.trim() : '',
        value: typeof s.value === 'string' ? s.value.trim() : '',
      }))
      .filter((s) => s.label && s.value) ?? []

  const hasVariants = product.enableVariants && Boolean(product.variants?.docs?.length)
  let priceLabel = '—'
  if (hasVariants) {
    const prices = (product.variants?.docs ?? [])
      .filter((v): v is Variant => typeof v === 'object' && v !== null)
      .map((v) => v.priceInBDT)
      .filter((n): n is number => typeof n === 'number')
    if (prices.length) {
      const low = Math.min(...prices)
      const high = Math.max(...prices)
      priceLabel = low === high ? `${low} BDT` : `${low}–${high} BDT`
    }
  } else if (typeof product.priceInBDT === 'number') {
    priceLabel = `${product.priceInBDT} BDT`
  }

  const inStock =
    hasVariants ?
      (product.variants?.docs ?? []).some(
        (v) => typeof v === 'object' && v !== null && (v.inventory ?? 0) > 0,
      )
    : (product.inventory ?? 0) > 0

  return {
    availability: inStock ? 'In stock' : 'Out of stock',
    brand,
    categories,
    id: product.id,
    priceLabel,
    slug: product.slug ?? '',
    specs,
    summary:
      product.meta?.description?.trim() ||
      extractLexicalPlainText(product.description, 280) ||
      null,
    title: product.title ?? 'Product',
  }
}

function parseCompareResult(raw: string, products: CompareProductSnapshot[]): CompareAiResult | null {
  try {
    const parsed = JSON.parse(raw) as Partial<CompareAiResult>
    const winnerId = typeof parsed.winnerId === 'number' ? parsed.winnerId : null
    const valueWinnerId = typeof parsed.valueWinnerId === 'number' ? parsed.valueWinnerId : null
    const winner = products.find((p) => p.id === winnerId)
    const valueWinner = products.find((p) => p.id === valueWinnerId)

    return {
      recommendation: typeof parsed.recommendation === 'string' ? parsed.recommendation.trim() : '',
      tradeoffs: Array.isArray(parsed.tradeoffs)
        ? parsed.tradeoffs.filter((x): x is string => typeof x === 'string')
        : [],
      valueWinnerId,
      valueWinnerTitle: valueWinner?.title ?? null,
      winnerId,
      winnerTitle: winner?.title ?? null,
    }
  } catch {
    return null
  }
}

export async function generateProductComparison(args: {
  products: CompareProductSnapshot[]
  userQuestion?: string
}): Promise<CompareAiResult | null> {
  if (!isAiShoppingAssistantEnabled() || args.products.length < 2) return null

  const catalog = args.products
    .map(
      (p) =>
        `ID ${p.id}: ${p.title}\nBrand: ${p.brand ?? '—'}\nPrice: ${p.priceLabel}\nAvailability: ${p.availability}\nCategories: ${p.categories.join(', ') || '—'}\nSummary: ${p.summary ?? '—'}\nSpecs: ${p.specs.map((s) => `${s.label}=${s.value}`).join('; ') || '—'}`,
    )
    .join('\n\n')

  const completion = await callDeepSeekChat({
    messages: [
      {
        role: 'system',
        content: `Compare ecommerce products objectively. Respond with ONLY JSON:
{
  "recommendation": "2-4 sentences answering the shopper",
  "winnerId": number or null,
  "valueWinnerId": number or null,
  "tradeoffs": ["string", ...]
}
Use only the product data provided. winnerId = best overall match; valueWinnerId = best value for money.`,
      },
      {
        role: 'user',
        content: `${args.userQuestion?.trim() ? `Question: ${args.userQuestion.trim()}\n\n` : ''}Products:\n${catalog}`,
      },
    ],
    tools: false,
  })

  const raw = completion.choices?.[0]?.message?.content?.trim()
  if (!raw) return null

  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  return parseCompareResult(jsonMatch?.[0] ?? raw, args.products)
}
