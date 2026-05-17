import { staffCollectionAccess } from '@/lib/permissions/collectionAccess'
import { normalizePromoCode } from '@/lib/promoCodes/normalizeCode'
import type { CollectionConfig } from 'payload'

export const PromoCodes: CollectionConfig = {
  slug: 'promo-codes',
  admin: {
    group: 'Ecommerce',
    defaultColumns: [
      'code',
      'active',
      'discountType',
      'timesRedeemed',
      'validFrom',
      'validUntil',
      'updatedAt',
    ],
    useAsTitle: 'code',
    description: 'Checkout promo codes: percentage or fixed discounts with optional product and category rules.',
  },
  access: staffCollectionAccess('promo-codes'),
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data?.code && typeof data.code === 'string') {
          data.code = normalizePromoCode(data.code)
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'code',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Case-insensitive for shoppers; stored in uppercase.',
      },
    },
    {
      name: 'internalLabel',
      type: 'text',
      admin: {
        description: 'Optional note for staff (not shown to customers).',
      },
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'validFrom',
          type: 'date',
          admin: {
            date: { pickerAppearance: 'dayAndTime' },
            description: 'Leave empty for no start limit.',
          },
        },
        {
          name: 'validUntil',
          type: 'date',
          admin: {
            date: { pickerAppearance: 'dayAndTime' },
            description: 'Leave empty for no end limit.',
          },
        },
      ],
    },
    {
      name: 'discountType',
      type: 'select',
      required: true,
      defaultValue: 'percentage',
      options: [
        { label: 'Percentage off eligible items', value: 'percentage' },
        { label: 'Fixed amount off eligible items', value: 'fixed' },
      ],
    },
    {
      name: 'discountPercentage',
      type: 'number',
      min: 0,
      max: 100,
      admin: {
        condition: (_, data) => data?.discountType === 'percentage',
        description: '0–100. Applied to eligible subtotal.',
      },
    },
    {
      name: 'discountFixedAmount',
      type: 'number',
      min: 0,
      admin: {
        condition: (_, data) => data?.discountType === 'fixed',
        description:
          'Fixed discount in whole taka (e.g. 50 for ৳50 off). Matches how you think in currency, not internal poisha.',
      },
    },
    {
      name: 'maxDiscountAmount',
      type: 'number',
      min: 0,
      admin: {
        condition: (_, data) => data?.discountType === 'percentage',
        description:
          'Optional maximum discount in whole taka (e.g. 500 for ৳500 cap on percentage promos).',
      },
    },
    {
      name: 'minOrderSubtotal',
      type: 'number',
      min: 0,
      admin: {
        description:
          'Minimum cart subtotal in whole taka before the code applies (e.g. 1000 for ৳1,000 minimum).',
      },
    },
    {
      name: 'restrictToProducts',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
      admin: {
        description: 'If set, only these products count toward the discount. Leave empty for all products (except exclusions).',
      },
    },
    {
      name: 'excludeProducts',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
    },
    {
      name: 'excludeCategories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      admin: {
        description: 'Products in any of these categories are excluded from the discount.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'maxRedemptionsTotal',
          type: 'number',
          min: 0,
          admin: {
            description: 'Max uses across all customers. Empty = unlimited.',
          },
        },
        {
          name: 'maxRedemptionsPerUser',
          type: 'number',
          min: 0,
          admin: {
            description: 'Per signed-in customer (orders linked to their account). Empty = unlimited.',
          },
        },
      ],
    },
    {
      name: 'timesRedeemed',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'Increments when an order is placed with this code.',
      },
    },
    {
      name: 'firstTimeCustomersOnly',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Signed-in users only: no completed orders on their account.',
      },
    },
    {
      name: 'allowedEmailDomains',
      type: 'textarea',
      admin: {
        description:
          'Optional. One domain per line (e.g. company.com). Applies to signed-in users with matching email.',
      },
    },
  ],
  timestamps: true,
}
