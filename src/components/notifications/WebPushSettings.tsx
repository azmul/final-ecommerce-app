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

function decodeApplicationServerKey(publicKey: string): Uint8Array {
  const normalized = publicKey.trim().replace(/\s+/g, '')
  if (!normalized) {
    throw new Error('EMPTY_VAPID_KEY')
  }
  try {
    return urlBase64ToUint8Array(normalized)
  } catch {
    throw new Error('INVALID_VAPID_KEY_ENCODING')
  }
}

function isAbortError(err: unknown): boolean {
  if (err instanceof DOMException && err.name === 'AbortError') return true
  if (err instanceof Error && err.name === 'AbortError') return true
  return false
}

function describePushFailure(err: unknown): string {
  if (err instanceof Error && err.message === 'EMPTY_VAPID_KEY') {
    return 'The server returned an empty push key. Check NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PUBLIC_KEY in .env.'
  }
  if (err instanceof Error && err.message === 'INVALID_VAPID_KEY_ENCODING') {
    return 'The push public key is not valid base64. Regenerate with `npx web-push generate-vapid-keys` and update .env.'
  }

  const abortMsg =
    err instanceof DOMException && err.name === 'AbortError' ? err.message
    : err instanceof Error && err.name === 'AbortError' ? err.message
    : ''

  if (abortMsg) {
    const lower = abortMsg.toLowerCase()
    if (lower.includes('push service')) {
      return 'Could not reach push servers. Try another network or Firefox.'
    }
    return `Push signup was interrupted: ${abortMsg}. Try again shortly; if it repeats, check VPN, extensions, or another browser.`
  }

  if (err instanceof DOMException) {
    switch (err.name) {
      case 'NotAllowedError':
        return 'Notifications were blocked. Use your browser’s lock icon → Site settings → Notifications → Allow, then try again.'
      case 'InvalidAccessError':
        return 'Push failed: invalid application server key (often wrong or swapped VAPID keys). Verify keys from `npx web-push generate-vapid-keys`.'
      case 'NotSupportedError':
        return 'This browser does not support push subscriptions on this page.'
      case 'SecurityError':
        return 'Web Push requires a secure connection (HTTPS), except on localhost.'
      default:
        return err.message || `Push error (${err.name}).`
    }
  }
  if (err instanceof Error && err.message) {
    return err.message
  }
  return 'Something went wrong enabling push. Try another browser or check the developer console.'
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const PUSH_SUBSCRIBE_ATTEMPTS = 3

async function subscribeWithRetries(
  reg: ServiceWorkerRegistration,
  appServerKey: Uint8Array,
): Promise<PushSubscription> {
  let lastError: unknown

  for (let attempt = 0; attempt < PUSH_SUBSCRIBE_ATTEMPTS; attempt++) {
    try {
      if (attempt > 0) {
        await delay(400 * attempt)
      }

      const existing = await reg.pushManager.getSubscription()
      if (existing) {
        try {
          await existing.unsubscribe()
        } catch {
          //
        }
        await delay(200)
      }

      return await reg.pushManager.subscribe({
        applicationServerKey: appServerKey,
        userVisibleOnly: true,
      })
    } catch (err) {
      lastError = err
      const retryable = isAbortError(err)
      if (!retryable || attempt === PUSH_SUBSCRIBE_ATTEMPTS - 1) {
        throw err
      }
    }
  }

  throw lastError
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

    if (typeof window !== 'undefined' && !window.isSecureContext) {
      const host = window.location.hostname
      const localhost =
        host === 'localhost' ||
        host === '127.0.0.1' ||
        host === '[::1]' ||
        host.endsWith('.localhost')
      if (!localhost) {
        toast.error(
          'Web Push only works on HTTPS (or localhost). Open the site with https:// or use localhost for development.',
        )
        return
      }
    }

    setBusy(true)
    try {
      let permission = typeof Notification !== 'undefined' ? Notification.permission : 'denied'
      if (permission === 'denied') {
        toast.error(
          'Notifications are blocked for this site. Reset them in the browser (address bar lock icon → Site settings → Notifications → Allow), then click Enable again.',
        )
        return
      }

      if (permission === 'default' && typeof Notification !== 'undefined') {
        permission = await Notification.requestPermission()
      }

      if (permission !== 'granted') {
        toast.error(
          'Notification permission was not granted. Choose “Allow” when prompted, or enable notifications in site settings.',
        )
        return
      }

      const appServerKey = decodeApplicationServerKey(publicKey)

      const reg = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        type: 'classic',
        updateViaCache: 'none',
      })
      await reg.update().catch(() => undefined)
      await navigator.serviceWorker.ready

      const sub = await subscribeWithRetries(reg, appServerKey)

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
    } catch (err) {
      console.warn('[WebPushSettings]', err)
      const pushServiceBlocked =
        isAbortError(err) &&
        typeof (err as Error).message === 'string' &&
        (err as Error).message.toLowerCase().includes('push service')
      if (pushServiceBlocked) {
        toast.error('Could not reach push servers', {
          description:
            'VPNs, ad blockers, privacy DNS, or strict office networks often block Chrome and Edge from Google push. Try another Wi‑Fi, pause blocking for this site, or use Firefox.',
        })
      } else {
        toast.error(describePushFailure(err))
      }
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
