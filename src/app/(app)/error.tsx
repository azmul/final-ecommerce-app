'use client'

import { Button } from '@/components/ui/button'
import { cmsPageGutterClassName } from '@/utilities/cmsLayout'
import { cn } from '@/utilities/cn'
import Link from 'next/link'
import React from 'react'

export default function Error({ reset }: { reset: () => void }) {
  return (
    <div
      className={cn(cmsPageGutterClassName, 'py-16 sm:py-20')}
      role="alert"
    >
      <div className="mx-auto flex max-w-lg flex-col items-center rounded-2xl border border-border bg-card px-6 py-12 text-center shadow-sm sm:px-10">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Something went wrong
        </h1>
        <p className="mt-3 text-pretty text-sm text-muted-foreground sm:text-base">
          We could not load this page. This is usually temporary—try again, or return to the
          homepage.
        </p>
        <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          <Button className="w-full sm:w-auto" onClick={() => reset()} type="button">
            Try again
          </Button>
          <Button asChild className="w-full sm:w-auto" variant="outline">
            <Link href="/">Go home</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
