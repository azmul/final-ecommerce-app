import type { Block } from 'payload'

export const TopSellingProducts: Block = {
  slug: 'topSellingProducts',
  fields: [
    {
      name: 'heading',
      type: 'text',
      defaultValue: 'Top Selling Products',
      label: 'Section heading',
    },
    {
      name: 'products',
      type: 'relationship',
      admin: {
        description:
          'Pick products in display order (e.g. up to four in a two-column grid). Use Product Badge in each product’s admin for the ribbon text.',
        isSortable: true,
      },
      hasMany: true,
      label: 'Products',
      maxRows: 12,
      minRows: 1,
      relationTo: 'products',
      required: true,
    },
  ],
  interfaceName: 'TopSellingProductsBlock',
  labels: {
    plural: 'Top Selling Products Sections',
    singular: 'Top Selling Products',
  },
}
