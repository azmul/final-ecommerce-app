import { staffCollectionAccess } from '@/lib/permissions/collectionAccess'
import { normalizeGiftCardCode } from '@/lib/giftCards/normalizeCode'
import type { CollectionConfig } from 'payload'

export const GiftCards: CollectionConfig = {
  slug: 'gift-cards',
  admin: {
    defaultColumns: ['code', 'remainingAmount', 'initialAmount', 'active', 'expiresAt', 'createdAt'],
    description: 'Stored-value gift cards redeemable at checkout.',
    group: 'Ecommerce',
    useAsTitle: 'code',
  },
  access: staffCollectionAccess('gift-cards'),
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data?.code && typeof data.code === 'string') {
          data.code = normalizeGiftCardCode(data.code)
        }
        if (
          data?.initialAmount != null &&
          data.remainingAmount == null
        ) {
          data.remainingAmount = data.initialAmount
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'code',
      type: 'text',
      index: true,
      required: true,
      unique: true,
    },
    {
      name: 'initialAmount',
      type: 'number',
      min: 1,
      required: true,
    },
    {
      name: 'remainingAmount',
      type: 'number',
      admin: { readOnly: true },
      min: 0,
      required: true,
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'recipientEmail',
      type: 'email',
    },
    {
      name: 'purchaser',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'expiresAt',
      type: 'date',
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
    {
      name: 'internalNote',
      type: 'textarea',
      admin: { description: 'Staff only.' },
    },
  ],
  labels: {
    plural: 'Gift Cards',
    singular: 'Gift Card',
  },
}
