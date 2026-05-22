import type { Block } from 'payload'

export const Faq: Block = {
  slug: 'faq',
  interfaceName: 'FaqBlock',
  labels: {
    plural: 'FAQ sections',
    singular: 'FAQ section',
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
      admin: { placeholder: 'Frequently asked questions' },
      label: 'Section heading',
    },
    {
      name: 'subheading',
      type: 'textarea',
      label: 'Subheading',
    },
    {
      name: 'items',
      type: 'array',
      minRows: 1,
      labels: { plural: 'Questions', singular: 'Question' },
      fields: [
        {
          name: 'question',
          type: 'text',
          required: true,
          label: 'Question',
        },
        {
          name: 'answer',
          type: 'textarea',
          required: true,
          label: 'Answer',
        },
      ],
    },
  ],
}
