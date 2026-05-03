import type { Block } from 'payload'

export const ProductShowcase: Block = {
  slug: 'productShowcase',
  fields: [
    {
      name: 'heading',
      type: 'text',
      defaultValue: 'Featured products',
      label: 'Section title',
      required: true,
    },
    {
      name: 'viewAllUrl',
      type: 'text',
      admin: {
        description:
          'Link for “View all items” (e.g. /products or a full URL). Leave empty to hide the link.',
        placeholder: '/products',
      },
      label: 'View all link',
    },
    {
      name: 'products',
      type: 'relationship',
      admin: {
        description:
          'Drag rows to set carousel order. Badges use each product’s Product Badge and discount fields.',
        isSortable: true,
      },
      hasMany: true,
      label: 'Products',
      maxRows: 24,
      minRows: 1,
      relationTo: 'products',
      required: true,
    },
  ],
  interfaceName: 'ProductShowcaseBlock',
  labels: {
    plural: 'Product Showcases',
    singular: 'Product Showcase',
  },
}
