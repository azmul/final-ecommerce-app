import { searchProductsForAi } from '@/lib/ai/searchProducts'
import { semanticSearchForAi } from '@/lib/ai/semanticSearch'
import type { ProductSearchFilters } from '@/lib/ai/types'
import type { Payload } from 'payload'

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
      maxPrice: typeof parsed.maxPrice === 'number' ? parsed.maxPrice : undefined,
      minPrice: typeof parsed.minPrice === 'number' ? parsed.minPrice : undefined,
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
