'use client'

import { Download, X } from 'lucide-react'
import React, { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'

const DISMISS_KEY = 'pwa-install-dismissed'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  )
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (isStandaloneDisplay()) return
    if (localStorage.getItem(DISMISS_KEY) === '1') return

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
  }, [])

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1')
    setVisible(false)
    setDeferredPrompt(null)
  }

  const install = async () => {
    if (!deferredPrompt) return

    await deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    if (choice.outcome === 'accepted') {
      setVisible(false)
    }
    setDeferredPrompt(null)
  }

  if (!visible || !deferredPrompt) return null

  return (
    <div
      aria-live="polite"
      className="fixed inset-x-4 bottom-4 z-[70] mx-auto max-w-md rounded-xl border border-border bg-background p-4 shadow-lg sm:inset-x-auto sm:right-6"
      role="region"
      aria-label="Install app"
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Install this store</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add to your home screen for faster checkout, offline browsing, and app-like navigation.
          </p>
        </div>
        <Button aria-label="Dismiss install prompt" onClick={dismiss} size="icon" variant="ghost">
          <X aria-hidden className="size-4" />
        </Button>
      </div>
      <div className="mt-3 flex gap-2">
        <Button className="flex-1" onClick={() => void install()} size="sm">
          <Download aria-hidden className="size-4" />
          Install app
        </Button>
        <Button onClick={dismiss} size="sm" variant="outline">
          Not now
        </Button>
      </div>
    </div>
  )
}
