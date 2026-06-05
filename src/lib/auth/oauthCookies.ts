const COOKIE_MAX_AGE = 10 * 60

export function oauthCookieOptions() {
  return {
    httpOnly: true,
    maxAge: COOKIE_MAX_AGE,
    path: '/',
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
  }
}

export function clearOAuthCookie(name: string): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `${name}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure}`
}

export function getOAuthCookieNames(provider: 'google' | 'facebook') {
  return {
    mode: `oauth_${provider}_mode`,
    redirect: `oauth_${provider}_redirect`,
    state: `oauth_${provider}_state`,
  }
}
