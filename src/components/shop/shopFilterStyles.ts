import { cn } from '@/utilities/cn'

/** High-contrast red clear button — matches reference shop filters UI. */
export const shopClearFiltersButtonClass = cn(
  'inline-flex items-center justify-center gap-2 rounded-lg',
  'bg-[#dc3545] text-sm font-bold text-white shadow-sm',
  'transition hover:bg-[#c82333]',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#dc3545]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
)

/** Brand orange used across shop filters (slider, accents). */
export const shopFilterAccentClass = 'bg-[#d4a017]'

export const shopSliderTrackClass =
  'bg-neutral-200 ring-1 ring-neutral-300/90 dark:bg-neutral-600 dark:ring-neutral-500'

export const shopSliderThumbClass = cn(
  '[&::-moz-range-track]:bg-transparent',
  '[&::-webkit-slider-runnable-track]:bg-transparent',
  '[&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full',
  '[&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[#d4a017] [&::-moz-range-thumb]:bg-white',
  '[&::-moz-range-thumb]:shadow-md',
  '[&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none',
  '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#d4a017]',
  '[&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md',
)
