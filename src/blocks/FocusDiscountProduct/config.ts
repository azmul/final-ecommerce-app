import type { Block } from 'payload'

export const FocusDiscountProduct: Block = {
  slug: 'focusDiscountProduct',
  interfaceName: 'FocusDiscountProductBlock',
  labels: {
    plural: 'Focus Discount Products',
    singular: 'Focus Discount Product',
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
      admin: {
        description: 'Optional title above the carousel. Leave empty to match the design (no heading).',
      },
      label: 'Section heading',
    },
    {
      name: 'items',
      type: 'array',
      admin: {
        description:
          'Each card shows a discount percentage, category label, and product image. Order is preserved in the carousel.',
        initCollapsed: true,
      },
      labels: { plural: 'Discount cards', singular: 'Discount card' },
      minRows: 1,
      maxRows: 24,
      fields: [
        {
          name: 'discountPercentage',
          type: 'number',
          admin: {
            description: 'Shown as a large percentage with “OFF” below (e.g. 15, 30).',
            step: 1,
          },
          label: 'Discount %',
          max: 100,
          min: 0,
          required: true,
        },
        {
          name: 'categoryLabel',
          type: 'text',
          admin: {
            placeholder: 'Trendy Women Flat & Sandals',
          },
          label: 'Category label',
          required: true,
        },
        {
          name: 'image',
          type: 'upload',
          label: 'Product image',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'linkUrl',
          type: 'text',
          admin: {
            placeholder: '/shop/women-footwear',
          },
          label: 'Link URL',
        },
      ],
    },
  ],
}
