import type { Cart } from '@/payload-types'
import type { Payload, PayloadRequest } from 'payload'
import { APIError } from 'payload'

import {
  inventoryErrorPayload,
  validateCartInventory,
} from '@/lib/inventory/validateCartInventory'

export async function assertInventoryBeforeOrder(args: {
  district?: string | null
  items: Cart['items'] | null | undefined
  payload: Payload
  req?: PayloadRequest
}): Promise<void> {
  const result = await validateCartInventory(args)
  if (!result.ok) {
    throw new APIError(inventoryErrorPayload(result), 400)
  }
}
