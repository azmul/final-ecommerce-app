import {
  exchangeGoogleCode,
  fetchGoogleUserProfile,
  isGoogleOAuthConfigured,
} from '@/lib/auth/googleOAuth'
import { clearOAuthCookie, getOAuthCookieNames } from '@/lib/auth/oauthCookies'
import {
  createOAuthLoginSession,
  linkOAuthAccount,
  OAuthAccountExistsError,
  resolveOAuthUser,
} from '@/lib/auth/oauthSession'
import { getServerSideURL } from '@/utilities/getURL'
import { getSafeRedirectPath } from '@/utilities/safeRedirectPath'
import configPromise from '@payload-config'
import { parseCookies } from 'payload'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const {
  linkNonce: OAUTH_LINK_NONCE_COOKIE,
  mode: OAUTH_MODE_COOKIE,
  redirect: OAUTH_REDIRECT_COOKIE,
  state: OAUTH_STATE_COOKIE,
} = getOAuthCookieNames('google')

function redirectToLogin(message: string): NextResponse {
  const loginUrl = new URL('/login', getServerSideURL())
  loginUrl.searchParams.set('warning', message)
  const response = NextResponse.redirect(loginUrl)
  response.headers.append('Set-Cookie', clearOAuthCookie(OAUTH_STATE_COOKIE))
  response.headers.append('Set-Cookie', clearOAuthCookie(OAUTH_REDIRECT_COOKIE))
  return response
}

export async function GET(request: Request) {
  if (!isGoogleOAuthConfigured()) {
    return redirectToLogin('Google sign-in is not available right now.')
  }

  const url = new URL(request.url)
  const oauthError = url.searchParams.get('error')
  if (oauthError) {
    return redirectToLogin('Google sign-in was cancelled.')
  }

  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const cookies = parseCookies(request.headers)
  const storedState = cookies.get(OAUTH_STATE_COOKIE)
  const redirectRaw = cookies.get(OAUTH_REDIRECT_COOKIE)
  const redirectPath = getSafeRedirectPath(redirectRaw) || '/account'
  const mode = cookies.get(OAUTH_MODE_COOKIE) === 'link' ? 'link' : 'login'

  if (!code || !state || !storedState || state !== storedState) {
    return redirectToLogin('Google sign-in failed. Please try again.')
  }

  try {
    const tokens = await exchangeGoogleCode(code)
    const profile = await fetchGoogleUserProfile(tokens.access_token)
    const payload = await getPayload({ config: configPromise })
    const auth = await payload.auth({ headers: request.headers })

    if (mode === 'link') {
      if (!auth.user) {
        return redirectToLogin('Sign in first, then link Google from account settings.')
      }

      const linkNonce = cookies.get(OAUTH_LINK_NONCE_COOKIE)
      if (!linkNonce) {
        return redirectToLogin('Google account linking requires confirmation. Please try again from account settings.')
      }

      await linkOAuthAccount(payload, 'google', {
        email: profile.email,
        emailVerified: profile.email_verified,
        id: profile.sub,
        name: profile.name,
      }, auth.user.id)

      const response = NextResponse.redirect(new URL(redirectPath, getServerSideURL()))
      response.headers.append('Set-Cookie', clearOAuthCookie(OAUTH_STATE_COOKIE))
      response.headers.append('Set-Cookie', clearOAuthCookie(OAUTH_REDIRECT_COOKIE))
      response.headers.append('Set-Cookie', clearOAuthCookie(OAUTH_MODE_COOKIE))
      response.headers.append('Set-Cookie', clearOAuthCookie(OAUTH_LINK_NONCE_COOKIE))
      return response
    }

    const user = await resolveOAuthUser(payload, 'google', {
      email: profile.email,
      emailVerified: profile.email_verified,
      id: profile.sub,
      name: profile.name,
    })
    const { cookie } = await createOAuthLoginSession(payload, 'google', user)

    const response = NextResponse.redirect(new URL(redirectPath, getServerSideURL()))
    response.headers.append('Set-Cookie', cookie)
    response.headers.append('Set-Cookie', clearOAuthCookie(OAUTH_STATE_COOKIE))
    response.headers.append('Set-Cookie', clearOAuthCookie(OAUTH_REDIRECT_COOKIE))
    response.headers.append('Set-Cookie', clearOAuthCookie(OAUTH_MODE_COOKIE))
    return response
  } catch (error) {
    if (error instanceof OAuthAccountExistsError) {
      return redirectToLogin(error.message)
    }

    const message =
      error instanceof Error ? error.message : 'Google sign-in failed. Please try again.'
    return redirectToLogin(message)
  }
}
