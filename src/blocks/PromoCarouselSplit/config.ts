import type { Block } from 'payload'

export const PromoCarouselSplit: Block = {
  slug: 'promoCarouselSplit',
  interfaceName: 'PromoCarouselSplitBlock',
  labels: {
    plural: 'Promo carousel + banner',
    singular: 'Promo carousel + banner',
  },
  fields: [
    {
      name: 'slides',
      type: 'array',
      minRows: 1,
      labels: {
        plural: 'Slides',
        singular: 'Slide',
      },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
          label: 'Image',
        },
        {
          name: 'link',
          type: 'text',
          required: true,
          admin: {
            placeholder: '/category/example',
          },
          label: 'Link',
        },
      ],
      admin: {
        description: 'Left column: rotating slides. Each slide is clickable.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'rightImage',
          type: 'upload',
          relationTo: 'media',
          required: true,
          label: 'Right image',
          admin: {
            description: 'Static banner in the narrower right column.',
          },
        },
        {
          name: 'rightLink',
          type: 'text',
          required: true,
          label: 'Right link',
          admin: {
            placeholder: '/promo/example',
          },
        },
      ],
    },
  ],
}
