import type { Block } from 'payload'

export const CategoryProductShowcase: Block = {
  slug: 'categoryProductShowcase',
  interfaceName: 'CategoryProductShowcaseBlock',
  labels: {
    plural: 'Category Product Showcases',
    singular: 'Category Product Showcase',
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
      admin: {
        description: 'Optional title above the category tabs.',
      },
      label: 'Section heading',
    },
    {
      name: 'showForYouTab',
      type: 'checkbox',
      defaultValue: true,
      label: 'Show “For You” tab',
      admin: {
        description:
          'When enabled, the first tab shows products from any of the selected categories below.',
      },
    },
    {
      name: 'forYouLabel',
      type: 'text',
      defaultValue: 'For You',
      label: '“For You” tab label',
      admin: {
        condition: (_, siblingData) => Boolean(siblingData?.showForYouTab),
      },
    },
    {
      name: 'categories',
      type: 'relationship',
      admin: {
        description:
          'Tabs appear in this order. Each tab loads published products for that category with infinite scroll.',
        isSortable: true,
      },
      hasMany: true,
      label: 'Categories',
      minRows: 1,
      relationTo: 'categories',
      required: true,
    },
    {
      name: 'productsPerPage',
      type: 'number',
      defaultValue: 18,
      label: 'Products per page',
      max: 48,
      min: 6,
      admin: {
        description: 'Number of products loaded per request (initial load and each scroll batch).',
        step: 6,
      },
    },
    {
      name: 'sortBy',
      type: 'select',
      defaultValue: '-updatedAt',
      label: 'Product sort order',
      options: [
        { label: 'Recently updated', value: '-updatedAt' },
        { label: 'Newest first', value: '-createdAt' },
        { label: 'Title (A–Z)', value: 'title' },
      ],
    },
  ],
}
