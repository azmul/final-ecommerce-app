import type { Field } from 'payload'

/** GEO / AISO editorial fields for category and brand landing pages. */
export function taxonomyGeoContentFields(): Field {
  return {
    name: 'seoContent',
    type: 'group',
    label: 'AI & GEO content',
    admin: {
      description:
        'Editorial content for AI answer engines and category/brand landing pages (overview, buying guide, FAQs).',
    },
    fields: [
      {
        name: 'aiSummary',
        type: 'textarea',
        label: 'AI summary',
        admin: {
          description: '2–4 sentence factual summary for metadata and AI citations.',
        },
      },
      {
        name: 'overview',
        type: 'textarea',
        label: 'Category overview',
      },
      {
        name: 'buyingGuide',
        type: 'textarea',
        label: 'Buying guide',
        admin: {
          description: 'How to choose products in this category (materials, fit, price range).',
        },
      },
      {
        name: 'faqs',
        type: 'array',
        label: 'FAQs',
        fields: [
          { name: 'question', type: 'text', required: true },
          { name: 'answer', type: 'textarea', required: true },
        ],
      },
    ],
  }
}
