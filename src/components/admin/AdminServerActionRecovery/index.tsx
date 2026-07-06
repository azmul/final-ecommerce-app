'use client'

import React, { useEffect, type ReactNode } from 'react'

const RECOVERY_KEY_PREFIX = 'admin-server-action-recovery:'

function isMissingServerActionError(value: unknown): boolean {
  if (value instanceof Error) {
    return isMissingServerActionError(value.message)
  }

  if (typeof value !== 'string') return false

  return (
    value.includes('Failed to find Server Action') ||
    value.includes('This request might be from an older or newer deployment')
  )
}

function recoverFromMissingServerAction(): void {
  const key = `${RECOVERY_KEY_PREFIX}${window.location.pathname}`

  if (window.sessionStorage.getItem(key) === '1') return

  window.sessionStorage.setItem(key, '1')
  window.location.reload()
}

export function AdminServerActionRecovery({ children }: { children?: ReactNode }) {
  useEffect(() => {
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (isMissingServerActionError(event.reason)) {
        recoverFromMissingServerAction()
      }
    }

    const onError = (event: ErrorEvent) => {
      if (isMissingServerActionError(event.error) || isMissingServerActionError(event.message)) {
        recoverFromMissingServerAction()
      }
    }

    window.addEventListener('unhandledrejection', onUnhandledRejection)
    window.addEventListener('error', onError)

    return () => {
      window.removeEventListener('unhandledrejection', onUnhandledRejection)
      window.removeEventListener('error', onError)
    }
  }, [])

  return <>{children}</>
}
