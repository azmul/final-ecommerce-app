'use client'

import { m, useAnimationControls, useInView } from 'framer-motion'
import React, { useEffect, useRef, useState } from 'react'

import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { dur, ease } from '@/lib/motion/tokens'

type Props = {
  children: React.ReactNode
  /** Delay in seconds — stagger siblings with 0, 0.08, 0.16… */
  delay?: number
  /** Vertical offset to rise from, in px. */
  y?: number
  className?: string
  as?: keyof typeof m
}

/**
 * Reveals children once they scroll into view.
 *
 * Content is rendered fully visible in the server HTML — hiding it with an
 * opacity-0 initial state would keep above-the-fold content (often the LCP
 * element) invisible until hydration, which is seconds on slow devices. At
 * hydration, only elements still below the viewport are snap-hidden and then
 * animated in when scrolled into view. Respects reduced motion.
 */
export function Reveal({ children, delay = 0, y = 24, className, as = 'div' }: Props) {
  const reduced = usePrefersReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const controls = useAnimationControls()
  const [armed, setArmed] = useState(false)
  const inView = useInView(ref, { margin: '0px 0px -10% 0px', once: true })

  const Tag = m[as] as typeof m.div

  useEffect(() => {
    if (reduced) return
    const el = ref.current
    if (!el) return
    // Below the fold at hydration → safe to hide without affecting first paint.
    if (el.getBoundingClientRect().top > window.innerHeight) {
      controls.set({ opacity: 0, y })
      setArmed(true)
    }
  }, [controls, reduced, y])

  useEffect(() => {
    if (armed && inView) {
      void controls.start({
        opacity: 1,
        transition: { delay, duration: dur.slow, ease: ease.out },
        y: 0,
      })
    }
  }, [armed, controls, delay, inView])

  return (
    <Tag animate={controls} className={className} initial={false} ref={ref}>
      {children}
    </Tag>
  )
}
