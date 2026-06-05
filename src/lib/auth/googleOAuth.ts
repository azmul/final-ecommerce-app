import { getServerSideURL } from '@/utilities/getURL'

export type GoogleOAuthConfig = {
  clientId: string
  clientSecret: string
}

export const getGoogleOAuthConfig = (): GoogleOAuthConfig | null => {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim()
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim()
  if (!clientId || !clientSecret) return null
  return { clientId, clientSecret }
}

export const isGoogleOAuthConfigured = (): boolean => getGoogleOAuthConfig() !== null

export const getGoogleRedirectUri = (): string => {
  return `${getServerSideURL()}/api/auth/google/callback`
}

export const buildGoogleAuthUrl = (state: string): string => {
  const config = getGoogleOAuthConfig()
  if (!config) {
    throw new Error('Google OAuth is not configured.')
  }

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  url.searchParams.set('client_id', config.clientId)
  url.searchParams.set('redirect_uri', getGoogleRedirectUri())
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', 'openid email profile')
  url.searchParams.set('state', state)
  url.searchParams.set('prompt', 'select_account')
  return url.toString()
}

export type GoogleTokenResponse = {
  access_token: string
  expires_in: number
  id_token?: string
  scope: string
  token_type: string
}

export const exchangeGoogleCode = async (code: string): Promise<GoogleTokenResponse> => {
  const config = getGoogleOAuthConfig()
  if (!config) {
    throw new Error('Google OAuth is not configured.')
  }

  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: getGoogleRedirectUri(),
  })

  const response = await fetch('https://oauth2.googleapis.com/token', {
    body,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    method: 'POST',
  })

  const data = (await response.json().catch(() => ({}))) as GoogleTokenResponse & {
    error?: string
    error_description?: string
  }

  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || 'Unable to exchange Google authorization code.')
  }

  return data
}

export type GoogleUserProfile = {
  email: string
  email_verified?: boolean
  name?: string
  picture?: string
  sub: string
}

export const fetchGoogleUserProfile = async (accessToken: string): Promise<GoogleUserProfile> => {
  const response = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  const profile = (await response.json().catch(() => ({}))) as GoogleUserProfile & {
    error?: string
  }

  if (!response.ok || !profile.sub || !profile.email) {
    throw new Error(profile.error || 'Unable to load Google profile.')
  }

  return profile
}
