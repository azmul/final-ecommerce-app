'use client'

import { useEffect, useState } from 'react'

import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'

/**
 * Returns `true` when a sticky element should hide itself: the user is scrolling
 * down and is past `revealAt` px. Shows again on any upward scroll or near the
 * top. Uses a passive listener throttled to one rAF per frame (no layout reads
 * mid-frame beyond `scrollY`). Always returns `false` under reduced motion.
 */
export function useHideOnScroll(revealAt = 120): boolean {
  const reduced = usePrefersReducedMotion()
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    if (reduced) {
      setHidden(false)
      return
    }

    let lastY = window.scrollY
    let ticking = false

    const update = () => {
      const y = window.scrollY
      // Ignore sub-pixel jitter and rubber-band scrolling past the top.
      if (Math.abs(y - lastY) > 6) {
        setHidden(y > lastY && y > revealAt)
        lastY = y
      }
      ticking = false
    }

    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(update)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [reduced, revealAt])

  return hidden
}
