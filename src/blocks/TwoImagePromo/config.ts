import type { Block } from 'payload'

export const TwoImagePromo: Block = {
  slug: 'twoImagePromo',
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'leftImage',
          type: 'upload',
          relationTo: 'media',
          admin: {
            description: 'Left promotional tile (e.g. desktop: left half of the row).',
          },
          label: 'Left image',
          required: true,
        },
        {
          name: 'rightImage',
          type: 'upload',
          relationTo: 'media',
          admin: {
            description: 'Right promotional tile.',
          },
          label: 'Right image',
          required: true,
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'leftLink',
          type: 'text',
          admin: {
            placeholder: '/category/example',
          },
          label: 'Left link',
          required: true,
        },
        {
          name: 'rightLink',
          type: 'text',
          admin: {
            placeholder: '/category/example',
          },
          label: 'Right link',
          required: true,
        },
      ],
    },
  ],
  interfaceName: 'TwoImagePromoBlock',
  labels: {
    plural: 'Two Image Promos',
    singular: 'Two Image Promo',
  },
}
