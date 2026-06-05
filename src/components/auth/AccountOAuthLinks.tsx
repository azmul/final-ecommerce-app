'use client'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/providers/Auth'
import Link from 'next/link'
import React from 'react'

function isConfigured(provider: 'google' | 'facebook'): boolean {
  if (provider === 'google') {
    return Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID)
  }
  return Boolean(process.env.NEXT_PUBLIC_FACEBOOK_APP_ID)
}

export function AccountOAuthLinks() {
  const { user } = useAuth()
  if (!user) return null

  const googleLinked = Boolean(user.googleId)
  const facebookLinked = Boolean(user.facebookId)

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h2 className="text-lg font-semibold">Connected accounts</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Link social sign-in to your password account for faster checkout.
      </p>

      <ul className="mt-4 flex flex-col gap-3">
        {isConfigured('google') ?
          <li className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3">
            <span className="text-sm font-medium">Google</span>
            {googleLinked ?
              <span className="text-sm text-emerald-700">Linked</span>
            : <Button asChild size="sm" variant="outline">
                <Link href="/api/auth/google?mode=link&redirect=/account">Link Google</Link>
              </Button>
            }
          </li>
        : null}
        {isConfigured('facebook') ?
          <li className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3">
            <span className="text-sm font-medium">Facebook</span>
            {facebookLinked ?
              <span className="text-sm text-emerald-700">Linked</span>
            : <Button asChild size="sm" variant="outline">
                <Link href="/api/auth/facebook?mode=link&redirect=/account">Link Facebook</Link>
              </Button>
            }
          </li>
        : null}
      </ul>
    </section>
  )
}
