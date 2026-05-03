'use client'

import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  LogIn,
  LogOut,
  ShoppingBag,
} from 'lucide-react'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/utilities/cn'
import { SHOP_BASE_PATH } from '@/utilities/shopPath'
import { useAuth } from '@/providers/Auth'

type Phase = 'loading' | 'success' | 'error'

export const LogoutPage: React.FC = () => {
  const { logout } = useAuth()
  const [phase, setPhase] = useState<Phase>('loading')

  useEffect(() => {
    const performLogout = async () => {
      try {
        await logout()
        setPhase('success')
      } catch {
        setPhase('error')
      }
    }

    void performLogout()
  }, [logout])

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {phase === 'loading' ? (
        <div
          className="relative flex flex-col items-center px-6 py-16 text-center sm:py-24"
          role="status"
          aria-live="polite"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-primary/6 blur-2xl"
          />
          <Loader2 aria-hidden className="relative mb-6 h-10 w-10 animate-spin text-primary" />
          <p className="relative text-lg font-medium tracking-tight text-foreground">Signing you out</p>
          <p className="relative mt-2 max-w-sm text-sm text-muted-foreground">
            Securely clearing your session. This only takes a moment.
          </p>
        </div>
      ) : phase === 'success' ? (
        <div className="relative px-6 py-10 sm:px-10 sm:py-12">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/5 blur-3xl"
          />
          <div className="relative flex flex-col items-center text-center">
            <div
              className={cn(
                'mb-6 flex h-14 w-14 items-center justify-center rounded-2xl',
                'bg-primary/10 text-primary',
              )}
            >
              <CheckCircle2 aria-hidden className="h-8 w-8" strokeWidth={1.75} />
            </div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              All set
            </p>
            <h1 className="mt-1 text-pretty font-serif text-3xl tracking-tight text-foreground">
              You&apos;re signed out
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
              Your session has ended on this device. You can keep browsing as a guest or sign back
              in whenever you&apos;re ready.
            </p>
            <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
              <Button asChild size="lg" className="gap-2 shadow-none">
                <Link href={SHOP_BASE_PATH}>
                  Continue shopping
                  <ShoppingBag aria-hidden className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="gap-2 shadow-none">
                <Link href="/login">
                  Log back in
                  <LogIn aria-hidden className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Back to home
              <ArrowRight aria-hidden className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="relative px-6 py-10 sm:px-10 sm:py-12">
          <div
            aria-hidden
            className="pointer-events-none absolute -left-24 bottom-0 h-48 w-48 rounded-full bg-warning/10 blur-3xl"
          />
          <div className="relative flex flex-col items-center text-center">
            <div
              className={cn(
                'mb-6 flex h-14 w-14 items-center justify-center rounded-2xl',
                'border border-warning/30 bg-warning/10 text-warning',
              )}
            >
              <LogOut aria-hidden className="h-7 w-7" strokeWidth={1.75} />
            </div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Heads up
            </p>
            <h1 className="mt-1 text-pretty font-serif text-3xl tracking-tight text-foreground">
              Couldn&apos;t finish sign-out
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
              Your session might already have ended, or something blocked the request. You can keep
              using the storefront; try signing out again later if anything still looks logged in.
            </p>
            <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
              <Button asChild size="lg" variant="default" className="gap-2 shadow-none">
                <Link href={SHOP_BASE_PATH}>
                  Continue shopping
                  <ShoppingBag aria-hidden className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="gap-2 shadow-none">
                <Link href="/login">Go to log in</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
