import type { CollectionConfig, Config, Plugin } from 'payload'

const NOTIFICATIONS_GROUP = 'Notifications'
const ECOMMERCE_GROUP = 'Ecommerce'

function getAdminGroup(collection: CollectionConfig): string | undefined {
  const g = collection.admin?.group
  return typeof g === 'string' ? g : undefined
}

/**
 * Payload orders admin sidebar groups by first registration of a collection in that group.
 * Notification collections are declared in `payload.config.ts` before the ecommerce plugin
 * appends its collections, which places Notifications above Ecommerce. Move notifications to
 * immediately after the last Ecommerce collection so the menu matches product expectations.
 */
export function appendNotificationsAfterEcommercePlugin(): Plugin {
  return (incomingConfig: Config): Config => {
    const existing = [...(incomingConfig.collections ?? [])]
    const notificationCollections = existing.filter((c) => getAdminGroup(c) === NOTIFICATIONS_GROUP)
    if (notificationCollections.length === 0) {
      return incomingConfig
    }

    const withoutNotifications = existing.filter((c) => getAdminGroup(c) !== NOTIFICATIONS_GROUP)

    let lastEcommerceIndex = -1
    withoutNotifications.forEach((c, i) => {
      if (getAdminGroup(c) === ECOMMERCE_GROUP) {
        lastEcommerceIndex = i
      }
    })

    const insertAt =
      lastEcommerceIndex === -1 ? withoutNotifications.length : lastEcommerceIndex + 1

    const collections = [
      ...withoutNotifications.slice(0, insertAt),
      ...notificationCollections,
      ...withoutNotifications.slice(insertAt),
    ]

    return {
      ...incomingConfig,
      collections,
    }
  }
}
