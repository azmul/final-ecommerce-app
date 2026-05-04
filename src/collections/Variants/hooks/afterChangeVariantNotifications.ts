import type { CollectionAfterChangeHook } from 'payload'

import { notifyVariantLevelChange } from '@/lib/notifications/triggerInventoryAndPrice'

export const afterChangeVariantNotifications: CollectionAfterChangeHook = async ({
  context,
  doc,
  operation,
  previousDoc,
  req,
}) => {
  if (context?.skipVariantNotificationTriggers) {
    return
  }

  if (operation !== 'update' || !previousDoc || !req?.payload) {
    return
  }

  await notifyVariantLevelChange({
    doc: doc as Record<string, unknown>,
    payload: req.payload,
    previousDoc: previousDoc as Record<string, unknown>,
    req,
  })
}
