import type { CollectionOverride } from '@payloadcms/plugin-ecommerce/types'

import { adminOrStaff, staffCanViewAdminPage } from '@/access/staffAccess'
import { afterChangeVariantNotifications } from '@/collections/Variants/hooks/afterChangeVariantNotifications'
import { checkVariantLowStock } from '@/collections/Variants/hooks/checkVariantLowStock'
import { stashVariantNotificationSnapshot } from '@/collections/Variants/hooks/stashVariantNotificationSnapshot'
import {
  inventoryByLocationField,
  reorderLevelField,
} from '@/lib/inventory/inventoryFields'

export const VariantsCollection: CollectionOverride = ({ defaultCollection }) => ({
  ...defaultCollection,
  access: {
    ...(defaultCollection.access ?? {}),
    admin: staffCanViewAdminPage('products'),
    create: adminOrStaff('products', 'create'),
    read: adminOrStaff('products', 'read'),
    update: adminOrStaff('products', 'update'),
    delete: adminOrStaff('products', 'delete'),
  },
  hooks: {
    ...defaultCollection.hooks,
    beforeChange: [
      stashVariantNotificationSnapshot,
      ...(defaultCollection.hooks?.beforeChange ?? []),
    ],
    afterChange: [
      ...(defaultCollection.hooks?.afterChange ?? []),
      afterChangeVariantNotifications,
      checkVariantLowStock,
    ],
  },
  fields: [
    ...defaultCollection.fields,
    reorderLevelField(),
    inventoryByLocationField(),
  ],
})
