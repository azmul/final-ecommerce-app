import { buildGoogleAuthUrl, isGoogleOAuthConfigured } from '@/lib/auth/googleOAuth'
import { getOAuthCookieNames, oauthCookieOptions } from '@/lib/auth/oauthCookies'
import { getSafeRedirectPath } from '@/utilities/safeRedirectPath'
import crypto from 'crypto'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const {
  mode: OAUTH_MODE_COOKIE,
  redirect: OAUTH_REDIRECT_COOKIE,
  state: OAUTH_STATE_COOKIE,
} = getOAuthCookieNames('google')

export async function GET(request: Request) {
  if (!isGoogleOAuthConfigured()) {
    return NextResponse.json({ error: 'Google sign-in is not configured.' }, { status: 503 })
  }

  const url = new URL(request.url)
  const redirect = getSafeRedirectPath(url.searchParams.get('redirect')) || '/account'
  const mode = url.searchParams.get('mode') === 'link' ? 'link' : 'login'
  const state = crypto.randomBytes(32).toString('hex')

  const response = NextResponse.redirect(buildGoogleAuthUrl(state))
  response.cookies.set(OAUTH_STATE_COOKIE, state, oauthCookieOptions())
  response.cookies.set(OAUTH_REDIRECT_COOKIE, redirect, oauthCookieOptions())
  response.cookies.set(OAUTH_MODE_COOKIE, mode, oauthCookieOptions())
  return response
}
