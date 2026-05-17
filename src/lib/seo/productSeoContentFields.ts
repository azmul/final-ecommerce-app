import type { Field } from 'payload'

/** GEO / AISO content fields for product discoverability in AI search. */
export function productSeoContentFields(): Field {
  return {
    name: 'seoContent',
    type: 'group',
    label: 'AI & SEO content',
    admin: {
      description:
        'Structured content for search engines and AI assistants (summaries, FAQs, buying context).',
    },
    fields: [
      {
        name: 'aiSummary',
        type: 'textarea',
        label: 'AI summary',
        admin: {
          description:
            'Concise factual summary (2–4 sentences) for meta descriptions and AI citations. Mention category, material, and use case when relevant.',
        },
      },
      {
        name: 'keyFeatures',
        type: 'array',
        label: 'Key features',
        fields: [
          {
            name: 'feature',
            type: 'text',
            required: true,
          },
        ],
      },
      {
        name: 'whyChooseThis',
        type: 'textarea',
        label: 'Why choose this product?',
      },
      {
        name: 'usageInfo',
        type: 'textarea',
        label: 'Usage & care',
        admin: {
          description: 'When to wear, care instructions, sizing notes.',
        },
      },
      {
        name: 'shippingReturnsNote',
        type: 'textarea',
        label: 'Shipping & returns',
        admin: {
          description: 'Delivery regions, return window, exchange policy (shown on product page).',
        },
      },
      {
        name: 'faqs',
        type: 'array',
        label: 'FAQs',
        fields: [
          {
            name: 'question',
            type: 'text',
            required: true,
          },
          {
            name: 'answer',
            type: 'textarea',
            required: true,
          },
        ],
      },
    ],
  }
}
