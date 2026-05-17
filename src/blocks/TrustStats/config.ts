import type { Block } from 'payload'

export const TrustStats: Block = {
  slug: 'trustStats',
  interfaceName: 'TrustStatsBlock',
  labels: {
    plural: 'Trust stats',
    singular: 'Trust stats',
  },
  fields: [
    {
      name: 'variant',
      type: 'select',
      defaultValue: 'gradient',
      label: 'Style',
      options: [
        { label: 'Gradient band', value: 'gradient' },
        { label: 'Bordered cards', value: 'bordered' },
        { label: 'Minimal', value: 'minimal' },
      ],
    },
    {
      name: 'items',
      type: 'array',
      minRows: 2,
      maxRows: 4,
      labels: { plural: 'Stats', singular: 'Stat' },
      fields: [
        {
          name: 'value',
          type: 'text',
          admin: { placeholder: '10K+' },
          label: 'Value',
          required: true,
        },
        {
          name: 'label',
          type: 'text',
          admin: { placeholder: 'Happy customers' },
          label: 'Label',
          required: true,
        },
      ],
    },
  ],
}
