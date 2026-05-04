import type { CollectionConfig } from 'payload'

import { adminOnlyField } from '@/access/adminOnly'
import { adminOrRejectedReviewOwner } from '@/access/adminOrRejectedReviewOwner'
import { authenticated } from '@/access/authenticated'
import { commentOwnerOrAdmin } from '@/access/commentOwnerOrAdmin'
import { productReviewsPublicRead } from '@/access/productReviewsPublicRead'
import { checkRole } from '@/access/utilities'

import { prepareProductReviewDraft } from './hooks/prepareProductReviewDraft'
import { reopenRejectedReview } from './hooks/reopenRejectedReview'
import {
  revalidateProductReviewPaths,
  revalidateProductReviewPathsDelete,
} from './hooks/revalidateProductReviewPaths'
import { syncStatsAfterReviewChange, syncStatsAfterReviewDelete } from './hooks/syncStatsFromReviewChange'

export const ProductReviews: CollectionConfig = {
  slug: 'product-reviews',
  admin: {
    defaultColumns: ['moderationStatus', 'rating', 'product', 'author', 'createdAt'],
    description:
      'Customer ratings and written reviews. Shoppers only see approved reviews; authors see their own pending items.',
    group: 'Ecommerce',
    useAsTitle: 'id',
  },
  labels: {
    plural: 'Product Reviews',
    singular: 'Product Review',
  },
  access: {
    create: authenticated,
    delete: commentOwnerOrAdmin,
    read: productReviewsPublicRead,
    update: adminOrRejectedReviewOwner,
  },
  fields: [
    {
      name: 'product',
      type: 'relationship',
      index: true,
      relationTo: 'products',
      required: true,
    },
    {
      name: 'author',
      type: 'relationship',
      admin: {
        description: 'Set automatically when a customer submits a review.',
      },
      relationTo: 'users',
      required: true,
      access: {
        update: adminOnlyField,
      },
    },
    {
      name: 'reviewerDisplayName',
      type: 'text',
      access: {
        update: adminOnlyField,
      },
      admin: {
        description: 'Captured at submit time for the public product page.',
        readOnly: true,
      },
      label: 'Reviewer display name',
      required: true,
    },
    {
      name: 'rating',
      type: 'number',
      admin: {
        description: 'Whole stars from 1 (poor) to 5 (excellent).',
      },
      max: 5,
      min: 1,
      required: true,
      validate: (value) => {
        if (typeof value !== 'number' || !Number.isInteger(value)) {
          return 'Rating must be a whole number between 1 and 5.'
        }

        if (value < 1 || value > 5) {
          return 'Rating must be between 1 and 5.'
        }

        return true
      },
    },
    {
      name: 'title',
      type: 'text',
      admin: {
        description: 'Optional short headline (e.g. “Great for kids”).',
      },
      maxLength: 120,
    },
    {
      name: 'body',
      type: 'textarea',
      admin: {
        description: 'Share what you liked or what could be better.',
      },
      maxLength: 2000,
      minLength: 10,
      required: true,
    },
    {
      name: 'verifiedPurchase',
      type: 'checkbox',
      access: {
        create: adminOnlyField,
        update: adminOnlyField,
      },
      admin: {
        description: 'Automatically set when the reviewer completed an order that included this product.',
        position: 'sidebar',
        readOnly: true,
      },
      defaultValue: false,
      label: 'Verified purchase',
    },
    {
      name: 'moderationStatus',
      type: 'select',
      access: {
        create: ({ req }) => Boolean(req?.user && checkRole(['admin'], req.user)),
        update: adminOnlyField,
      },
      admin: {
        description: 'Only approved reviews appear to the public on the product page.',
        position: 'sidebar',
      },
      defaultValue: 'pending',
      options: [
        { label: 'Pending review', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
      ],
      required: true,
    },
    {
      name: 'moderatorNote',
      type: 'textarea',
      access: {
        create: adminOnlyField,
        read: adminOnlyField,
        update: adminOnlyField,
      },
      admin: {
        description: 'Internal note for staff (not shown on the storefront).',
        position: 'sidebar',
      },
      maxLength: 2000,
    },
  ],
  hooks: {
    afterChange: [syncStatsAfterReviewChange, revalidateProductReviewPaths],
    afterDelete: [syncStatsAfterReviewDelete, revalidateProductReviewPathsDelete],
    beforeChange: [reopenRejectedReview],
    beforeValidate: [prepareProductReviewDraft],
  },
  timestamps: true,
}
