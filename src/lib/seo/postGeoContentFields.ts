import type { Field } from 'payload'

/** GEO / AISO fields for blog posts and buying guides. */
export function postGeoContentFields(): Field {
  return {
    name: 'seoContent',
    type: 'group',
    label: 'AI & GEO content',
    admin: {
      description: 'Summaries and FAQs for AI answer engines and rich results.',
    },
    fields: [
      {
        name: 'aiSummary',
        type: 'textarea',
        label: 'AI summary',
        admin: {
          description: 'Executive summary (2–4 sentences) shown at top of article for scanners.',
        },
      },
      {
        name: 'keyTakeaways',
        type: 'array',
        label: 'Key takeaways',
        fields: [{ name: 'point', type: 'text', required: true }],
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
