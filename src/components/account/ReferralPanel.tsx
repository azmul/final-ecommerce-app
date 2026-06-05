'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/providers/Auth'
import { Users } from 'lucide-react'
import React, { useState } from 'react'
import { toast } from 'sonner'

export function ReferralPanel() {
  const { setUser, user } = useAuth()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  if (!user) return null

  const referralCode = user.referralCode
  const shareUrl =
    typeof window !== 'undefined' && referralCode ?
      `${window.location.origin}/create-account?ref=${encodeURIComponent(referralCode)}`
    : ''

  async function applyReferral() {
    setLoading(true)
    try {
      const res = await fetch('/api/referrals/apply', {
        body: JSON.stringify({ code: code.trim() }),
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const body = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(body.error || 'Could not apply code.')
      const meRes = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/users/me`, {
        credentials: 'include',
      })
      if (meRes.ok) {
        const { user: freshUser } = (await meRes.json()) as { user?: typeof user }
        if (freshUser) setUser(freshUser)
      }
      toast.success('Referral code applied!')
      setCode('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not apply code.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl border bg-primary/10 text-primary">
          <Users aria-hidden className="size-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Refer a friend</h2>
          <p className="text-sm text-muted-foreground">
            Share your code — you both earn bonus loyalty points on their first order.
          </p>
        </div>
      </div>

      {referralCode ?
        <div className="mb-4 rounded-lg border bg-muted/20 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Your code</p>
          <p className="font-mono text-lg font-semibold">{referralCode}</p>
          {shareUrl ?
            <Button
              className="mt-2"
              onClick={() => {
                void navigator.clipboard.writeText(shareUrl)
                toast.success('Invite link copied.')
              }}
              size="sm"
              type="button"
              variant="outline"
            >
              Copy invite link
            </Button>
          : null}
        </div>
      : null}

      {!user.referredBy ?
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[12rem] flex-1">
            <Input
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter a friend's code"
              value={code}
            />
          </div>
          <Button disabled={loading || !code.trim()} onClick={() => void applyReferral()} type="button">
            Apply code
          </Button>
        </div>
      : <p className="text-sm text-muted-foreground">Referral code already applied to your account.</p>}
    </section>
  )
}
