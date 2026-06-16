'use client'

import type { Product } from '@/payload-types'

import { queueStateUpdate } from '@/hooks/queueStateUpdate'
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { useAuth } from '@/providers/Auth'
import { CLIENT_DATA_CLEARED_EVENT } from '@/utilities/clearBrowserClientData'
import { appToastError } from '@/utilities/appToast'
import { toast } from 'sonner'

export const MAX_COMPARE_PRODUCTS = 3

const STORAGE_KEY = 'ecommerce-compare-product-ids'

type CompareContextValue = {
  clear: () => void
  count: number
  isSelected: (productID: Product['id'] | undefined) => boolean
  remove: (productID: Product['id']) => Promise<void>
  selectedIds: Product['id'][]
  toggle: (productID: Product['id']) => Promise<void>
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

type CompareResponse = {
  productIds?: string[]
  error?: string
}

const parseCompareResponse = async (response: Response): Promise<CompareResponse> => {
  const data = (await response.json().catch(() => ({}))) as CompareResponse

  if (!response.ok) {
    throw new Error(data.error || 'Compare list request failed.')
  }

  return data
}

export const CompareProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { status, user } = useAuth()
  const [selectedIds, setSelectedIds] = useState<Product['id'][]>([])
  const mergedUserIDRef = useRef<string | null>(null)

  const isLoggedIn = status === 'loggedIn' && Boolean(user?.id)

  const applyIds = useCallback((ids: Product['id'][]) => {
    const next = normalizeIds(ids)
    setSelectedIds(next)
    if (!isLoggedIn) {
      persistIds(next)
    }
  }, [isLoggedIn])

  const refresh = useCallback(async () => {
    if (!isLoggedIn) {
      applyIds(readStoredIds())
      return
    }

    try {
      const response = await fetch('/api/compare', {
        credentials: 'include',
      })
      const data = await parseCompareResponse(response)
      applyIds((data.productIds ?? []).map((id) => Number(id)).filter(Number.isFinite))
    } catch (err) {
      appToastError(err, 'Unable to load compare list.')
    }
  }, [applyIds, isLoggedIn])

  const toggle = useCallback(
    async (productID: Product['id']) => {
      const isOn = selectedIds.some((id) => String(id) === String(productID))

      if (isOn) {
        const next = selectedIds.filter((id) => String(id) !== String(productID))
        applyIds(next)

        if (isLoggedIn) {
          try {
            const response = await fetch(
              `/api/compare?productId=${encodeURIComponent(String(productID))}`,
              { credentials: 'include', method: 'DELETE' },
            )
            const data = await parseCompareResponse(response)
            applyIds((data.productIds ?? []).map((id) => Number(id)).filter(Number.isFinite))
          } catch (err) {
            await refresh()
            appToastError(err, 'Unable to update compare list.')
          }
        }
        return
      }

      if (selectedIds.length >= MAX_COMPARE_PRODUCTS) {
        toast.message(`You can compare up to ${MAX_COMPARE_PRODUCTS} products.`, {
          description: 'Remove one from compare first, then try again.',
        })
        return
      }

      const optimistic = [...selectedIds, productID]
      applyIds(optimistic)

      if (!isLoggedIn) return

      try {
        const response = await fetch('/api/compare', {
          body: JSON.stringify({ productId: productID }),
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        })
        const data = await parseCompareResponse(response)
        applyIds((data.productIds ?? []).map((id) => Number(id)).filter(Number.isFinite))
      } catch (err) {
        await refresh()
        appToastError(err, 'Unable to update compare list.')
      }
    },
    [applyIds, isLoggedIn, refresh, selectedIds],
  )

  const remove = useCallback(
    async (productID: Product['id']) => {
      const next = selectedIds.filter((id) => String(id) !== String(productID))
      applyIds(next)

      if (!isLoggedIn) return

      try {
        const response = await fetch(
          `/api/compare?productId=${encodeURIComponent(String(productID))}`,
          { credentials: 'include', method: 'DELETE' },
        )
        const data = await parseCompareResponse(response)
        applyIds((data.productIds ?? []).map((id) => Number(id)).filter(Number.isFinite))
      } catch (err) {
        await refresh()
        appToastError(err, 'Unable to update compare list.')
      }
    },
    [applyIds, isLoggedIn, refresh, selectedIds],
  )

  const clear = useCallback(async () => {
    applyIds([])

    if (!isLoggedIn) return

    try {
      await fetch('/api/compare', {
        credentials: 'include',
        method: 'DELETE',
      })
    } catch (err) {
      appToastError(err, 'Unable to clear compare list.')
    }
  }, [applyIds, isLoggedIn])

  const isSelected = useCallback(
    (productID: Product['id'] | undefined) => {
      if (productID === undefined || productID === null) return false
      return selectedIds.some((id) => String(id) === String(productID))
    },
    [selectedIds],
  )

  useEffect(() => {
    queueStateUpdate(() => {
      void refresh()
    })
  }, [refresh])

  useEffect(() => {
    const reset = () => {
      mergedUserIDRef.current = null
      setSelectedIds([])
    }

    window.addEventListener(CLIENT_DATA_CLEARED_EVENT, reset)
    return () => window.removeEventListener(CLIENT_DATA_CLEARED_EVENT, reset)
  }, [])

  useEffect(() => {
    const userID = user?.id != null ? String(user.id) : null

    if (!isLoggedIn || !userID || mergedUserIDRef.current === userID) return

    const localIds = readStoredIds()
    if (!localIds.length) {
      mergedUserIDRef.current = userID
      return
    }

    mergedUserIDRef.current = userID

    const mergeLocalIds = async () => {
      try {
        await Promise.all(
          localIds.map((productId) =>
            fetch('/api/compare', {
              body: JSON.stringify({ productId }),
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              method: 'POST',
            }).then(parseCompareResponse),
          ),
        )
        persistIds([])
        await refresh()
      } catch (err) {
        appToastError(err, 'Unable to merge guest compare list.')
      }
    }

    void mergeLocalIds()
  }, [isLoggedIn, refresh, user?.id])

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
