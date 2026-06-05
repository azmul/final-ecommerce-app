import { deriveOAuthPassword } from '@/lib/auth/oauthPassword'
import type { User } from '@/payload-types'
import { createLocalReq, generatePayloadCookie, type Payload, type Where } from 'payload'

export type OAuthProvider = 'google' | 'facebook'

export type OAuthProfile = {
  email: string
  emailVerified?: boolean
  id: string
  name?: string
}

const providerIdField: Record<OAuthProvider, 'googleId' | 'facebookId'> = {
  facebook: 'facebookId',
  google: 'googleId',
}

const providerLabel: Record<OAuthProvider, string> = {
  facebook: 'Facebook',
  google: 'Google',
}

export class OAuthAccountExistsError extends Error {
  constructor(provider: OAuthProvider) {
    super(
      `An account with this email already exists. Please sign in with your password first, then link ${providerLabel[provider]} from account settings.`,
    )
    this.name = 'OAuthAccountExistsError'
  }
}

export async function resolveOAuthUser(
  payload: Payload,
  provider: OAuthProvider,
  profile: OAuthProfile,
): Promise<User> {
  const providerUserId = profile.id
  const email = profile.email.trim().toLowerCase()
  const idField = providerIdField[provider]

  if (profile.emailVerified === false) {
    throw new Error(`Your ${providerLabel[provider]} email address must be verified before signing in.`)
  }

  const byProvider = await payload.find({
    collection: 'users',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: {
      [idField]: { equals: providerUserId },
    } as Where,
  })

  if (byProvider.docs[0]) {
    return byProvider.docs[0] as User
  }

  const byEmail = await payload.find({
    collection: 'users',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: {
      email: { equals: email },
    },
  })

  const existing = byEmail.docs[0] as User | undefined
  if (existing) {
    const linkedId = existing[idField]
    if (typeof linkedId === 'string' && linkedId && linkedId !== providerUserId) {
      throw new Error(`This email is linked to a different ${providerLabel[provider]} account.`)
    }
    throw new OAuthAccountExistsError(provider)
  }

  const password = deriveOAuthPassword(provider, providerUserId)
  const created = await payload.create({
    collection: 'users',
    data: {
      email,
      [idField]: providerUserId,
      name: profile.name?.trim() || email.split('@')[0],
      password,
      roles: ['customer'],
    },
    overrideAccess: true,
  })

  return created as User
}

export async function linkOAuthAccount(
  payload: Payload,
  provider: OAuthProvider,
  profile: OAuthProfile,
  userId: number,
): Promise<User> {
  const idField = providerIdField[provider]
  const providerUserId = profile.id
  const email = profile.email.trim().toLowerCase()

  const user = await payload.findByID({
    id: userId,
    collection: 'users',
    depth: 0,
    overrideAccess: true,
  })

  if (!user) {
    throw new Error('Account not found.')
  }

  const existingLink = user[idField]
  if (typeof existingLink === 'string' && existingLink && existingLink !== providerUserId) {
    throw new Error(`This account is already linked to a different ${providerLabel[provider]} profile.`)
  }

  const byProvider = await payload.find({
    collection: 'users',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: {
      and: [
        { [idField]: { equals: providerUserId } },
        { id: { not_equals: userId } },
      ],
    } as Where,
  })

  if (byProvider.docs[0]) {
    throw new Error(`This ${providerLabel[provider]} account is linked to another user.`)
  }

  if (typeof user.email === 'string' && user.email.toLowerCase() !== email) {
    throw new Error(`Your ${providerLabel[provider]} email must match your account email.`)
  }

  const updated = await payload.update({
    id: userId,
    collection: 'users',
    data: { [idField]: providerUserId },
    overrideAccess: true,
  })

  return updated as User
}

export async function createOAuthLoginSession(
  payload: Payload,
  provider: OAuthProvider,
  user: User,
) {
  const idField = providerIdField[provider]
  const providerUserId = user[idField]
  const email = typeof user.email === 'string' ? user.email : null

  if (typeof providerUserId !== 'string' || !providerUserId || !email) {
    throw new Error(`This account is not linked to ${providerLabel[provider]} sign-in.`)
  }

  const req = await createLocalReq({}, payload)
  const loginResult = await payload.login({
    collection: 'users',
    data: {
      email,
      password: deriveOAuthPassword(provider, providerUserId),
    },
    req,
  })

  if (!loginResult.token) {
    throw new Error('Unable to create a login session.')
  }

  const usersCollection = payload.collections.users.config
  const cookie = generatePayloadCookie({
    collectionAuthConfig: usersCollection.auth,
    cookiePrefix: payload.config.cookiePrefix,
    token: loginResult.token,
  })

  return { cookie, user: loginResult.user as User }
}
