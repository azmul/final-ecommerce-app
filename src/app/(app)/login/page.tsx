import type { Metadata } from 'next'

import { LogIn } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import { headers as getHeaders } from 'next/headers'
import configPromise from '@payload-config'

import { LoginForm } from '@/components/forms/LoginForm'
import { RenderParams } from '@/components/RenderParams'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'

import { noindexMetadata } from '@/lib/seo/noindexMetadata'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { cn } from '@/utilities/cn'
import { cmsPageGutterClassName } from '@/utilities/cmsLayout'

export default async function Login() {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })

  if (user) {
    redirect(`/account?warning=${encodeURIComponent('You are already logged in.')}`)
  }

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
        <div className="relative overflow-hidden rounded-2xl border border-border shadow-sm">
          <header className="border-b border-border bg-muted/20 px-6 py-6 sm:px-8">
            <RenderParams className="mb-6" />

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-background text-primary shadow-sm ring-1 ring-border/60">
                <LogIn aria-hidden className="h-5 w-5" />
              </div>
              <div className="min-w-0 space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Welcome back
                </p>
                <h1 className="text-pretty font-serif text-3xl tracking-tight text-foreground">
                  Log in
                </h1>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Sign in with your email or phone and password to view orders and saved checkout
                  details.
                </p>
              </div>
            </div>
          </header>

          <div className="p-6 sm:p-8">
            <LoginForm />
          </div>

          <div className="border-t border-border bg-muted/10 px-6 py-4 sm:px-8">
            <p className="text-center text-xs leading-relaxed text-muted-foreground">
              Manage users and settings in the{' '}
              <Link
                href="/admin/collections/users"
                className="font-medium text-foreground underline underline-offset-4 transition-colors hover:text-primary"
              >
                admin dashboard
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export const metadata: Metadata = noindexMetadata({
  description: 'Sign in to your customer account—orders, addresses, and checkout in one place.',
  openGraph: mergeOpenGraph({
    title: 'Log in',
    url: '/login',
  }),
  title: 'Log in',
})
