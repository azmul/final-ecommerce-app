import { describe, expect, it } from 'vitest'

import {
  ADMIN_LOGIN_GUARD_BOUNCE_GAP_MS,
  ADMIN_LOGIN_GUARD_MAX_REDIRECTS,
  decideAdminLoginRedirect,
  parseAdminLoginGuardCookie,
} from '@/utilities/adminLoginRedirectGuard'

const NOW = 1_700_000_000_000

describe('parseAdminLoginGuardCookie', () => {
  it('returns null for a missing cookie', () => {
    expect(parseAdminLoginGuardCookie(undefined, NOW)).toBeNull()
    expect(parseAdminLoginGuardCookie(null, NOW)).toBeNull()
    expect(parseAdminLoginGuardCookie('', NOW)).toBeNull()
  })

  it('returns null for garbage, negative, or partial values', () => {
    expect(parseAdminLoginGuardCookie('abc', NOW)).toBeNull()
    expect(parseAdminLoginGuardCookie('3', NOW)).toBeNull()
    expect(parseAdminLoginGuardCookie('-5:100', NOW)).toBeNull()
    expect(parseAdminLoginGuardCookie('3:abc', NOW)).toBeNull()
    expect(parseAdminLoginGuardCookie('0:100', NOW)).toBeNull()
  })

  it('returns null for a future timestamp (planted cookie)', () => {
    expect(parseAdminLoginGuardCookie(`3:${NOW + 60_000}`, NOW)).toBeNull()
  })

  it('parses well-formed values', () => {
    expect(parseAdminLoginGuardCookie(`2:${NOW - 500}`, NOW)).toEqual({
      count: 2,
      lastRedirectAt: NOW - 500,
    })
  })
})

describe('decideAdminLoginRedirect', () => {
  it('redirects with a fresh count when no guard cookie exists', () => {
    expect(decideAdminLoginRedirect(undefined, NOW)).toEqual({
      action: 'redirect',
      cookieValue: `1:${NOW}`,
    })
  })

  it('increments the count on rapid re-arrivals below the threshold', () => {
    expect(decideAdminLoginRedirect(`1:${NOW - 500}`, NOW)).toEqual({
      action: 'redirect',
      cookieValue: `2:${NOW}`,
    })
    expect(decideAdminLoginRedirect(`2:${NOW - 500}`, NOW)).toEqual({
      action: 'redirect',
      cookieValue: `3:${NOW}`,
    })
  })

  it('breaks the loop once the threshold of rapid bounces is reached', () => {
    expect(
      decideAdminLoginRedirect(`${ADMIN_LOGIN_GUARD_MAX_REDIRECTS}:${NOW - 500}`, NOW),
    ).toEqual({ action: 'break-loop' })
    expect(decideAdminLoginRedirect(`99:${NOW - 500}`, NOW)).toEqual({ action: 'break-loop' })
  })

  it('resets the sequence when the previous redirect is older than the bounce gap (benign revisit)', () => {
    const stale = NOW - ADMIN_LOGIN_GUARD_BOUNCE_GAP_MS - 1
    expect(decideAdminLoginRedirect(`${ADMIN_LOGIN_GUARD_MAX_REDIRECTS}:${stale}`, NOW)).toEqual({
      action: 'redirect',
      cookieValue: `1:${NOW}`,
    })
  })

  it('treats an unparseable or planted guard cookie as a fresh start', () => {
    expect(decideAdminLoginRedirect('garbage', NOW)).toEqual({
      action: 'redirect',
      cookieValue: `1:${NOW}`,
    })
    expect(decideAdminLoginRedirect('3', NOW)).toEqual({
      action: 'redirect',
      cookieValue: `1:${NOW}`,
    })
    expect(decideAdminLoginRedirect(`3:${NOW + 999_999}`, NOW)).toEqual({
      action: 'redirect',
      cookieValue: `1:${NOW}`,
    })
  })

  it('converges: rapid repeated bounces always reach break-loop', () => {
    let cookie: string | undefined
    let now = NOW
    const decisions: string[] = []
    for (let i = 0; i < 6; i += 1) {
      const decision = decideAdminLoginRedirect(cookie, now)
      decisions.push(decision.action)
      if (decision.action === 'break-loop') break
      cookie = decision.cookieValue
      now += 400 // real loops bounce sub-second
    }
    expect(decisions).toEqual(['redirect', 'redirect', 'redirect', 'break-loop'])
  })

  it('never breaks the loop for human-paced visits', () => {
    let cookie: string | undefined
    let now = NOW
    for (let i = 0; i < 10; i += 1) {
      const decision = decideAdminLoginRedirect(cookie, now)
      expect(decision.action).toBe('redirect')
      if (decision.action === 'redirect') cookie = decision.cookieValue
      now += ADMIN_LOGIN_GUARD_BOUNCE_GAP_MS + 5_000 // slower than any real loop
    }
  })
})
