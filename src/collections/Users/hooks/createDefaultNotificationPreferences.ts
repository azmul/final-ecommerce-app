import type { CollectionAfterChangeHook } from 'payload'

export const createDefaultNotificationPreferences: CollectionAfterChangeHook = async ({
  doc,
  operation,
  req,
}) => {
  if (operation !== 'create' || !req.payload) {
    return
  }

  const existing = await req.payload.find({
    collection: 'notification-preferences',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: {
      user: {
        equals: doc.id,
      },
    },
  })

  if (existing.docs.length > 0) {
    return
  }

  await req.payload.create({
    collection: 'notification-preferences',
    data: {
      user: doc.id,
      pushEnabled: true,
      priceDropAlerts: true,
      stockAlerts: true,
      orderUpdates: true,
      marketingOptIn: false,
    },
    req,
  })
}
