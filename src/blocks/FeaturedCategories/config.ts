import type { Block } from 'payload'

export const FeaturedCategories: Block = {
  slug: 'featuredCategories',
  fields: [
    {
      name: 'heading',
      type: 'text',
      defaultValue: 'Featured Categories',
      label: 'Section heading',
    },
    {
      name: 'categories',
      type: 'relationship',
      admin: {
        description: 'Order is preserved in the carousel. Each category needs an image for the best appearance.',
        isSortable: true,
      },
      hasMany: true,
      label: 'Categories',
      minRows: 1,
      relationTo: 'categories',
      required: true,
    },
  ],
  interfaceName: 'FeaturedCategoriesBlock',
  labels: {
    plural: 'Featured Categories',
    singular: 'Featured Categories',
  },
}
