import type { Access, CollectionConfig, FieldHook } from 'payload'

import { checkRole } from '@/access/utilities'
import { staffCanViewAdminPage } from '@/access/staffAccess'
import { staffOrDocumentOwner } from '@/access/staffOrDocumentOwner'

const authenticated: Access = ({ req: { user } }) => Boolean(user)

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
  }).slice(0, 3)
}

export const CompareLists: CollectionConfig = {
  slug: 'compare-lists',
  access: {
    admin: staffCanViewAdminPage('wishlists'),
    create: authenticated,
    delete: staffOrDocumentOwner('wishlists', 'delete', 'customer'),
    read: staffOrDocumentOwner('wishlists', 'view', 'customer'),
    update: staffOrDocumentOwner('wishlists', 'edit', 'customer'),
  },
  admin: {
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
      maxRows: 3,
      relationTo: 'products',
    },
  ],
  timestamps: true,
}
