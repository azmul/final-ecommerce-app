import type { Block } from 'payload'

export const Testimonials: Block = {
  slug: 'testimonials',
  fields: [
    {
      name: 'items',
      type: 'array',
      admin: {
        initCollapsed: true,
        isSortable: true,
      },
      fields: [
        {
          name: 'quote',
          type: 'textarea',
          label: 'Feedback',
          required: true,
        },
        {
          name: 'photo',
          type: 'upload',
          relationTo: 'media',
          label: 'Profile photo',
          required: true,
        },
        {
          name: 'name',
          type: 'text',
          label: 'Name',
          required: true,
        },
        {
          name: 'role',
          type: 'text',
          admin: {
            description: 'e.g. Entrepreneur, Student',
          },
          label: 'Title / role',
        },
      ],
      labels: {
        plural: 'Testimonials',
        singular: 'Testimonial',
      },
      maxRows: 24,
      minRows: 1,
      required: true,
    },
  ],
  interfaceName: 'TestimonialsBlock',
  labels: {
    plural: 'Testimonials',
    singular: 'Testimonials',
  },
}
