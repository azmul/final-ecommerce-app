import type { Metadata } from 'next'

import { KeyRound } from 'lucide-react'
import Link from 'next/link'
import React, { Suspense } from 'react'

import { ForgotPasswordForm } from '@/components/forms/ForgotPasswordForm'
import { noindexMetadata } from '@/lib/seo/noindexMetadata'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { cmsPageGutterClassName } from '@/utilities/cmsLayout'
import { SHOP_BASE_PATH } from '@/utilities/shopPath'
import { cn } from '@/utilities/cn'

export default async function ForgotPasswordPage() {
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
          className="pointer-events-none absolute inset-x-0 -top-8 mx-auto h-32 max-w-md rounded-[100%] bg-linear-to-br from-primary/8 via-muted/40 to-transparent blur-3xl md:-top-12 md:h-40 dark:from-primary/12"
        />
        <div className="relative overflow-hidden rounded-2xl border border-border shadow-sm">
          <header className="border-b border-border bg-muted/20 px-6 py-6 sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-background text-primary shadow-sm ring-1 ring-border/60">
                <KeyRound aria-hidden className="h-5 w-5" />
              </div>
              <div className="min-w-0 space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Account recovery
                </p>
                <h1 className="text-pretty font-serif text-3xl tracking-tight text-foreground">
                  Reset your password
                </h1>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Enter the email on your account. If it matches a profile, we’ll send a secure link to
                  set a new password.
                </p>
              </div>
            </div>
          </header>

          <div className="p-6 sm:p-8">
            <Suspense fallback={<ForgotPasswordFormFallback />}>
              <ForgotPasswordForm />
            </Suspense>
          </div>

          <div className="border-t border-border bg-muted/10 px-6 py-4 sm:px-8">
            <p className="text-center text-xs leading-relaxed text-muted-foreground">
              Browse products in the{' '}
              <Link
                href={SHOP_BASE_PATH}
                className="font-medium text-foreground underline underline-offset-4 transition-colors hover:text-primary"
              >
                shop
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function ForgotPasswordFormFallback() {
  return (
    <div className="flex flex-col gap-6" aria-hidden>
      <div className="h-10 animate-pulse rounded-md bg-muted/60" />
      <div className="flex flex-col gap-3 pt-8 sm:flex-row-reverse sm:justify-between">
        <div className="h-11 w-full animate-pulse rounded-lg bg-muted/50 sm:w-44" />
        <div className="h-11 w-full animate-pulse rounded-lg bg-muted/40 sm:w-36" />
      </div>
    </div>
  )
}

export const metadata: Metadata = noindexMetadata({
  description:
    'Request a password reset link by email. Get back into your account in a few steps.',
  openGraph: mergeOpenGraph({
    title: 'Forgot password',
    url: '/forgot-password',
  }),
  title: 'Forgot password',
})
