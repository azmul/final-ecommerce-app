/**
 * Shared motion tokens so timing/easing stays consistent across the app.
 * Animate only `transform` and `opacity` for 60fps, GPU-accelerated motion.
 */

// Premium decelerate curve for entrances; cubic-bezier as a tuple for Framer Motion.
export const ease = {
  out: [0.16, 1, 0.3, 1] as const,
  inOut: [0.65, 0, 0.35, 1] as const,
} as const

// Durations in seconds (Framer Motion expects seconds).
export const dur = {
  fast: 0.18,
  base: 0.3,
  slow: 0.5,
} as const
