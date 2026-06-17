import { LogoIcon } from '@/components/icons/logo'
import { cn } from '@/utilities/cn'
import Image from 'next/image'
import React from 'react'

type Props = {
  className?: string
  imageClassName?: string
  logoUrl?: string | null
  showSiteNameWithFallback?: boolean
  siteName: string
}

export function SiteLogo({
  className,
  imageClassName,
  logoUrl,
  showSiteNameWithFallback = false,
  siteName,
}: Props) {
  if (logoUrl) {
    return (
      <Image
        alt={siteName}
        className={cn('h-8 w-auto object-contain', imageClassName)}
        height={32}
        src={logoUrl}
        unoptimized
        width={128}
      />
    )
  }

  if (showSiteNameWithFallback) {
    return (
      <span className={cn('inline-flex items-center gap-2.5', className)}>
        <LogoIcon className="size-8 text-orange-500" aria-hidden />
        <span className="text-lg font-bold uppercase tracking-wide text-orange-500">{siteName}</span>
      </span>
    )
  }

  return <LogoIcon className={cn('w-6 h-auto', className)} aria-hidden />
}
