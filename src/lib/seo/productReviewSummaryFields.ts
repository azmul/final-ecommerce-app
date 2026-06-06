import type { Field } from 'payload'

export function productReviewSummaryFields(): Field {
  return {
    name: 'reviewSummary',
    type: 'group',
    label: 'AI review summary',
    admin: {
      description:
        'Auto-generated summary of approved customer reviews. Regenerated when reviews change.',
      readOnly: true,
    },
    fields: [
      {
        name: 'text',
        type: 'textarea',
        label: 'Summary',
      },
      {
        name: 'sentiment',
        type: 'number',
        admin: { description: 'Sentiment score from -1 (negative) to 1 (positive).' },
        max: 1,
        min: -1,
      },
      {
        name: 'pros',
        type: 'array',
        fields: [{ name: 'item', type: 'text', required: true }],
        labels: { plural: 'Pros', singular: 'Pro' },
      },
      {
        name: 'cons',
        type: 'array',
        fields: [{ name: 'item', type: 'text', required: true }],
        labels: { plural: 'Cons', singular: 'Con' },
      },
      {
        name: 'commonComplaints',
        type: 'array',
        fields: [{ name: 'item', type: 'text', required: true }],
        labels: { plural: 'Common complaints', singular: 'Complaint' },
      },
      {
        name: 'generatedAt',
        type: 'date',
        admin: { readOnly: true },
      },
      {
        name: 'reviewCountAtGeneration',
        type: 'number',
        admin: { readOnly: true },
        label: 'Review count at generation',
      },
    ],
  }
}
