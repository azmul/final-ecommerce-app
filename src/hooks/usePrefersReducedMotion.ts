'use client'

/**
 * SSR-safe boolean for `prefers-reduced-motion`. Re-exported from Framer Motion
 * so JS-driven animations honor the same OS setting our CSS `@media` guards do.
 * Returns `true` when the user has requested reduced motion.
 */
export { useReducedMotion as usePrefersReducedMotion } from 'framer-motion'
