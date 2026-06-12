import {
  checkPromoCodeForAi,
  explainCheckoutStepForAi,
  getLoyaltyBalanceForAi,
  getShippingQuoteForAi,
  type AiShoppingToolContext,
} from '@/lib/ai/checkoutTools'
import { listActivePromoCodesForAi } from '@/lib/ai/promoCodes'
import { searchKnowledgeBaseForAi } from '@/lib/ai/rag/searchKnowledgeBase'
import { fetchRecommendationsForAi } from '@/lib/ai/recommendations'
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
  context?: AiShoppingToolContext
  payload: Payload
  rawArguments: string
  toolName: string
}): Promise<string> {
  let parsed: Record<string, unknown> = {}

  try {
    parsed = JSON.parse(args.rawArguments) as Record<string, unknown>
  } catch {
    return JSON.stringify({ error: 'Invalid tool arguments JSON.' })
  }

  const context = args.context ?? {}

  if (args.toolName === 'searchProducts') {
    const filters: ProductSearchFilters = {
      brand: typeof parsed.brand === 'string' ? parsed.brand : undefined,
      category: typeof parsed.category === 'string' ? parsed.category : undefined,
      color: typeof parsed.color === 'string' ? parsed.color : undefined,
      gender: typeof parsed.gender === 'string' ? parsed.gender : undefined,
      inStockOnly: typeof parsed.inStockOnly === 'boolean' ? parsed.inStockOnly : undefined,
      limit: typeof parsed.limit === 'number' ? parsed.limit : undefined,
      material: typeof parsed.material === 'string' ? parsed.material : undefined,
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

  if (args.toolName === 'getShippingQuote') {
    const cartId =
      typeof parsed.cartId === 'number' ? parsed.cartId
      : typeof context.cartId === 'number' ? context.cartId
      : undefined
    const district =
      typeof parsed.district === 'string' && parsed.district.trim() ?
        parsed.district.trim()
      : context.district?.trim()

    if (!cartId || !district) {
      return JSON.stringify({ error: 'cartId and district are required for shipping quote.' })
    }

    const result = await getShippingQuoteForAi({
      cartId,
      deliveryType: parsed.deliveryType === 'point' ? 'point' : 'home',
      district,
      payload: args.payload,
    })
    return JSON.stringify(result)
  }

  if (args.toolName === 'listActivePromoCodes') {
    const limit = typeof parsed.limit === 'number' ? parsed.limit : undefined
    const result = await listActivePromoCodesForAi(args.payload, {
      limit,
      userEmail: context.userEmail,
      userId: context.userId,
    })
    return JSON.stringify(result)
  }

  if (args.toolName === 'checkPromoCode') {
    const cartId =
      typeof parsed.cartId === 'number' ? parsed.cartId
      : typeof context.cartId === 'number' ? context.cartId
      : undefined
    const code = typeof parsed.code === 'string' ? parsed.code : ''

    if (!cartId) {
      return JSON.stringify({ error: 'cartId is required to validate a promo code.' })
    }

    const cart = await args.payload.findByID({
      collection: 'carts',
      depth: 2,
      id: cartId,
      overrideAccess: true,
    })

    if (!cart) return JSON.stringify({ error: 'Cart not found.' })

    const result = await checkPromoCodeForAi({
      cart,
      code,
      payload: args.payload,
      userEmail: context.userEmail,
      userId: context.userId,
    })
    return JSON.stringify(result)
  }

  if (args.toolName === 'getLoyaltyBalance') {
    const userId =
      typeof parsed.userId === 'number' ? parsed.userId
      : typeof context.userId === 'number' ? context.userId
      : undefined

    if (!userId) {
      return JSON.stringify({ error: 'userId is required for loyalty balance.' })
    }

    const result = await getLoyaltyBalanceForAi({ payload: args.payload, userId })
    return JSON.stringify(result)
  }

  if (args.toolName === 'explainCheckoutStep') {
    const step = typeof parsed.step === 'string' ? parsed.step : undefined
    return JSON.stringify(explainCheckoutStepForAi(step))
  }

  if (args.toolName === 'searchKnowledgeBase') {
    const query = typeof parsed.query === 'string' ? parsed.query : ''
    const limit = typeof parsed.limit === 'number' ? parsed.limit : undefined
    const result = await searchKnowledgeBaseForAi(args.payload, { limit, query })
    return JSON.stringify(result)
  }

  if (args.toolName === 'getRecommendations') {
    const contextType =
      parsed.context === 'homepage' || parsed.context === 'pdp' || parsed.context === 'cart' ?
        parsed.context
      : 'homepage'
    const productId = typeof parsed.productId === 'number' ? parsed.productId : undefined
    const userId =
      typeof parsed.userId === 'number' ? parsed.userId
      : typeof context.userId === 'number' ? context.userId
      : undefined
    const limit = typeof parsed.limit === 'number' ? parsed.limit : undefined

    const result = await fetchRecommendationsForAi(args.payload, {
      cartId: context.cartId,
      context: contextType,
      limit,
      productId,
      userId,
    })
    return JSON.stringify(result)
  }

  return JSON.stringify({ error: `Unknown tool: ${args.toolName}` })
}
