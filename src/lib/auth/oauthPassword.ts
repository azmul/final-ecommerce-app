import crypto from 'crypto'

/** Server-only password for OAuth-created accounts. Never exposed to clients. */
export const deriveOAuthPassword = (provider: string, providerUserId: string): string => {
  const secret = process.env.PAYLOAD_SECRET?.trim()
  if (!secret) {
    throw new Error('PAYLOAD_SECRET is required for OAuth login.')
  }

  return crypto.createHmac('sha256', secret).update(`oauth:${provider}:${providerUserId}`).digest('hex')
}
