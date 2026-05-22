'use client'

import { Button } from '@/components/ui/button'
import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { useRouter } from 'next/navigation'
import React, { useCallback, FormEvent } from 'react'
import { useCart, usePayments } from '@payloadcms/plugin-ecommerce/client/react'
import { Address } from '@/payload-types'
import { appToastError } from '@/utilities/appToast'

type Props = {
  customerEmail?: string
  billingAddress?: Partial<Address>
  shippingAddress?: Partial<Address>
  setProcessingPayment: React.Dispatch<React.SetStateAction<boolean>>
}

export const CheckoutForm: React.FC<Props> = ({
  customerEmail,
  billingAddress,
  setProcessingPayment,
}) => {
  const stripe = useStripe()
  const elements = useElements()
  const [isLoading, setIsLoading] = React.useState(false)
  const router = useRouter()
  const { clearCart } = useCart()
  const { confirmOrder } = usePayments()

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      setIsLoading(true)
      setProcessingPayment(true)

      if (stripe && elements) {
        try {
          const returnUrl = `${process.env.NEXT_PUBLIC_SERVER_URL}/checkout/confirm-order`

          const billingLine = [billingAddress?.district, billingAddress?.fullAddress]
            .filter(Boolean)
            .join(', ')

          const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
            confirmParams: {
              return_url: returnUrl,
              payment_method_data: {
                billing_details: {
                  email: customerEmail,
                  address: {
                    line1: billingLine || undefined,
                  },
                },
              },
            },
            elements,
            redirect: 'if_required',
          })

          if (paymentIntent && paymentIntent.status === 'succeeded') {
            try {
              const confirmResult = await confirmOrder('stripe', {
                additionalData: {
                  paymentIntentID: paymentIntent.id,
                  ...(customerEmail ? { customerEmail } : {}),
                },
              })

              if (
                confirmResult &&
                typeof confirmResult === 'object' &&
                'orderID' in confirmResult &&
                confirmResult.orderID
              ) {
                const accessToken =
                  'accessToken' in confirmResult ? (confirmResult.accessToken as string) : ''
                const queryParams = new URLSearchParams()

                if (accessToken) {
                  queryParams.set('accessToken', accessToken)
                }

                const queryString = queryParams.toString()
                const redirectUrl = `/orders/${confirmResult.orderID}${queryString ? `?${queryString}` : ''}`

                // Clear the cart after successful payment
                clearCart()

                // Redirect to order confirmation page
                router.push(redirectUrl)
              }
            } catch (err) {
              const msg = err instanceof Error ? err.message : 'Something went wrong.'
              appToastError(`Error while confirming order: ${msg}`)
              setIsLoading(false)
              setProcessingPayment(false)
            }
          }
          if (stripeError?.message) {
            appToastError(stripeError.message)
            setIsLoading(false)
            setProcessingPayment(false)
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Something went wrong.'
          appToastError(`Error while submitting payment: ${msg}`)
          setIsLoading(false)
          setProcessingPayment(false)
        }
      }
    },
    [
      setProcessingPayment,
      stripe,
      elements,
      customerEmail,
      billingAddress?.district,
      billingAddress?.fullAddress,
      confirmOrder,
      clearCart,
      router,
    ],
  )

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <div className="mt-8 flex gap-4">
        <Button disabled={!stripe || isLoading} type="submit" variant="default">
          {isLoading ? 'Loading...' : 'Pay now'}
        </Button>
      </div>
    </form>
  )
}
