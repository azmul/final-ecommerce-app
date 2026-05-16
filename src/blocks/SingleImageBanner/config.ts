import type { Block } from 'payload'

export const SingleImageBanner: Block = {
  slug: 'singleImageBanner',
  fields: [
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description:
          'Wide banner image (recommended ~1600×400px or similar). Text baked into the image is fine.',
      },
      label: 'Banner image',
      required: true,
    },
    {
      name: 'link',
      type: 'text',
      admin: {
        description: 'Optional destination when the banner is clicked (e.g. /products or a category URL).',
        placeholder: '/products',
      },
      label: 'Link',
    },
  ],
  interfaceName: 'SingleImageBannerBlock',
  labels: {
    plural: 'Single Image Banners',
    singular: 'Single Image Banner',
  },
}
