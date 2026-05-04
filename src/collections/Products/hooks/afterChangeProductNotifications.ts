import type { CollectionAfterChangeHook } from 'payload'

import { notifyProductLevelChange } from '@/lib/notifications/triggerInventoryAndPrice'

export const afterChangeProductNotifications: CollectionAfterChangeHook = async ({
  context,
  doc,
  operation,
  previousDoc,
  req,
}) => {
  if (context?.skipProductNotificationTriggers) {
    return
  }

  if (operation !== 'update' || !previousDoc || !req?.payload) {
    return
  }

  await notifyProductLevelChange({
    doc: doc as Record<string, unknown>,
    payload: req.payload,
    previousDoc: previousDoc as Record<string, unknown>,
    req,
  })
}
