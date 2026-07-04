import { getServerSideURL } from '@/utilities/getURL'
import { NextResponse } from 'next/server'

export const revalidate = 3600
export const dynamic = 'force-static'

/**
 * Machine-readable OpenAPI 3.1 description of every /api/ai/* endpoint.
 *
 * Published so AI search engines, citation tools, and assistant agents can
 * discover the read-only product / category / brand / article surface area
 * without scraping HTML. Cached aggressively at the edge — the schema only
 * changes when this route is redeployed.
 */
export async function GET() {
  const siteUrl = getServerSideURL()

  const aiContentResponseRef = { $ref: '#/components/schemas/AiContentResponse' }

  const openapiDoc = {
    openapi: '3.1.0',
    info: {
      title: 'Ghorer Bazar AI Discovery API',
      version: '1.0.0',
      description:
        'Machine-readable endpoints for AI search engines, citation tools, and assistant agents to discover product, category, brand, and article content. Read-only; no authentication required for GET endpoints.',
      contact: {
        name: 'Ghorer Bazar',
        url: siteUrl,
      },
    },
    servers: [{ url: siteUrl }],
    paths: {
      '/api/ai': {
        get: {
          operationId: 'getAiDiscoveryIndex',
          summary: 'Discovery index of all machine-readable AI endpoints',
          description:
            'Returns a map of canonical URLs for the AI content endpoints, the Google Merchant feed, llms.txt, and the sitemap.',
          tags: ['discovery'],
          responses: {
            '200': {
              description: 'Discovery index.',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/DiscoveryIndex' },
                  example: {
                    endpoints: {
                      products: `${siteUrl}/api/ai/products/{slug}`,
                      categories: `${siteUrl}/api/ai/categories/{slug}`,
                      brands: `${siteUrl}/api/ai/brands/{slug}`,
                      articles: `${siteUrl}/api/ai/articles/{slug}`,
                      merchantFeed: `${siteUrl}/api/feeds/google-merchant`,
                      llmsTxt: `${siteUrl}/llms.txt`,
                      llmsFullTxt: `${siteUrl}/llms-full.txt`,
                      sitemap: `${siteUrl}/sitemap.xml`,
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/ai/products/{slug}': {
        get: {
          operationId: 'getAiProductContent',
          summary: 'AI-friendly product content by slug',
          description:
            'Returns a JSON-LD-flavoured summary of a published product, including key facts, FAQs, structured attributes, pricing, and availability.',
          tags: ['content'],
          parameters: [
            { $ref: '#/components/parameters/SlugParam' },
          ],
          responses: {
            '200': {
              description: 'Product content.',
              content: {
                'application/json': {
                  schema: aiContentResponseRef,
                  example: {
                    title: 'Organic Honey 500g',
                    summary: 'Raw, unpasteurised organic honey sourced from Sundarbans.',
                    keyFacts: ['Net weight: 500g', 'Origin: Bangladesh'],
                    faqs: [
                      { question: 'Is this raw honey?', answer: 'Yes, unpasteurised and unfiltered.' },
                    ],
                    structuredAttributes: { weight: '500g', origin: 'Bangladesh' },
                    pricing: { currency: 'BDT', price: 650 },
                    availability: 'in_stock',
                    relatedEntities: [],
                  },
                },
              },
            },
            '404': { $ref: '#/components/responses/NotFound' },
          },
        },
      },
      '/api/ai/categories/{slug}': {
        get: {
          operationId: 'getAiCategoryContent',
          summary: 'AI-friendly category content by slug',
          description: 'Returns a summary of a category, including its top products and FAQs.',
          tags: ['content'],
          parameters: [{ $ref: '#/components/parameters/SlugParam' }],
          responses: {
            '200': {
              description: 'Category content.',
              content: {
                'application/json': {
                  schema: aiContentResponseRef,
                },
              },
            },
            '404': { $ref: '#/components/responses/NotFound' },
          },
        },
      },
      '/api/ai/brands/{slug}': {
        get: {
          operationId: 'getAiBrandContent',
          summary: 'AI-friendly brand content by slug',
          description: 'Returns a summary of a brand, including its featured products and FAQs.',
          tags: ['content'],
          parameters: [{ $ref: '#/components/parameters/SlugParam' }],
          responses: {
            '200': {
              description: 'Brand content.',
              content: {
                'application/json': {
                  schema: aiContentResponseRef,
                },
              },
            },
            '404': { $ref: '#/components/responses/NotFound' },
          },
        },
      },
      '/api/ai/articles/{slug}': {
        get: {
          operationId: 'getAiArticleContent',
          summary: 'AI-friendly article content by slug',
          description:
            'Returns a JSON-LD-flavoured summary of a published article, including key facts and related products.',
          tags: ['content'],
          parameters: [{ $ref: '#/components/parameters/SlugParam' }],
          responses: {
            '200': {
              description: 'Article content.',
              content: {
                'application/json': {
                  schema: aiContentResponseRef,
                },
              },
            },
            '404': { $ref: '#/components/responses/NotFound' },
          },
        },
      },
      '/api/ai/search-products': {
        post: {
          operationId: 'searchProductsForAi',
          summary: 'Structured product search for AI agents',
          description:
            'Filters published products by attributes such as price range, brand, category, and free-text query. Returns lightweight snapshots suitable for agent tool calls.',
          tags: ['search'],
          requestBody: {
            required: false,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    q: { type: 'string', description: 'Free-text search query.' },
                    limit: { type: 'integer', minimum: 1, maximum: 50, default: 12 },
                    brand: { type: 'string' },
                    category: { type: 'string' },
                    minPrice: { type: 'number', minimum: 0 },
                    maxPrice: { type: 'number', minimum: 0 },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Search results.',
              content: { 'application/json': { schema: { type: 'object' } } },
            },
            '400': { $ref: '#/components/responses/BadRequest' },
            '500': { $ref: '#/components/responses/ServerError' },
          },
        },
      },
      '/api/ai/compare': {
        post: {
          operationId: 'compareProducts',
          summary: 'LLM-generated comparison of 2–3 products',
          description:
            'Accepts an array of 2–3 product ids and an optional user question, then returns a structured comparison plus product snapshots.',
          tags: ['agent'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['ids'],
                  properties: {
                    ids: {
                      type: 'array',
                      minItems: 2,
                      maxItems: 3,
                      items: { type: 'integer', minimum: 1 },
                    },
                    question: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Comparison result.',
              content: { 'application/json': { schema: { type: 'object' } } },
            },
            '400': { $ref: '#/components/responses/BadRequest' },
            '404': { $ref: '#/components/responses/NotFound' },
            '503': { $ref: '#/components/responses/ServiceUnavailable' },
          },
        },
      },
      '/api/ai/semantic-search': {
        post: {
          operationId: 'semanticSearchForAi',
          summary: 'Vector / semantic search over published products',
          tags: ['search'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['query'],
                  properties: {
                    query: { type: 'string', maxLength: 4000 },
                    limit: { type: 'integer', minimum: 1, maximum: 50 },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Semantic search results.',
              content: { 'application/json': { schema: { type: 'object' } } },
            },
            '400': { $ref: '#/components/responses/BadRequest' },
            '413': { $ref: '#/components/responses/PayloadTooLarge' },
            '500': { $ref: '#/components/responses/ServerError' },
          },
        },
      },
      '/api/ai/assistant': {
        post: {
          operationId: 'runShoppingAssistant',
          summary: 'Conversational shopping assistant',
          description:
            'Runs the multi-turn AI shopping assistant. Accepts the latest user message plus optional sanitised history and shopping context (cart, locale, etc.).',
          tags: ['agent'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['message'],
                  properties: {
                    message: { type: 'string' },
                    history: {
                      type: 'array',
                      items: {
                        type: 'object',
                        required: ['role', 'content'],
                        properties: {
                          role: { type: 'string', enum: ['user', 'assistant', 'system'] },
                          content: { type: 'string' },
                        },
                      },
                    },
                    context: { type: 'object', additionalProperties: true },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Assistant reply.',
              content: { 'application/json': { schema: { type: 'object' } } },
            },
            '400': { $ref: '#/components/responses/BadRequest' },
            '413': { $ref: '#/components/responses/PayloadTooLarge' },
            '500': { $ref: '#/components/responses/ServerError' },
            '503': { $ref: '#/components/responses/ServiceUnavailable' },
            '504': { $ref: '#/components/responses/Timeout' },
          },
        },
      },
      '/api/ai/visual-search': {
        post: {
          operationId: 'visualSearchProducts',
          summary: 'Image-driven product search',
          description:
            'Accepts a multipart form with an `image` file (≤ 4 MB) and an optional `description` text hint, returning matching products.',
          tags: ['search'],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['image'],
                  properties: {
                    image: { type: 'string', format: 'binary' },
                    description: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Visual search results.',
              content: { 'application/json': { schema: { type: 'object' } } },
            },
            '400': { $ref: '#/components/responses/BadRequest' },
          },
        },
      },
      '/api/ai/knowledge-search': {
        post: {
          operationId: 'searchKnowledgeBaseForAi',
          summary: 'Retrieval over the storefront knowledge base',
          tags: ['search'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['query'],
                  properties: {
                    query: { type: 'string', maxLength: 4000 },
                    limit: { type: 'integer', minimum: 1, maximum: 50 },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Knowledge base matches.',
              content: { 'application/json': { schema: { type: 'object' } } },
            },
            '400': { $ref: '#/components/responses/BadRequest' },
            '413': { $ref: '#/components/responses/PayloadTooLarge' },
            '500': { $ref: '#/components/responses/ServerError' },
          },
        },
      },
    },
    components: {
      parameters: {
        SlugParam: {
          name: 'slug',
          in: 'path',
          required: true,
          description: 'URL-safe slug of the entity.',
          schema: { type: 'string' },
        },
      },
      responses: {
        BadRequest: {
          description: 'The request body or parameters were invalid.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
        NotFound: {
          description: 'The requested entity does not exist or is not published.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
        PayloadTooLarge: {
          description: 'The submitted query or payload exceeded the allowed length.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
        ServerError: {
          description: 'An unexpected error occurred while handling the request.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
        ServiceUnavailable: {
          description: 'The downstream AI service is disabled or unavailable.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
        Timeout: {
          description: 'The AI service did not respond in time.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
      },
      schemas: {
        AiContentResponse: {
          type: 'object',
          description:
            'JSON-LD-flavoured summary of a single entity (product, category, brand, or article) optimised for AI ingestion.',
          properties: {
            title: { type: 'string' },
            summary: { type: 'string' },
            keyFacts: {
              type: 'array',
              items: { type: 'string' },
            },
            faqs: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  question: { type: 'string' },
                  answer: { type: 'string' },
                },
                required: ['question', 'answer'],
              },
            },
            structuredAttributes: {
              type: 'object',
              additionalProperties: true,
            },
            pricing: {
              type: 'object',
              additionalProperties: true,
              properties: {
                currency: { type: 'string' },
                price: { type: 'number' },
              },
            },
            availability: { type: 'string' },
            relatedEntities: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: true,
              },
            },
          },
          required: ['title'],
        },
        DiscoveryIndex: {
          type: 'object',
          properties: {
            endpoints: {
              type: 'object',
              additionalProperties: { type: 'string', format: 'uri' },
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
          required: ['error'],
        },
      },
    },
  } as const

  return NextResponse.json(openapiDoc, {
    headers: {
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      'Content-Type': 'application/json; charset=utf-8',
    },
  })
}
