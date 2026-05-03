'use client'

import type { Product } from '@/payload-types'

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

type WishlistProduct = Partial<Product> & { id: Product['id'] }

type WishlistResponse = {
  productIds?: string[]
  products?: WishlistProduct[]
}

type WishlistContext = {
  add: (product: WishlistProduct) => Promise<void>
  clear: () => Promise<void>
  count: number
  error: string | null
  isLoading: boolean
  isWishlisted: (productID: Product['id'] | undefined) => boolean
  items: WishlistProduct[]
  productIds: string[]
  refresh: () => Promise<void>
  remove: (productID: Product['id']) => Promise<void>
  toggle: (product: WishlistProduct) => Promise<boolean>
}

const LOCAL_STORAGE_KEY = 'payload-ecommerce-wishlist'

const Context = createContext({} as WishlistContext)

const getProductID = (productID: Product['id'] | undefined) => {
  return typeof productID === 'string' || typeof productID === 'number'
    ? String(productID)
    : undefined
}

const normalizeItems = (items: WishlistProduct[]) => {
  const seen = new Set<string>()

  return items.filter((item) => {
    const id = getProductID(item.id)
    if (!id || seen.has(id)) return false
    seen.add(id)
    return true
  })
}

const readLocalItems = (): WishlistProduct[] => {
  if (typeof window === 'undefined') return []

  try {
    const value = window.localStorage.getItem(LOCAL_STORAGE_KEY)
    if (!value) return []

    const parsed = JSON.parse(value)
    if (!Array.isArray(parsed)) return []

    return normalizeItems(parsed.filter((item) => Boolean(item?.id)))
  } catch {
    return []
  }
}

const writeLocalItems = (items: WishlistProduct[]) => {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(normalizeItems(items)))
}

const parseWishlistResponse = async (response: Response): Promise<WishlistResponse> => {
  const data = (await response.json().catch(() => ({}))) as WishlistResponse & { error?: string }

  if (!response.ok) {
    throw new Error(data.error || 'Wishlist request failed.')
  }

  return data
}

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { status, user } = useAuth()
  const [items, setItems] = useState<WishlistProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mergedUserIDRef = useRef<string | null>(null)

  const isLoggedIn = status === 'loggedIn' && Boolean(user?.id)

  const applyItems = useCallback((nextItems: WishlistProduct[]) => {
    setItems(normalizeItems(nextItems))
  }, [])

  const refresh = useCallback(async () => {
    setError(null)

    if (!isLoggedIn) {
      applyItems(readLocalItems())
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/wishlist', {
        credentials: 'include',
      })
      const data = await parseWishlistResponse(response)
      applyItems(data.products ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load wishlist.')
    } finally {
      setIsLoading(false)
    }
  }, [applyItems, isLoggedIn])

  const add = useCallback(
    async (product: WishlistProduct) => {
      const productID = getProductID(product.id)
      if (!productID) return

      const previousItems = items
      const nextItems = normalizeItems([...items, product])
      applyItems(nextItems)

      if (!isLoggedIn) {
        writeLocalItems(nextItems)
        return
      }

      try {
        const response = await fetch('/api/wishlist', {
          body: JSON.stringify({ productId: product.id }),
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
        })
        const data = await parseWishlistResponse(response)
        applyItems(data.products ?? nextItems)
        setError(null)
      } catch (err) {
        applyItems(previousItems)
        setError(err instanceof Error ? err.message : 'Unable to update wishlist.')
        throw err
      }
    },
    [applyItems, isLoggedIn, items],
  )

  const remove = useCallback(
    async (productID: Product['id']) => {
      const id = getProductID(productID)
      if (!id) return

      const previousItems = items
      const nextItems = items.filter((item) => getProductID(item.id) !== id)
      applyItems(nextItems)

      if (!isLoggedIn) {
        writeLocalItems(nextItems)
        return
      }

      try {
        const response = await fetch(`/api/wishlist?productId=${encodeURIComponent(id)}`, {
          credentials: 'include',
          method: 'DELETE',
        })
        const data = await parseWishlistResponse(response)
        applyItems(data.products ?? nextItems)
        setError(null)
      } catch (err) {
        applyItems(previousItems)
        setError(err instanceof Error ? err.message : 'Unable to update wishlist.')
        throw err
      }
    },
    [applyItems, isLoggedIn, items],
  )

  const clear = useCallback(async () => {
    const previousItems = items
    applyItems([])

    if (!isLoggedIn) {
      writeLocalItems([])
      return
    }

    try {
      const response = await fetch('/api/wishlist', {
        credentials: 'include',
        method: 'DELETE',
      })
      const data = await parseWishlistResponse(response)
      applyItems(data.products ?? [])
      setError(null)
    } catch (err) {
      applyItems(previousItems)
      setError(err instanceof Error ? err.message : 'Unable to clear wishlist.')
      throw err
    }
  }, [applyItems, isLoggedIn, items])

  const isWishlisted = useCallback(
    (productID: Product['id'] | undefined) => {
      const id = getProductID(productID)
      if (!id) return false

      return items.some((item) => getProductID(item.id) === id)
    },
    [items],
  )

  const toggle = useCallback(
    async (product: WishlistProduct) => {
      if (isWishlisted(product.id)) {
        await remove(product.id)
        return false
      }

      await add(product)
      return true
    },
    [add, isWishlisted, remove],
  )

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    const userID = getProductID(user?.id)

    if (!isLoggedIn || !userID || mergedUserIDRef.current === userID) return

    const localItems = readLocalItems()
    if (!localItems.length) {
      mergedUserIDRef.current = userID
      return
    }

    mergedUserIDRef.current = userID

    const mergeLocalItems = async () => {
      try {
        await Promise.all(
          localItems.map((item) =>
            fetch('/api/wishlist', {
              body: JSON.stringify({ productId: item.id }),
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
              },
              method: 'POST',
            }).then(parseWishlistResponse),
          ),
        )
        writeLocalItems([])
        await refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to merge guest wishlist.')
      }
    }

    void mergeLocalItems()
  }, [isLoggedIn, refresh, user?.id])

  const productIds = useMemo(
    () => items.map((item) => getProductID(item.id)).filter((id): id is string => Boolean(id)),
    [items],
  )

  return (
    <Context.Provider
      value={{
        add,
        clear,
        count: productIds.length,
        error,
        isLoading,
        isWishlisted,
        items,
        productIds,
        refresh,
        remove,
        toggle,
      }}
    >
      {children}
    </Context.Provider>
  )
}

export const useWishlist = () => useContext(Context)
