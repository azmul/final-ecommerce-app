import type { Payload } from 'payload'

import {
  contactToLoginEmail,
  resolveLoginEmails,
  resolvePhoneLookupCandidates,
} from '@/utilities/contactToLoginEmail'

function isEmailLike(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export async function resolveLoginEmailFromContact(
  payload: Payload,
  contact: string,
): Promise<string> {
  const trimmed = contact.trim()
  if (!trimmed) return trimmed

  if (isEmailLike(trimmed)) {
    return trimmed.toLowerCase()
  }

  const phoneCandidates = resolvePhoneLookupCandidates(trimmed)
  if (phoneCandidates.length > 0) {
    const byPhone = await payload.find({
      collection: 'users',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      select: {
        email: true,
      },
      where: {
        phone: {
          in: phoneCandidates,
        },
      },
    })

    const emailFromPhone = byPhone.docs[0]?.email
    if (typeof emailFromPhone === 'string' && emailFromPhone.trim()) {
      return emailFromPhone.trim().toLowerCase()
    }
  }

  const loginEmails = resolveLoginEmails(trimmed)
  for (const candidate of loginEmails) {
    const byEmail = await payload.find({
      collection: 'users',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      select: {
        email: true,
      },
      where: {
        email: {
          equals: candidate,
        },
      },
    })

    const matchedEmail = byEmail.docs[0]?.email
    if (typeof matchedEmail === 'string' && matchedEmail.trim()) {
      return matchedEmail.trim().toLowerCase()
    }
  }

  return loginEmails[0] ?? contactToLoginEmail(trimmed)
}
