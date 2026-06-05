import { getServerSideURL } from '@/utilities/getURL'

const GRAPH_VERSION = 'v21.0'

export type FacebookOAuthConfig = {
  appId: string
  appSecret: string
}

export const getFacebookOAuthConfig = (): FacebookOAuthConfig | null => {
  const appId = process.env.FACEBOOK_APP_ID?.trim()
  const appSecret = process.env.FACEBOOK_APP_SECRET?.trim()
  if (!appId || !appSecret) return null
  return { appId, appSecret }
}

export const isFacebookOAuthConfigured = (): boolean => getFacebookOAuthConfig() !== null

export const getFacebookRedirectUri = (): string => {
  return `${getServerSideURL()}/api/auth/facebook/callback`
}

export const buildFacebookAuthUrl = (state: string): string => {
  const config = getFacebookOAuthConfig()
  if (!config) {
    throw new Error('Facebook OAuth is not configured.')
  }

  const url = new URL(`https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth`)
  url.searchParams.set('client_id', config.appId)
  url.searchParams.set('redirect_uri', getFacebookRedirectUri())
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', 'email,public_profile')
  url.searchParams.set('state', state)
  return url.toString()
}

export type FacebookTokenResponse = {
  access_token: string
  token_type?: string
  expires_in?: number
}

export const exchangeFacebookCode = async (code: string): Promise<FacebookTokenResponse> => {
  const config = getFacebookOAuthConfig()
  if (!config) {
    throw new Error('Facebook OAuth is not configured.')
  }

  const tokenUrl = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token`)
  tokenUrl.searchParams.set('client_id', config.appId)
  tokenUrl.searchParams.set('client_secret', config.appSecret)
  tokenUrl.searchParams.set('redirect_uri', getFacebookRedirectUri())
  tokenUrl.searchParams.set('code', code)

  const response = await fetch(tokenUrl.toString())
  const data = (await response.json().catch(() => ({}))) as FacebookTokenResponse & {
    error?: { message?: string; type?: string }
  }

  if (!response.ok || !data.access_token) {
    throw new Error(data.error?.message || 'Unable to exchange Facebook authorization code.')
  }

  return data
}

export type FacebookUserProfile = {
  email?: string
  id: string
  name?: string
}

export const fetchFacebookUserProfile = async (
  accessToken: string,
): Promise<FacebookUserProfile> => {
  const profileUrl = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/me`)
  profileUrl.searchParams.set('fields', 'id,name,email')
  profileUrl.searchParams.set('access_token', accessToken)

  const response = await fetch(profileUrl.toString())
  const profile = (await response.json().catch(() => ({}))) as FacebookUserProfile & {
    error?: { message?: string }
  }

  if (!response.ok || !profile.id) {
    throw new Error(profile.error?.message || 'Unable to load Facebook profile.')
  }

  if (!profile.email?.trim()) {
    throw new Error(
      'Facebook did not share an email address. Use Google sign-in or create an account with email instead.',
    )
  }

  return profile
}
