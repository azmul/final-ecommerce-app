'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'

const STORAGE_KEY = 'cookie-consent'
const BANNER_ID = 'cookie-consent-banner'

/**
 * Hides the SSR-rendered banner before first paint for visitors who already
 * consented. Runs synchronously during HTML parse so there is no flash, and
 * new visitors get the banner painted with the initial HTML (keeps it out of
 * the post-hydration window where it would inflate LCP).
 */
const HIDE_IF_CONSENTED = `try{if(window.localStorage.getItem('${STORAGE_KEY}')){var e=document.getElementById('${BANNER_ID}');if(e)e.style.display='none'}}catch(t){}`

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored) setVisible(false)
    } catch {
      // keep banner visible if storage is unavailable
    }
  }, [])

  function accept() {
    try {
      window.localStorage.setItem(STORAGE_KEY, 'accepted')
    } catch {
      // ignore
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <>
      <div
        className="fixed inset-x-0 bottom-0 z-[70] border-t border-border bg-background/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80"
        id={BANNER_ID}
        role="dialog"
        aria-label="Cookie consent"
        suppressHydrationWarning
      >
        <div className="container flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            We use cookies and similar technologies for analytics, cart persistence, and notifications.
            See our{' '}
            <Link className="underline underline-offset-2" href="/privacy" prefetch={false}>
              privacy policy
            </Link>
            .
          </p>
          <div className="flex shrink-0 gap-2">
            <Button onClick={accept} size="sm" type="button">
              Accept
            </Button>
          </div>
        </div>
      </div>
      <script dangerouslySetInnerHTML={{ __html: HIDE_IF_CONSENTED }} />
    </>
  )
}
