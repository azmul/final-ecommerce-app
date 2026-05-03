'use client'

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'

type CartSheetContextValue = {
  isOpen: boolean
  open: () => void
  close: () => void
  setOpen: (open: boolean) => void
}

const CartSheetContext = createContext<CartSheetContextValue | null>(null)

export function CartSheetProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setOpen] = useState(false)

  const open = useCallback(() => {
    setOpen(true)
  }, [])

  const close = useCallback(() => {
    setOpen(false)
  }, [])

  const value = useMemo(
    () => ({
      isOpen,
      open,
      close,
      setOpen,
    }),
    [isOpen, close, open],
  )

  return <CartSheetContext.Provider value={value}>{children}</CartSheetContext.Provider>
}

export function useCartSheet() {
  const ctx = useContext(CartSheetContext)
  if (!ctx) {
    throw new Error('useCartSheet must be used within CartSheetProvider')
  }
  return ctx
}
