/**
 * Shared horizontal gutters for public UI (aligned with header nav inner band).
 * Replaces Tailwind `.container` max-width constraints so storefront pages share one width band.
 */
export const cmsPageGutterClassName = 'mx-auto w-full min-w-0 px-6 sm:px-10' as const

/**
 * Full-width shell inside `cmsPageGutterClassName`; keeps grids/carousels from capping oddly.
 */
export const cmsBlockShellClassName = 'w-full min-w-0' as const

/**
 * Card surface aligned with checkout section cards (`CheckoutPage` checkout sections).
 */
export const cmsBlockSurfaceClassName =
  'overflow-hidden rounded-xl border border-border/80 bg-card text-card-foreground shadow-none sm:shadow-sm' as const

/**
 * Vertical stack spacing between CMS layout blocks in `RenderBlocks`.
 */
export const cmsBlockStackGapClassName = 'flex flex-col gap-8 md:gap-10' as const
