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
]
