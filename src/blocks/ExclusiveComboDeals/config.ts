import type { Block } from 'payload'

export const ExclusiveComboDeals: Block = {
  slug: 'exclusiveComboDeals',
  fields: [
    {
      name: 'heading',
      type: 'text',
      defaultValue: 'Exclusive Combo Deals',
      label: 'Section title',
      required: true,
    },
    {
      name: 'viewAllUrl',
      type: 'text',
      admin: {
        description:
          'Link for “View All Combos” (e.g. /products?tag=combos). Leave empty to hide the button.',
        placeholder: '/products',
      },
      label: 'View all link',
    },
    {
      name: 'products',
      type: 'relationship',
      admin: {
        description:
          'Pick combo products in carousel order. Discount percentage drives the green “Save” badge.',
        isSortable: true,
      },
      hasMany: true,
      label: 'Combo products',
      maxRows: 24,
      minRows: 1,
      relationTo: 'products',
      required: true,
    },
  ],
  interfaceName: 'ExclusiveComboDealsBlock',
  labels: {
    plural: 'Exclusive Combo Deals',
    singular: 'Exclusive Combo Deals',
  },
}
