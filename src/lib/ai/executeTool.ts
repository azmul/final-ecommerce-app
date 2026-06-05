import { searchProductsForAi } from '@/lib/ai/searchProducts'
import { semanticSearchForAi } from '@/lib/ai/semanticSearch'
import type { ProductSearchFilters } from '@/lib/ai/types'
import { BDT } from '@/lib/ecommerceCurrency'
import type { Payload } from 'payload'

const PRICE_MINOR_FACTOR = 10 ** BDT.decimals

function toStoreMinorPrice(raw: unknown): number | undefined {
  if (typeof raw !== 'number' || !Number.isFinite(raw) || raw < 0) return undefined
  return Math.round(raw * PRICE_MINOR_FACTOR)
}

export async function executeAiShoppingTool(args: {
  payload: Payload
  toolName: string
  rawArguments: string
}): Promise<string> {
  let parsed: Record<string, unknown> = {}

  try {
    parsed = JSON.parse(args.rawArguments) as Record<string, unknown>
  } catch {
    return JSON.stringify({ error: 'Invalid tool arguments JSON.' })
  }

  if (args.toolName === 'searchProducts') {
    const filters: ProductSearchFilters = {
      brand: typeof parsed.brand === 'string' ? parsed.brand : undefined,
      category: typeof parsed.category === 'string' ? parsed.category : undefined,
      color: typeof parsed.color === 'string' ? parsed.color : undefined,
      gender: typeof parsed.gender === 'string' ? parsed.gender : undefined,
      inStockOnly: typeof parsed.inStockOnly === 'boolean' ? parsed.inStockOnly : undefined,
      limit: typeof parsed.limit === 'number' ? parsed.limit : undefined,
      material: typeof parsed.material === 'string' ? parsed.material : undefined,
      // LLM provides taka (major units); product pricing is stored in minor units.
      maxPrice: toStoreMinorPrice(parsed.maxPrice),
      minPrice: toStoreMinorPrice(parsed.minPrice),
      query: typeof parsed.query === 'string' ? parsed.query : undefined,
      size: typeof parsed.size === 'string' ? parsed.size : undefined,
    }

    const result = await searchProductsForAi(args.payload, filters)
    return JSON.stringify(result)
  }

  if (args.toolName === 'semanticSearch') {
    const query = typeof parsed.query === 'string' ? parsed.query : ''
    const limit = typeof parsed.limit === 'number' ? parsed.limit : undefined
    const result = await semanticSearchForAi(args.payload, { limit, query })
    return JSON.stringify(result)
  }

  return JSON.stringify({ error: `Unknown tool: ${args.toolName}` })
}
