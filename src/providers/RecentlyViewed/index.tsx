'use client'

import type { Product } from '@/payload-types'
import { useAuth } from '@/providers/Auth'
import { CLIENT_DATA_CLEARED_EVENT } from '@/utilities/clearBrowserClientData'
import { queueStateUpdate } from '@/hooks/queueStateUpdate'
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const LOCAL_STORAGE_KEY = 'payload-recently-viewed'

type RecentlyViewedContext = {
  productIds: string[]
  recordView: (productId: number) => void
}

const Context = createContext({} as RecentlyViewedContext)

function readLocalIds(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : []
  } catch {
    return []
  }
}

function writeLocalIds(ids: string[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(ids.slice(0, 12)))
}

export const RecentlyViewedProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { status, user } = useAuth()
  const [productIds, setProductIds] = useState<string[]>([])

  const isLoggedIn = status === 'loggedIn' && Boolean(user?.id)

  const recordView = useCallback(
    (productId: number) => {
      const id = String(productId)
      setProductIds((prev) => {
        const next = [id, ...prev.filter((value) => value !== id)].slice(0, 12)
        writeLocalIds(next)
        return next
      })

      if (isLoggedIn) {
        void fetch('/api/recently-viewed', {
          body: JSON.stringify({ productId }),
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        }).catch(() => {})
      }
    },
    [isLoggedIn],
  )

  useEffect(() => {
    if (isLoggedIn) {
      void fetch('/api/recently-viewed', { credentials: 'include' })
        .then((res) => res.json())
        .then((body: { productIds?: number[] }) => {
          const remote = Array.isArray(body.productIds) ? body.productIds.map(String) : []
          const merged = [...remote, ...readLocalIds()]
          const unique = [...new Set(merged)].slice(0, 12)
          setProductIds(unique)
          writeLocalIds(unique)
        })
        .catch(() => setProductIds(readLocalIds()))
    } else {
      queueStateUpdate(() => setProductIds(readLocalIds()))
    }
  }, [isLoggedIn, user?.id])

  useEffect(() => {
    const reset = () => setProductIds([])

    window.addEventListener(CLIENT_DATA_CLEARED_EVENT, reset)
    return () => window.removeEventListener(CLIENT_DATA_CLEARED_EVENT, reset)
  }, [])

  const value = useMemo(() => ({ productIds, recordView }), [productIds, recordView])

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export const useRecentlyViewed = () => useContext(Context)

export type { Product }
