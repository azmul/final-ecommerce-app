import type { CollectionConfig, PayloadRequest, Where } from 'payload'

import { adminOrUserOwnedByUserField } from '@/access/adminOrUserOwnedByUserField'

async function assertNoDuplicateActiveAlert({
  data,
  operation,
  req,
}: {
  data: Record<string, unknown> | undefined
  operation: 'create' | 'update' | 'delete'
  req: PayloadRequest
}): Promise<void> {
  if (operation !== 'create') return
  if (!data?.product || !data?.alertType) return

  const userId = req.user?.id
  if (!userId) return

  const variant = data.variant
  const alertType = data.alertType

  const variantClause: Where = variant
    ? { variant: { equals: variant } }
    : { or: [{ variant: { equals: null } }, { variant: { exists: false } }] }

  const existing = await req.payload.find({
    collection: 'product-alerts',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: {
      and: [
        { user: { equals: userId } },
        { product: { equals: data.product } },
        { alertType: { equals: alertType } },
        { active: { equals: true } },
        variantClause,
      ],
    },
  })

  if (existing.docs.length > 0) {
    throw new Error('You already have an active alert of this type for this product.')
  }
}

export const ProductAlerts: CollectionConfig = {
  slug: 'product-alerts',
  admin: {
    group: 'Notifications',
    defaultColumns: ['user', 'product', 'variant', 'alertType', 'active', 'targetPrice'],
    useAsTitle: 'id',
  },
  access: {
    create: ({ req }) => Boolean(req.user),
    delete: adminOrUserOwnedByUserField,
    read: adminOrUserOwnedByUserField,
    update: adminOrUserOwnedByUserField,
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
    },
    {
      name: 'product',
      type: 'relationship',
      relationTo: 'products',
      required: true,
      index: true,
    },
    {
      name: 'variant',
      type: 'relationship',
      relationTo: 'variants',
      admin: {
        description: 'Optional. Leave empty for simple products without variants.',
      },
      filterOptions: ({ data }): Where => {
        const productId = data?.product
        if (!productId) {
          return { id: { in: [] } }
        }
        const id = typeof productId === 'object' && productId && 'id' in productId ? productId.id : productId
        return {
          product: {
            equals: id,
          },
        }
      },
    },
    {
      name: 'alertType',
      type: 'select',
      required: true,
      options: [
        { label: 'Price drop', value: 'price_drop' },
        { label: 'Back in stock', value: 'restock' },
      ],
    },
    {
      name: 'targetPrice',
      type: 'number',
      admin: {
        description:
          'For price drops: notify when the price is at or below this amount (currency matches store). Leave empty to notify on any decrease.',
        step: 1,
      },
      min: 0,
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'fulfilledAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        readOnly: true,
      },
    },
  ],
  hooks: {
    beforeValidate: [
      async (args) => {
        await assertNoDuplicateActiveAlert({
          data: args.data as Record<string, unknown> | undefined,
          operation: args.operation,
          req: args.req,
        })
        return args.data
      },
    ],
    beforeChange: [
      async ({ data, operation, req }) => {
        if (operation === 'create' && req.user && data) {
          return { ...data, user: req.user.id }
        }
        return data
      },
    ],
  },
  timestamps: true,
}
