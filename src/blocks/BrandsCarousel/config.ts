import type { Block } from 'payload'

export const BrandsCarousel: Block = {
  slug: 'brandsCarousel',
  fields: [
    {
      name: 'heading',
      type: 'text',
      defaultValue: 'Our Brands',
      label: 'Section heading',
    },
    {
      name: 'brands',
      type: 'relationship',
      admin: {
        description:
          'Order is preserved in the carousel. Each brand should have a slug and logo for best results.',
        isSortable: true,
      },
      hasMany: true,
      label: 'Brands',
      minRows: 1,
      relationTo: 'brands',
      required: true,
    },
  ],
  interfaceName: 'BrandsCarouselBlock',
  labels: {
    plural: 'Brands Carousels',
    singular: 'Brands Carousel',
  },
}
