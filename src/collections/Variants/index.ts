import type { CollectionOverride } from '@payloadcms/plugin-ecommerce/types'

import { afterChangeVariantNotifications } from '@/collections/Variants/hooks/afterChangeVariantNotifications'

export const VariantsCollection: CollectionOverride = ({ defaultCollection }) => ({
  ...defaultCollection,
  hooks: {
    ...defaultCollection.hooks,
    afterChange: [
      ...(defaultCollection.hooks?.afterChange ?? []),
      afterChangeVariantNotifications,
    ],
  },
})
