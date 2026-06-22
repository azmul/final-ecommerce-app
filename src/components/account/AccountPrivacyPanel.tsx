'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormFieldLabel } from '@/components/forms/FormFieldLabel'
import { useAuth } from '@/providers/Auth'
import { Download, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import { toast } from 'sonner'

export function AccountPrivacyPanel() {
  const { logout, user } = useAuth()
  const router = useRouter()
  const [confirm, setConfirm] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  // OAuth-only accounts have no user-known password; they confirm with DELETE only.
  const isOAuthOnly = Boolean(user?.googleId || user?.facebookId)

  async function exportData() {
    setBusy(true)
    try {
      const res = await fetch('/api/account/export-data', { credentials: 'include' })
      if (!res.ok) throw new Error('Export failed.')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = 'account-export.json'
      anchor.click()
      URL.revokeObjectURL(url)
      toast.success('Download started')
    } catch {
      toast.error('Could not export account data.')
    } finally {
      setBusy(false)
    }
  }

  async function deleteAccount() {
    if (confirm !== 'DELETE') {
      toast.error('Type DELETE to confirm account deletion.')
      return
    }
    if (!isOAuthOnly && !password) {
      toast.error('Enter your password to confirm account deletion.')
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/account/delete-account', {
        body: JSON.stringify({ confirm: 'DELETE', ...(isOAuthOnly ? {} : { password }) }),
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null
        throw new Error(data?.error || 'Delete failed.')
      }
      await logout()
      router.push('/')
      toast.success('Your account was deleted.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete account.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h2 className="text-lg font-semibold">Privacy &amp; data</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Download a copy of your profile, orders, addresses, and notifications. You can also permanently delete your account.
      </p>

      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
        <Button disabled={busy} onClick={() => void exportData()} type="button" variant="outline">
          <Download aria-hidden className="mr-2 size-4" />
          Export my data
        </Button>
      </div>

      <div className="mt-8 space-y-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
        <p className="text-sm font-medium text-destructive">Delete account</p>
        <p className="text-xs text-muted-foreground">
          This permanently removes your profile and cannot be undone. Type DELETE to confirm.
        </p>
        <FormFieldLabel htmlFor="delete-account-confirm">Confirmation</FormFieldLabel>
        <Input
          autoComplete="off"
          id="delete-account-confirm"
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="DELETE"
          value={confirm}
        />
        {!isOAuthOnly && (
          <>
            <FormFieldLabel htmlFor="delete-account-password">Password</FormFieldLabel>
            <Input
              autoComplete="current-password"
              id="delete-account-password"
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              type="password"
              value={password}
            />
          </>
        )}
        <Button disabled={busy} onClick={() => void deleteAccount()} type="button" variant="destructive">
          <Trash2 aria-hidden className="mr-2 size-4" />
          Delete my account
        </Button>
      </div>
    </section>
  )
}
