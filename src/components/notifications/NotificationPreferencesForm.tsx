'use client'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { queueStateUpdate } from '@/hooks/queueStateUpdate'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

type Prefs = {
  id: number
  pushEnabled?: boolean | null
  priceDropAlerts?: boolean | null
  stockAlerts?: boolean | null
  orderUpdates?: boolean | null
  marketingOptIn?: boolean | null
}

function prefChecked(key: keyof Prefs, prefs: Prefs): boolean {
  if (key === 'marketingOptIn') {
    return prefs.marketingOptIn === true
  }
  const v = prefs[key]
  if (typeof v === 'boolean') {
    return v
  }
  return true
}

export function NotificationPreferencesForm() {
  const [prefs, setPrefs] = useState<Prefs | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/notifications/preferences', { credentials: 'include' })
      if (!res.ok) {
        setPrefs(null)
        return
      }
      const data = (await res.json()) as { doc: Prefs | null }
      setPrefs(data.doc)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    queueStateUpdate(() => {
      void load()
    })
  }, [load])

  const save = async (patch: Partial<Prefs>) => {
    setSaving(true)
    try {
      const res = await fetch('/api/notifications/preferences', {
        body: JSON.stringify(patch),
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        method: 'PATCH',
      })
      const data = (await res.json().catch(() => null)) as { doc?: Prefs; error?: string } | null
      if (!res.ok || !data?.doc) {
        toast.error(data?.error || 'Could not update preferences.')
        return
      }
      setPrefs(data.doc)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Loading preferences…
      </div>
    )
  }

  if (!prefs) {
    return <p className="text-sm text-muted-foreground">Preferences could not be loaded.</p>
  }

  const row = (id: keyof Prefs, label: string, description: string) => (
    <div className="flex gap-3 rounded-lg border border-border/60 bg-background/40 px-3 py-3 sm:items-start">
      <Checkbox
        checked={prefChecked(id, prefs)}
        className="mt-1"
        disabled={saving}
        id={`pref-${String(id)}`}
        onCheckedChange={(v) => {
          const next = v === true
          setPrefs((p) => (p ? { ...p, [id]: next } : p))
          void save({ [id]: next } as Partial<Prefs>)
        }}
      />
      <div className="min-w-0 space-y-0.5">
        <Label className="text-sm font-medium leading-snug text-foreground" htmlFor={`pref-${String(id)}`}>
          {label}
        </Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-3">
      {row('pushEnabled', 'Push notifications', 'Allows Web Push when you enable it on a device below.')}
      {row(
        'priceDropAlerts',
        'Price drops',
        'Get notified when an item you follow becomes cheaper (inbox, and push when enabled).',
      )}
      {row(
        'stockAlerts',
        'Back in stock',
        'Get notified when an out-of-stock item you follow is available again.',
      )}
      {row(
        'marketingOptIn',
        'Promotional broadcasts',
        'Store-wide announcements from admins that target opted-in shoppers.',
      )}
      {row(
        'orderUpdates',
        'Order updates',
        'In-app notifications for order confirmation, shipping, and delivery.',
      )}
      {saving ?
        <p className="text-xs text-muted-foreground">Saving…</p>
      : null}
      <Button disabled={saving} onClick={() => void load()} size="sm" type="button" variant="ghost">
        Refresh
      </Button>
    </div>
  )
}
