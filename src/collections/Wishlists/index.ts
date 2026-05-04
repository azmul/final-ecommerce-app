import type { Access, CollectionConfig, FieldHook } from 'payload'

import { checkRole } from '@/access/utilities'

const authenticated: Access = ({ req: { user } }) => Boolean(user)

const adminOrWishlistOwner: Access = ({ req: { user } }) => {
  if (!user) return false

  if (checkRole(['admin'], user)) {
    return true
  }

  return {
    customer: {
      equals: user.id,
    },
  }
}

const assignCustomer: FieldHook = ({ req, siblingData }) => {
  if (!req.user || checkRole(['admin'], req.user)) return siblingData?.customer

  return req.user.id
}

const dedupeProducts: FieldHook = ({ value }) => {
  if (!Array.isArray(value)) return value

  const seen = new Set<string>()

  return value.filter((product) => {
    const id =
      typeof product === 'object' && product !== null && 'id' in product ? product.id : product
    const key = String(id)

    if (!key || seen.has(key)) return false

    seen.add(key)
    return true
  })
}

export const Wishlists: CollectionConfig = {
  slug: 'wishlists',
  access: {
    create: authenticated,
    delete: adminOrWishlistOwner,
    read: adminOrWishlistOwner,
    update: adminOrWishlistOwner,
  },
  admin: {
    components: {
      beforeListTable: ['@/components/admin/WishlistDateRangeFilter#WishlistDateRangeFilter'],
    },
    defaultColumns: ['customer', 'updatedAt'],
    group: 'Users',
    useAsTitle: 'id',
  },
  fields: [
    {
      name: 'customer',
      type: 'relationship',
      hooks: {
        beforeValidate: [assignCustomer],
      },
      index: true,
      relationTo: 'users',
      required: true,
      unique: true,
    },
    {
      name: 'products',
      type: 'relationship',
      hasMany: true,
      hooks: {
        beforeValidate: [dedupeProducts],
      },
      relationTo: 'products',
    },
  ],
  timestamps: true,
}
