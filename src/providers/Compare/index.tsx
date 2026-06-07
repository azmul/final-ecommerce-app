'use client'

import type { Product } from '@/payload-types'

import { queueStateUpdate } from '@/hooks/queueStateUpdate'
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { CLIENT_DATA_CLEARED_EVENT } from '@/utilities/clearBrowserClientData'
import { toast } from 'sonner'

export const MAX_COMPARE_PRODUCTS = 3

const STORAGE_KEY = 'ecommerce-compare-product-ids'

type CompareContextValue = {
  clear: () => void
  count: number
  isSelected: (productID: Product['id'] | undefined) => boolean
  remove: (productID: Product['id']) => void
  selectedIds: Product['id'][]
  toggle: (productID: Product['id']) => void
}

const CompareContext = createContext({} as CompareContextValue)

function normalizeIds(ids: unknown[]): Product['id'][] {
  const seen = new Set<string>()
  const out: Product['id'][] = []

  for (const raw of ids) {
    const n =
      typeof raw === 'number'
        ? raw
        : typeof raw === 'string' && raw.trim()
          ? Number.parseInt(raw.trim(), 10)
          : NaN
    if (!Number.isFinite(n)) continue
    const id = n as Product['id']
    const key = String(id)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(id)
    if (out.length >= MAX_COMPARE_PRODUCTS) break
  }

  return out
}

function readStoredIds(): Product['id'][] {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []

    return normalizeIds(parsed)
  } catch {
    return []
  }
}

function persistIds(ids: Product['id'][]) {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeIds(ids)))
}

export const CompareProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedIds, setSelectedIds] = useState<Product['id'][]>([])

  useEffect(() => {
    const initial = readStoredIds()
    queueStateUpdate(() => setSelectedIds(initial))
  }, [])

  useEffect(() => {
    const reset = () => setSelectedIds([])

    window.addEventListener(CLIENT_DATA_CLEARED_EVENT, reset)
    return () => window.removeEventListener(CLIENT_DATA_CLEARED_EVENT, reset)
  }, [])

  const toggle = useCallback((productID: Product['id']) => {
    setSelectedIds((prev) => {
      const isOn = prev.some((id) => String(id) === String(productID))

      if (isOn) {
        const next = prev.filter((id) => String(id) !== String(productID))
        persistIds(next)
        return next
      }

      if (prev.length >= MAX_COMPARE_PRODUCTS) {
        queueMicrotask(() =>
          toast.message(`You can compare up to ${MAX_COMPARE_PRODUCTS} products.`, {
            description: 'Remove one from compare first, then try again.',
          }),
        )
        return prev
      }

      const next = [...prev, productID]
      persistIds(next)
      return next
    })
  }, [])

  const remove = useCallback((productID: Product['id']) => {
    setSelectedIds((prev) => {
      const next = prev.filter((id) => String(id) !== String(productID))
      persistIds(next)
      return next
    })
  }, [])

  const clear = useCallback(() => {
    persistIds([])
    setSelectedIds([])
  }, [])

  const isSelected = useCallback(
    (productID: Product['id'] | undefined) => {
      if (productID === undefined || productID === null) return false
      return selectedIds.some((id) => String(id) === String(productID))
    },
    [selectedIds],
  )

  const value = useMemo(
    (): CompareContextValue => ({
      clear,
      count: selectedIds.length,
      isSelected,
      remove,
      selectedIds,
      toggle,
    }),
    [clear, isSelected, remove, selectedIds, toggle],
  )

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>
}

export const useCompare = () => useContext(CompareContext)
