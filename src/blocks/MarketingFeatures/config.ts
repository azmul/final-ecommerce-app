import type { Block } from 'payload'

const iconOptions = [
  { label: 'Truck (Free shipping)', value: 'truck' },
  { label: 'Shield (Guarantee)', value: 'shield' },
  { label: 'Sparkles (New)', value: 'sparkles' },
  { label: 'Percent (Discount)', value: 'percent' },
  { label: 'Gift', value: 'gift' },
  { label: 'Headphones (Support)', value: 'headphones' },
  { label: 'Star (Quality)', value: 'star' },
  { label: 'Zap (Fast)', value: 'zap' },
] as const

export const MarketingFeatures: Block = {
  slug: 'marketingFeatures',
  interfaceName: 'MarketingFeaturesBlock',
  labels: {
    plural: 'Marketing features',
    singular: 'Marketing features',
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
      admin: { placeholder: 'Why shop with us' },
      label: 'Section heading',
    },
    {
      name: 'subheading',
      type: 'textarea',
      label: 'Subheading',
    },
    {
      name: 'columns',
      type: 'select',
      defaultValue: '3',
      label: 'Columns',
      options: [
        { label: '2 columns', value: '2' },
        { label: '3 columns', value: '3' },
        { label: '4 columns', value: '4' },
      ],
    },
    {
      name: 'items',
      type: 'array',
      minRows: 1,
      maxRows: 4,
      labels: { plural: 'Features', singular: 'Feature' },
      fields: [
        {
          name: 'icon',
          type: 'select',
          defaultValue: 'sparkles',
          label: 'Icon',
          options: [...iconOptions],
          required: true,
        },
        {
          name: 'title',
          type: 'text',
          required: true,
          label: 'Title',
        },
        {
          name: 'description',
          type: 'textarea',
          required: true,
          label: 'Description',
        },
        {
          name: 'linkUrl',
          type: 'text',
          admin: { placeholder: '/shipping' },
          label: 'Link URL (optional)',
        },
        {
          name: 'linkLabel',
          type: 'text',
          admin: { placeholder: 'Learn more' },
          label: 'Link label',
        },
      ],
    },
  ],
}
