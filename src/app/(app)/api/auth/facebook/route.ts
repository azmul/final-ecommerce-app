import { buildFacebookAuthUrl, isFacebookOAuthConfigured } from '@/lib/auth/facebookOAuth'
import { getOAuthCookieNames, oauthCookieOptions } from '@/lib/auth/oauthCookies'
import { getSafeRedirectPath } from '@/utilities/safeRedirectPath'
import crypto from 'crypto'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const {
  linkNonce: OAUTH_LINK_NONCE_COOKIE,
  mode: OAUTH_MODE_COOKIE,
  redirect: OAUTH_REDIRECT_COOKIE,
  state: OAUTH_STATE_COOKIE,
} = getOAuthCookieNames('facebook')

export async function GET(request: Request) {
  if (!isFacebookOAuthConfigured()) {
    return NextResponse.json({ error: 'Facebook sign-in is not configured.' }, { status: 503 })
  }

  const url = new URL(request.url)
  const redirect = getSafeRedirectPath(url.searchParams.get('redirect')) || '/account'
  const mode = url.searchParams.get('mode') === 'link' ? 'link' : 'login'
  const state = crypto.randomBytes(32).toString('hex')
  const linkNonce = mode === 'link' ? crypto.randomBytes(32).toString('hex') : undefined

  const response = NextResponse.redirect(buildFacebookAuthUrl(state))
  response.cookies.set(OAUTH_STATE_COOKIE, state, oauthCookieOptions())
  response.cookies.set(OAUTH_REDIRECT_COOKIE, redirect, oauthCookieOptions())
  response.cookies.set(OAUTH_MODE_COOKIE, mode, oauthCookieOptions())
  if (linkNonce) {
    response.cookies.set(OAUTH_LINK_NONCE_COOKIE, linkNonce, oauthCookieOptions())
  }
  return response
}
