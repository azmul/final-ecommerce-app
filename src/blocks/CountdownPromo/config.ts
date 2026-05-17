import type { Block } from 'payload'

export const CountdownPromo: Block = {
  slug: 'countdownPromo',
  interfaceName: 'CountdownPromoBlock',
  labels: {
    plural: 'Countdown promos',
    singular: 'Countdown promo',
  },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      admin: { placeholder: 'Ends soon' },
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
      name: 'endDate',
      type: 'date',
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
        description: 'Countdown stops at this date and time.',
      },
      label: 'Sale end date',
      required: true,
    },
    {
      name: 'promoCode',
      type: 'text',
      admin: { placeholder: 'SUMMER25' },
      label: 'Promo code (optional)',
    },
    {
      type: 'row',
      fields: [
        {
          name: 'ctaLabel',
          type: 'text',
          defaultValue: 'Shop the sale',
          label: 'Button label',
          required: true,
        },
        {
          name: 'ctaUrl',
          type: 'text',
          admin: { placeholder: '/shop/sale' },
          label: 'Button URL',
          required: true,
        },
      ],
    },
    {
      name: 'theme',
      type: 'select',
      defaultValue: 'primary',
      label: 'Color theme',
      options: [
        { label: 'Brand primary', value: 'primary' },
        { label: 'Dark', value: 'dark' },
        { label: 'Vibrant gradient', value: 'vibrant' },
      ],
    },
  ],
}
