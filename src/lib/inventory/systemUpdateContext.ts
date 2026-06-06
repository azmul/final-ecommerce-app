/** Payload context for automated inventory writes (checkout, returns, restock). */
export const inventorySystemUpdateContext = {
  disableRevalidate: true,
  skipProductNotificationTriggers: true,
} as const
