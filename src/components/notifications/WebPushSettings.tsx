'use client'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Bell, Loader2 } from 'lucide-react'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const buf = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) {
    buf[i] = raw.charCodeAt(i)
  }
  return buf
}

export function WebPushSettings() {
  const [configured, setConfigured] = useState<boolean | null>(null)
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [supported, setSupported] = useState(true)

  const refreshMeta = useCallback(async () => {
    const res = await fetch('/api/push/vapid-public')
    const data = (await res.json()) as { configured?: boolean; publicKey?: string | null }
    setConfigured(Boolean(data.configured && data.publicKey))
    setPublicKey(data.publicKey ?? null)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setSupported(false)
    }
    void refreshMeta()
  }, [refreshMeta])

  const enablePush = async () => {
    if (!publicKey) {
      toast.error('Push is not configured on the server (VAPID keys missing).')
      return
    }
    setBusy(true)
    try {
      const reg = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        applicationServerKey: urlBase64ToUint8Array(publicKey),
        userVisibleOnly: true,
      })
      const json = sub.toJSON()
      if (!json.keys?.auth || !json.keys?.p256dh || !json.endpoint) {
        toast.error('Browser did not return usable subscription keys.')
        return
      }
      const res = await fetch('/api/push/subscribe', {
        body: JSON.stringify({
          subscription: json,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        }),
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null
        toast.error(err?.error || 'Could not save subscription.')
        return
      }
      toast.success('Browser notifications enabled for this device.')
    } catch {
      toast.error('Permission was blocked or this browser does not support Web Push.')
    } finally {
      setBusy(false)
    }
  }

  if (!supported) {
    return (
      <p className="text-sm text-muted-foreground">
        This browser does not support Web Push. Use Chrome, Edge, or Firefox on desktop or Android.
      </p>
    )
  }

  if (configured === false) {
    return (
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm text-amber-200">
        <p className="font-medium text-foreground">Web Push is not configured</p>
        <p className="mt-1 text-muted-foreground">
          Add VAPID keys to your environment (see .env.example), then redeploy.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label className="text-sm font-medium" htmlFor="enable-web-push">
            Browser push on this device
          </Label>
          <p id="enable-web-push-hint" className="text-xs text-muted-foreground">
            You will be prompted for permission. You can revoke it anytime in the browser site settings.
          </p>
        </div>
        <Button
          aria-describedby="enable-web-push-hint"
          className="gap-2"
          disabled={busy || !publicKey}
          id="enable-web-push"
          onClick={() => void enablePush()}
          type="button"
          variant="outline"
        >
          {busy ?
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          : <Bell className="h-4 w-4" aria-hidden />}
          Enable on this device
        </Button>
      </div>
    </div>
  )
}
