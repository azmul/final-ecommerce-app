import type { Block } from 'payload'

export const CampaignHero: Block = {
  slug: 'campaignHero',
  interfaceName: 'CampaignHeroBlock',
  labels: {
    plural: 'Campaign heroes',
    singular: 'Campaign hero',
  },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      admin: {
        description: 'Small label above the headline (e.g. "Limited time", "New season").',
        placeholder: 'Summer campaign',
      },
      label: 'Eyebrow',
    },
    {
      name: 'headline',
      type: 'text',
      required: true,
      label: 'Headline',
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Description',
    },
    {
      name: 'backgroundImage',
      type: 'upload',
      relationTo: 'media',
      required: true,
      label: 'Background image',
    },
    {
      type: 'row',
      fields: [
        {
          name: 'overlay',
          type: 'select',
          defaultValue: 'gradient',
          label: 'Overlay',
          options: [
            { label: 'Soft gradient', value: 'gradient' },
            { label: 'Dark', value: 'dark' },
            { label: 'Light', value: 'light' },
          ],
        },
        {
          name: 'alignment',
          type: 'select',
          defaultValue: 'left',
          label: 'Text alignment',
          options: [
            { label: 'Left', value: 'left' },
            { label: 'Center', value: 'center' },
          ],
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'primaryLabel',
          type: 'text',
          label: 'Primary button label',
          required: true,
        },
        {
          name: 'primaryUrl',
          type: 'text',
          admin: { placeholder: '/shop/sale' },
          label: 'Primary button URL',
          required: true,
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'secondaryLabel',
          type: 'text',
          label: 'Secondary button label',
        },
        {
          name: 'secondaryUrl',
          type: 'text',
          admin: { placeholder: '/about' },
          label: 'Secondary button URL',
        },
      ],
    },
  ],
}
