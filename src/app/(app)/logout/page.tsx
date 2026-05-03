import type { Metadata } from 'next'

import React from 'react'

import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { cn } from '@/utilities/cn'
import { cmsPageGutterClassName } from '@/utilities/cmsLayout'

import { LogoutPage } from './LogoutPage'

export default async function Logout() {
  return (
    <div
      className={cn(
        cmsPageGutterClassName,
        'min-h-[50vh] py-14 sm:min-h-[55vh] sm:py-20',
      )}
    >
      <div className="relative mx-auto w-full max-w-lg">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-8 mx-auto h-32 max-w-md rounded-[100%] bg-linear-to-br from-muted/60 via-muted/25 to-transparent blur-3xl md:-top-12 md:h-40"
        />
        <LogoutPage />
      </div>
    </div>
  )
}

export const metadata: Metadata = {
  description:
    'You have signed out securely. Continue shopping as a guest or log back into your account anytime.',
  openGraph: mergeOpenGraph({
    title: 'Logout',
    url: '/logout',
  }),
  title: 'Logout',
}
