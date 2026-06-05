'use client'

import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import React, { useEffect, useRef } from 'react'
import { toast } from 'sonner'

const OFFLINE_CART_KEY = 'offline-cart-backup'

type OfflineCartLine = {
  product: number
  quantity: number
  variant?: number
}

type OfflineCartBackup = {
  cartId?: number
  items: OfflineCartLine[]
  savedAt: string
}

function resolveRelationId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'object' && value !== null && 'id' in value) {
    const id = (value as { id: unknown }).id
    if (typeof id === 'number' && Number.isFinite(id)) return id
  }
  return null
}

export function PwaRegister() {
  const { addItem, cart, isLoading } = useCart()
  const restoringRef = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    void navigator.serviceWorker.register('/sw.js').catch(() => {})
  }, [])

  useEffect(() => {
    if (!cart?.items?.length) return
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const items: OfflineCartLine[] = cart.items
        .map((item) => {
          const product = resolveRelationId(item.product)
          const quantity = typeof item.quantity === 'number' ? item.quantity : 0
          if (product == null || quantity <= 0) return null
          const variant = resolveRelationId(item.variant)
          return {
            product,
            quantity,
            ...(variant != null ? { variant } : {}),
          }
        })
        .filter((line): line is OfflineCartLine => line != null)

      localStorage.setItem(
        OFFLINE_CART_KEY,
        JSON.stringify({
          cartId: cart.id,
          items,
          savedAt: new Date().toISOString(),
        } satisfies OfflineCartBackup),
      )
    }
  }, [cart])

  useEffect(() => {
    const restoreOfflineCart = async () => {
      if (restoringRef.current || isLoading) return

      const raw = localStorage.getItem(OFFLINE_CART_KEY)
      if (!raw) return

      let backup: OfflineCartBackup
      try {
        backup = JSON.parse(raw) as OfflineCartBackup
      } catch {
        localStorage.removeItem(OFFLINE_CART_KEY)
        return
      }

      if (!Array.isArray(backup.items) || !backup.items.length) {
        localStorage.removeItem(OFFLINE_CART_KEY)
        return
      }

      if (backup.cartId && cart?.id && backup.cartId !== cart.id) {
        localStorage.removeItem(OFFLINE_CART_KEY)
        return
      }

      restoringRef.current = true
      try {
        for (const line of backup.items) {
          for (let count = 0; count < line.quantity; count += 1) {
            await addItem({
              product: line.product,
              variant: line.variant,
            })
          }
        }
        toast.success('Your cart was restored after reconnecting.')
      } catch {
        toast.error('Could not fully restore your offline cart.')
      } finally {
        localStorage.removeItem(OFFLINE_CART_KEY)
        restoringRef.current = false
      }
    }

    const onOnline = () => {
      void restoreOfflineCart()
    }

    window.addEventListener('online', onOnline)
    if (navigator.onLine) {
      void restoreOfflineCart()
    }

    return () => window.removeEventListener('online', onOnline)
  }, [addItem, cart?.id, isLoading])

  return null
}
