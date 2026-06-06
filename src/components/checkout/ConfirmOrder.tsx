'use client'

import { LoadingSpinner } from '@/components/LoadingSpinner'
import { resetCartAfterOrder } from '@/lib/carts/resetCartAfterOrder'
import { useCart, useEcommerce, usePayments } from '@payloadcms/plugin-ecommerce/client/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef } from 'react'

export const ConfirmOrder: React.FC = () => {
  const { confirmOrder } = usePayments()
  const { cart } = useCart()
  const { clearSession } = useEcommerce()

  const searchParams = useSearchParams()
  const router = useRouter()
  // Ensure we only confirm the order once, even if the component re-renders
  const isConfirming = useRef(false)

  useEffect(() => {
    if (!cart || !cart.items || cart.items?.length === 0) {
      return
    }

    const paymentIntentID = searchParams.get('payment_intent')

    if (paymentIntentID) {
      if (!isConfirming.current) {
        isConfirming.current = true

        confirmOrder('stripe', {
          additionalData: {
            paymentIntentID,
          },
        }).then(async (result) => {
          if (result && typeof result === 'object' && 'orderID' in result && result.orderID) {
            resetCartAfterOrder({ clearSession })

            const accessToken = 'accessToken' in result ? (result.accessToken as string) : ''
            const queryParams = new URLSearchParams()

            if (accessToken) {
              queryParams.set('accessToken', accessToken)
            }

            const queryString = queryParams.toString()
            router.push(`/orders/${result.orderID}${queryString ? `?${queryString}` : ''}`)
          }
        })
      }
    } else {
      // If no payment intent ID is found, redirect to the home
      router.push('/')
    }
  }, [cart, clearSession, confirmOrder, router, searchParams])

  return (
    <div className="text-center w-full flex flex-col items-center justify-start gap-4">
      <h1 className="text-2xl">Confirming Order</h1>

      <LoadingSpinner className="w-12 h-6" />
    </div>
  )
}
