import { cn } from '@/utilities/cn'

type Props = {
  className?: string
}

export function SkipToContent({ className }: Props) {
  return (
    <a
      className={cn(
        'sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50',
        'rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-lg',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className,
      )}
      href="#main-content"
    >
      Skip to main content
    </a>
  )
}
