'use client'

import dynamic from 'next/dynamic'
import React, { useEffect, useState } from 'react'

const CartModal = dynamic(() =>
  import('@/components/Cart/CartModal').then((mod) => ({ default: mod.CartModal })),
)

const FloatingCartBubble = dynamic(() =>
  import('@/components/Cart/FloatingCartBubble').then((mod) => ({
    default: mod.FloatingCartBubble,
  })),
)

const CompareFloatingBar = dynamic(() =>
  import('@/components/compare/CompareFloatingBar').then((mod) => ({
    default: mod.CompareFloatingBar,
  })),
)

const ChatWidget = dynamic(() =>
  import('@/components/chat').then((mod) => ({ default: mod.ChatWidget })),
)

/** Loads cart, compare, and chat UI after first paint to reduce main-thread work during LCP. */
export function DeferredStorefrontWidgets() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const schedule =
      typeof window.requestIdleCallback === 'function'
        ? window.requestIdleCallback
        : (cb: IdleRequestCallback) => window.setTimeout(cb, 1)

    const cancel =
      typeof window.cancelIdleCallback === 'function'
        ? window.cancelIdleCallback
        : window.clearTimeout

    const id = schedule(() => setReady(true))
    return () => cancel(id)
  }, [])

  if (!ready) return null

  return (
    <>
      <CartModal />
      <FloatingCartBubble />
      <CompareFloatingBar />
      <ChatWidget />
    </>
  )
}
