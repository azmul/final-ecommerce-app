import type { CollectionBeforeChangeHook } from 'payload'

import {
  CONTEXT_NOTIFICATION_PREV_VARIANT,
  type NotificationPrevVariantSnapshot,
} from '@/lib/notifications/notificationHookContext'

export const stashVariantNotificationSnapshot: CollectionBeforeChangeHook = ({
  context,
  originalDoc,
  operation,
}) => {
  if (operation !== 'update' || !originalDoc || typeof originalDoc !== 'object') {
    return
  }

  const o = originalDoc as Record<string, unknown>
  context[CONTEXT_NOTIFICATION_PREV_VARIANT] = {
    inventory: o.inventory,
    priceInBDT: o.priceInBDT,
  } satisfies NotificationPrevVariantSnapshot
}
