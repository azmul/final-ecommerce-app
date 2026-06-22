'use client'

import { m } from 'framer-motion'
import React from 'react'

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
 * Reveals children once they scroll into view. Uses IntersectionObserver under
 * the hood (no scroll listeners) and animates GPU-only `opacity`/`transform`.
 * Respects reduced motion by rendering the final state immediately.
 */
export function Reveal({ children, delay = 0, y = 24, className, as = 'div' }: Props) {
  const reduced = usePrefersReducedMotion()
  const Tag = m[as] as typeof m.div

  return (
    <Tag
      className={className}
      initial={reduced ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ duration: dur.slow, ease: ease.out, delay }}
    >
      {children}
    </Tag>
  )
}
