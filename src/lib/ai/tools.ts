export const AI_SHOPPING_TOOLS = [
  {
    function: {
      description:
        'Search products using structured filters such as name, category, brand, color, size, material, gender, price range, and stock availability. Use when the shopper gives concrete filters.',
      name: 'searchProducts',
      parameters: {
        additionalProperties: false,
        properties: {
          brand: { type: 'string' },
          category: { type: 'string' },
          color: { type: 'string' },
          gender: { type: 'string' },
          inStockOnly: { type: 'boolean' },
          limit: { type: 'number' },
          material: { type: 'string' },
          maxPrice: { type: 'number' },
          minPrice: { type: 'number' },
          query: { type: 'string' },
          size: { type: 'string' },
        },
        type: 'object',
      },
    },
    type: 'function' as const,
  },
  {
    function: {
      description:
        'Semantic product search for descriptive, subjective, or fuzzy shopping needs. Use when the shopper describes a use case instead of exact filters.',
      name: 'semanticSearch',
      parameters: {
        additionalProperties: false,
        properties: {
          limit: { type: 'number' },
          query: { type: 'string' },
        },
        required: ['query'],
        type: 'object',
      },
    },
    type: 'function' as const,
  },
  {
    function: {
      description:
        'Quote shipping cost for the current cart given a Bangladesh district and optional delivery type (home or point).',
      name: 'getShippingQuote',
      parameters: {
        additionalProperties: false,
        properties: {
          cartId: { type: 'number' },
          deliveryType: { enum: ['home', 'point'], type: 'string' },
          district: { type: 'string' },
        },
        required: ['district'],
        type: 'object',
      },
    },
    type: 'function' as const,
  },
  {
    function: {
      description:
        'List currently active public promo codes and deals. Use when shoppers ask about coupons, discounts, offers, or deals without naming a specific code.',
      name: 'listActivePromoCodes',
      parameters: {
        additionalProperties: false,
        properties: {
          limit: { type: 'number' },
        },
        type: 'object',
      },
    },
    type: 'function' as const,
  },
  {
    function: {
      description: 'Check whether a promo code is valid for the shopper cart and what discount it provides.',
      name: 'checkPromoCode',
      parameters: {
        additionalProperties: false,
        properties: {
          cartId: { type: 'number' },
          code: { type: 'string' },
        },
        required: ['code'],
        type: 'object',
      },
    },
    type: 'function' as const,
  },
  {
    function: {
      description: 'Return loyalty points balance for a signed-in customer.',
      name: 'getLoyaltyBalance',
      parameters: {
        additionalProperties: false,
        properties: {
          userId: { type: 'number' },
        },
        type: 'object',
      },
    },
    type: 'function' as const,
  },
  {
    function: {
      description:
        'Explain a checkout, shipping, payment, or returns step. Use when shoppers ask about checkout flow or policies.',
      name: 'explainCheckoutStep',
      parameters: {
        additionalProperties: false,
        properties: {
          step: { type: 'string' },
        },
        type: 'object',
      },
    },
    type: 'function' as const,
  },
  {
    function: {
      description:
        'Search the full public website knowledge base (pages, blog, products, categories, brands, navigation, policies, FAQs). Returns ranked snippets with title, sourceUrl, and score — use only those snippets in your answer.',
      name: 'searchKnowledgeBase',
      parameters: {
        additionalProperties: false,
        properties: {
          limit: { type: 'number' },
          query: { type: 'string' },
        },
        required: ['query'],
        type: 'object',
      },
    },
    type: 'function' as const,
  },
  {
    function: {
      description:
        'Get personalized product recommendations for homepage, product page, or cart context.',
      name: 'getRecommendations',
      parameters: {
        additionalProperties: false,
        properties: {
          context: { enum: ['homepage', 'pdp', 'cart'], type: 'string' },
          limit: { type: 'number' },
          productId: { type: 'number' },
          userId: { type: 'number' },
        },
        type: 'object',
      },
    },
    type: 'function' as const,
  },
]
