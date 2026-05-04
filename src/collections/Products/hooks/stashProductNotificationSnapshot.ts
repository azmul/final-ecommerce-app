import type { CollectionBeforeChangeHook } from 'payload'

import {
  CONTEXT_NOTIFICATION_PREV_PRODUCT,
  type NotificationPrevProductSnapshot,
} from '@/lib/notifications/notificationHookContext'

/**
 * Stores pre-save pricing/inventory from `originalDoc`. Payload sometimes omits unchanged fields in
 * `afterChange.previousDoc`, which broke price-drop detection.
 */
export const stashProductNotificationSnapshot: CollectionBeforeChangeHook = ({
  context,
  originalDoc,
  operation,
}) => {
  if (operation !== 'update' || !originalDoc || typeof originalDoc !== 'object') {
    return
  }

  const o = originalDoc as Record<string, unknown>
  context[CONTEXT_NOTIFICATION_PREV_PRODUCT] = {
    enableVariants: o.enableVariants,
    inventory: o.inventory,
    priceInBDT: o.priceInBDT,
  } satisfies NotificationPrevProductSnapshot
}
