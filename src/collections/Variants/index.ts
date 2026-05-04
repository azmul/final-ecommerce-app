import type { CollectionOverride } from '@payloadcms/plugin-ecommerce/types'

import { afterChangeVariantNotifications } from '@/collections/Variants/hooks/afterChangeVariantNotifications'
import { stashVariantNotificationSnapshot } from '@/collections/Variants/hooks/stashVariantNotificationSnapshot'

export const VariantsCollection: CollectionOverride = ({ defaultCollection }) => ({
  ...defaultCollection,
  hooks: {
    ...defaultCollection.hooks,
    beforeChange: [
      stashVariantNotificationSnapshot,
      ...(defaultCollection.hooks?.beforeChange ?? []),
    ],
    afterChange: [
      ...(defaultCollection.hooks?.afterChange ?? []),
      afterChangeVariantNotifications,
    ],
  },
})
