import { animate } from 'framer-motion'

/** id placed on the cart icon so flights know where to land. */
export const CART_FLY_TARGET_ID = 'cart-fly-target'

/** Dispatched when a flight lands, so the cart badge can bounce. */
export const CART_BUMP_EVENT = 'cart:bump'

type FlyOptions = {
  /** Image to clone for the flight. */
  imageSrc?: string | null
  /** Bounding rect of the element the product is flying from. */
  from: DOMRect
}

/**
 * Animates a cloned product image from `from` to the cart icon along a short
 * arc, then signals the cart badge to bounce. GPU-only (transform/opacity).
 * No-ops gracefully if the target or window is unavailable. Callers should skip
 * this entirely when the user prefers reduced motion.
 */
export function flyToCart({ imageSrc, from }: FlyOptions): void {
  if (typeof window === 'undefined') return

  const target = document.getElementById(CART_FLY_TARGET_ID)
  const bump = () => window.dispatchEvent(new CustomEvent(CART_BUMP_EVENT))

  if (!target) {
    bump()
    return
  }

  const to = target.getBoundingClientRect()

  const size = 72
  const startX = from.left + from.width / 2 - size / 2
  const startY = from.top + from.height / 2 - size / 2
  const endX = to.left + to.width / 2 - size / 2
  const endY = to.top + to.height / 2 - size / 2

  const clone = document.createElement('div')
  clone.style.cssText = [
    'position:fixed',
    `left:${startX}px`,
    `top:${startY}px`,
    `width:${size}px`,
    `height:${size}px`,
    'border-radius:9999px',
    'z-index:60',
    'pointer-events:none',
    'will-change:transform,opacity',
    'box-shadow:0 10px 30px -8px rgba(0,0,0,0.35)',
    'background:var(--color-primary,#111) center/cover no-repeat',
    'overflow:hidden',
  ].join(';')

  if (imageSrc) {
    clone.style.backgroundImage = `url("${imageSrc}")`
    clone.style.backgroundColor = '#fff'
  }

  document.body.appendChild(clone)

  // Arc: drift up at the midpoint before swooping into the cart.
  const dx = endX - startX
  const dy = endY - startY

  const controls = animate(
    clone,
    {
      x: [0, dx * 0.5, dx],
      y: [0, dy * 0.5 - 80, dy],
      scale: [1, 0.7, 0.2],
      opacity: [1, 1, 0.4],
    },
    { duration: 0.8, ease: [0.22, 1, 0.36, 1], times: [0, 0.5, 1] },
  )

  controls.then(() => {
    clone.remove()
    bump()
  })
}
