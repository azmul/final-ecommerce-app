import { metaHashEmail, metaHashPhone } from '@/lib/analytics/metaHash'

import type { MetaCapiUserDataInput } from '@/lib/analytics/meta/types'

export function buildMetaCapiUserData(
  input: MetaCapiUserDataInput = {},
): Record<string, unknown> {
  const userData: Record<string, unknown> = {}

  if (input.email) {
    const hashed = metaHashEmail(input.email)
    if (hashed) userData.em = [hashed]
  }

  if (input.phone) {
    const hashed = metaHashPhone(input.phone)
    if (hashed) userData.ph = [hashed]
  }

  if (input.clientIp) userData.client_ip_address = input.clientIp
  if (input.clientUserAgent) userData.client_user_agent = input.clientUserAgent
  if (input.fbp) userData.fbp = input.fbp
  if (input.fbc) userData.fbc = input.fbc
  if (input.externalId) userData.external_id = String(input.externalId)

  return userData
}
