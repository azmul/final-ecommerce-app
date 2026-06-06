import type { Payload } from 'payload'

import {
  REGISTRATION_BURST_THRESHOLD,
  REGISTRATION_BURST_WINDOW_MS,
  RISK_FLAG_WEIGHTS,
} from '@/lib/risk/config'
import { phoneSearchVariants } from '@/lib/risk/normalizeRiskPhone'
import { buildRiskScoreResult } from '@/lib/risk/scoreLevel'
import type { RequestContext, RiskFlag, RiskScoreResult } from '@/lib/risk/types'
import type { User } from '@/payload-types'
import { contactToLoginEmail, resolveLoginEmails } from '@/utilities/contactToLoginEmail'

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'mailinator.com',
  'guerrillamail.com',
  'tempmail.com',
  '10minutemail.com',
  'throwaway.email',
  'yopmail.com',
])

const SUSPICIOUS_NAME_PATTERN = /^(test|user|guest|asdf|abc|demo|fake|sample)([\d_]*)?$/i

function resolveRelationId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'object' && value !== null && 'id' in value) {
    const id = (value as { id: unknown }).id
    if (typeof id === 'number' && Number.isFinite(id)) return id
  }
  return null
}

function extractEmailDomain(email: string | null | undefined): string | null {
  if (!email?.includes('@')) return null
  return email.split('@')[1]?.trim().toLowerCase() ?? null
}

function isSyntheticPhoneEmail(email: string | null | undefined): boolean {
  return /^phone\.\d{10,15}@example\.com$/.test(email?.trim().toLowerCase() ?? '')
}

function loginEmailVariantsForPhone(phone: string): string[] {
  const variants = new Set<string>()
  for (const email of resolveLoginEmails(phone)) {
    variants.add(email)
  }
  for (const digits of phoneSearchVariants(phone)) {
    variants.add(contactToLoginEmail(digits))
    variants.add(`phone.${digits}@example.com`)
  }
  return [...variants]
}

export async function scoreUserRisk(args: {
  payload: Payload
  user: User
  requestContext?: RequestContext
}): Promise<RiskScoreResult> {
  const { payload, user, requestContext } = args
  const flags: RiskFlag[] = []

  if (requestContext?.ip) {
    const sinceIso = new Date(Date.now() - REGISTRATION_BURST_WINDOW_MS).toISOString()
    const burst = await payload.find({
      collection: 'users',
      depth: 0,
      limit: 20,
      overrideAccess: true,
      where: {
        and: [
          { createdAt: { greater_than_equal: sinceIso } },
          { 'riskAssessment.riskCapturedIp': { equals: requestContext.ip } },
        ],
      },
    })

    if (
      burst.docs.filter((entry) => entry.id !== user.id).length + 1 >=
      REGISTRATION_BURST_THRESHOLD
    ) {
      flags.push({
        flag: 'registration_burst',
        weight: RISK_FLAG_WEIGHTS.registrationBurst,
        detail: requestContext.ip,
      })
    }
  }

  const emailDomain = extractEmailDomain(user.email)
  if (emailDomain && DISPOSABLE_EMAIL_DOMAINS.has(emailDomain)) {
    flags.push({
      flag: 'disposable_email',
      weight: RISK_FLAG_WEIGHTS.disposableEmail,
      detail: emailDomain,
    })
  }

  if (user.name && SUSPICIOUS_NAME_PATTERN.test(user.name.trim())) {
    flags.push({
      flag: 'suspicious_name',
      weight: RISK_FLAG_WEIGHTS.suspiciousName,
      detail: user.name,
    })
  }

  if (user.phone) {
    const emailVariants = loginEmailVariantsForPhone(user.phone)
    const phoneVariants = phoneSearchVariants(user.phone)

    const collision = await payload.find({
      collection: 'users',
      depth: 0,
      limit: 5,
      overrideAccess: true,
      where: {
        and: [
          { id: { not_equals: user.id } },
          {
            or: [
              ...phoneVariants.map((variant) => ({ phone: { equals: variant } })),
              ...emailVariants.map((email) => ({ email: { equals: email } })),
            ],
          },
        ],
      },
    })

    if (collision.docs.length > 0) {
      flags.push({
        flag: 'phone_collision',
        weight: RISK_FLAG_WEIGHTS.phoneCollision,
        detail: `${collision.docs.length} matching account(s)`,
      })
    }
  }

  if (user.referredBy) {
    const referrerId = resolveRelationId(user.referredBy)
    if (referrerId != null) {
      const sinceIso = new Date(Date.now() - REGISTRATION_BURST_WINDOW_MS).toISOString()
      const siblings = await payload.find({
        collection: 'users',
        depth: 0,
        limit: 20,
        overrideAccess: true,
        where: {
          and: [
            { referredBy: { equals: referrerId } },
            { createdAt: { greater_than_equal: sinceIso } },
          ],
        },
      })

      if (siblings.docs.length >= REGISTRATION_BURST_THRESHOLD) {
        flags.push({
          flag: 'referral_cluster',
          weight: RISK_FLAG_WEIGHTS.referralCluster,
          detail: `${siblings.docs.length} referrals in 1h`,
        })
      }
    }
  }

  if (isSyntheticPhoneEmail(user.email)) {
    flags.push({
      flag: 'synthetic_email_only',
      weight: RISK_FLAG_WEIGHTS.syntheticEmailOnly,
    })
  }

  return buildRiskScoreResult(flags)
}
