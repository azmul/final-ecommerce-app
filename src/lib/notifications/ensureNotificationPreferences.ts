import type { Payload, PayloadRequest } from 'payload'

/**
 * Creates default notification preferences for legacy accounts that pre-date the feature.
 */
export async function ensureNotificationPreferences(
  payload: Payload,
  userId: number,
  req?: PayloadRequest,
): Promise<void> {
  const existing = await payload.find({
    collection: 'notification-preferences',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    ...(req ? { req } : {}),
    where: {
      user: {
        equals: userId,
      },
    },
  })

  if (existing.docs.length > 0) {
    return
  }

  await payload.create({
    collection: 'notification-preferences',
    data: {
      marketingOptIn: false,
      orderUpdates: true,
      priceDropAlerts: true,
      pushEnabled: true,
      stockAlerts: true,
      user: userId,
    },
    overrideAccess: true,
    ...(req ? { req } : {}),
  })
}
