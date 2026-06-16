import { randomBytes } from 'crypto'

import { normalizeGiftCardCode } from '@/lib/giftCards/normalizeCode'

export function generateGiftCardCode(): string {
  const segment = randomBytes(5).toString('hex').toUpperCase()
  return normalizeGiftCardCode(`GC-${segment}`)
}
