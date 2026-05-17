import type { Block } from 'payload'

export const CampaignBannerStrip: Block = {
  slug: 'campaignBannerStrip',
  interfaceName: 'CampaignBannerStripBlock',
  labels: {
    plural: 'Campaign banner strips',
    singular: 'Campaign banner strip',
  },
  fields: [
    {
      name: 'message',
      type: 'text',
      required: true,
      label: 'Message',
    },
    {
      name: 'highlight',
      type: 'text',
      admin: {
        description: 'Shown in accent color within the message row (e.g. "30% off").',
        placeholder: '30% off everything',
      },
      label: 'Highlight text',
    },
    {
      type: 'row',
      fields: [
        {
          name: 'ctaLabel',
          type: 'text',
          defaultValue: 'Shop now',
          label: 'Button label',
          required: true,
        },
        {
          name: 'ctaUrl',
          type: 'text',
          admin: { placeholder: '/sale' },
          label: 'Button URL',
          required: true,
        },
      ],
    },
    {
      name: 'style',
      type: 'select',
      defaultValue: 'gradient',
      label: 'Style',
      options: [
        { label: 'Gradient', value: 'gradient' },
        { label: 'Bold solid', value: 'bold' },
        { label: 'Subtle', value: 'subtle' },
      ],
    },
  ],
}
