'use client'

import { Media } from '@/components/Media'
import { Price } from '@/components/Price'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { FormFieldLabel } from '@/components/forms/FormFieldLabel'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/providers/Auth'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { queueStateUpdate } from '@/hooks/queueStateUpdate'
import React, { useCallback, useEffect, useRef, useState } from 'react'

import {
  useAddresses,
  useCart,
  useEcommerce,
  usePayments,
} from '@payloadcms/plugin-ecommerce/client/react'
import { CheckoutOrderDiscounts } from '@/components/checkout/CheckoutOrderDiscounts'
import { CheckoutOrderNotes } from '@/components/checkout/CheckoutOrderNotes'
import { CheckoutDeliveryPreferences } from '@/components/checkout/CheckoutDeliveryPreferences'
import { CheckoutAddresses } from '@/components/checkout/CheckoutAddresses'
import { CheckoutShipping } from '@/components/checkout/CheckoutShipping'
import { CreateAddressModal } from '@/components/addresses/CreateAddressModal'
import type { CheckoutShippingQuote } from '@/lib/shipping/cartShipmentQuote'
import { Address, Product, Variant } from '@/payload-types'
import { Checkbox } from '@/components/ui/checkbox'
import { AddressItem } from '@/components/addresses/AddressItem'
import { GuestPhoneField } from '@/components/forms/GuestPhoneField'
import { FormItem } from '@/components/forms/FormItem'
import { appToastError } from '@/utilities/appToast'
import { messageFromPayloadBody } from '@/utilities/messageFromPayloadResponse'
import { toast } from 'sonner'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import {
  cartRequiresGuestSecret,
  CHECKOUT_CART_ACCESS_ERROR,
  getCheckoutCartSecret,
  syncGuestCartSecretFromCart,
} from '@/lib/carts/guestCartSecret'
import { resolveCheckoutCartAccess } from '@/lib/carts/resolveCheckoutCartAccess'
import { resetCartAfterOrder } from '@/lib/carts/resetCartAfterOrder'
import {
  formatGuestPhoneDisplay,
  validateGuestPhone,
  type GuestPhoneCountry,
} from '@/lib/phone/guestPhoneCountries'
import {
  findAddressWithDistrict,
  resolveCheckoutDistrict,
} from '@/lib/addresses/checkoutDistrict'
import { loginEmailToContact, resolveCheckoutCustomerEmail } from '@/utilities/contactToLoginEmail'
import { ALREADY_CHECKED_OUT_MESSAGE } from '@/lib/payments/checkoutErrors'
import { withCheckoutSubmitTimeout } from '@/lib/payments/withSubmitTimeout'
import {
  Check,
  ChevronLeft,
  ClipboardList,
  Loader2,
  MapPin,
  ShoppingBag,
  Truck,
  UserRound,
} from 'lucide-react'
import { cn } from '@/utilities/cn'
import { CheckoutBeginBeacon } from '@/components/analytics/CheckoutBeginBeacon'
import { AddPaymentInfoBeacon } from '@/components/analytics/AddPaymentInfoBeacon'
import { SocialLoginButtons } from '@/components/auth/SocialLoginButtons'
import { SHOP_BASE_PATH } from '@/utilities/shopPath'

const checkoutSectionClass =
  'gap-0 overflow-hidden border-border/80 bg-card py-0 shadow-none sm:shadow-sm'

const checkoutInputClass =
  'h-12 px-4 text-base sm:h-10 sm:px-3 sm:text-sm'

const checkoutCardContentClass =
  'flex flex-col gap-7 px-4 pt-5 pb-8 sm:gap-6 sm:px-6 sm:pt-6'

const checkoutActionButtonClass =
  'w-full min-h-12 text-base sm:w-auto sm:min-h-10 sm:text-sm'

const checkoutInsetPanelClass =
  'rounded-xl border bg-muted/15 px-4 py-5 sm:px-5 sm:py-6'

type CheckoutStep = 1 | 2 | 3

const CHECKOUT_STEPS: { id: CheckoutStep; label: string; shortLabel: string }[] = [
  { id: 1, label: 'Contact', shortLabel: 'Contact' },
  { id: 2, label: 'Delivery address', shortLabel: 'Delivery' },
  { id: 3, label: 'Review & place order', shortLabel: 'Review' },
]

type CheckoutProgressProps = {
  contactComplete: boolean
  currentStep: CheckoutStep
  deliveryComplete: boolean
  onStepClick: (step: CheckoutStep) => void
}

const CheckoutProgress: React.FC<CheckoutProgressProps> = ({
  contactComplete,
  currentStep,
  deliveryComplete,
  onStepClick,
}) => {
  const isStepAccessible = (step: CheckoutStep): boolean => {
    if (step === 1) return true
    if (step === 2) return contactComplete
    return contactComplete && deliveryComplete
  }

  const isStepComplete = (step: CheckoutStep): boolean => {
    if (step === 1) return contactComplete
    if (step === 2) return deliveryComplete
    return false
  }

  return (
    <nav aria-label="Checkout progress" className="rounded-xl border bg-muted/20 p-3 sm:p-5">
      <ol className="flex items-center justify-between gap-1 sm:gap-2">
        {CHECKOUT_STEPS.map((step, index) => {
          const accessible = isStepAccessible(step.id)
          const complete = isStepComplete(step.id)
          const current = currentStep === step.id

          return (
            <li className="flex min-w-0 flex-1 items-center" key={step.id}>
              <button
                aria-current={current ? 'step' : undefined}
                className={cn(
                  'group flex min-w-0 flex-1 flex-col items-center gap-2 rounded-lg px-1 py-1 text-center transition-colors sm:flex-row sm:justify-center sm:gap-3 sm:px-2',
                  accessible ?
                    'cursor-pointer hover:bg-background/80'
                  : 'cursor-not-allowed opacity-50',
                )}
                disabled={!accessible}
                onClick={() => {
                  if (accessible) onStepClick(step.id)
                }}
                type="button"
              >
                <span
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums transition-colors',
                    complete && !current && 'bg-primary/15 text-primary',
                    current && 'bg-primary text-primary-foreground',
                    !complete && !current && 'border bg-background text-muted-foreground',
                  )}
                >
                  {complete && !current ?
                    <Check aria-hidden className="size-4" />
                  : step.id}
                </span>
                <span className="min-w-0">
                  <span
                    className={cn(
                      'block truncate text-xs font-semibold sm:text-sm',
                      current ? 'text-foreground' : 'text-muted-foreground',
                    )}
                  >
                    <span className="sm:hidden">{step.shortLabel}</span>
                    <span className="hidden sm:inline">{step.label}</span>
                  </span>
                </span>
              </button>
              {index < CHECKOUT_STEPS.length - 1 ?
                <div
                  aria-hidden
                  className={cn(
                    'mx-0.5 hidden h-px min-w-3 flex-1 sm:block',
                    isStepComplete(step.id) ? 'bg-primary/40' : 'bg-border',
                  )}
                />
              : null}
            </li>
          )
        })}
      </ol>
      <p className="mt-3 text-center text-xs text-muted-foreground sm:text-left">
        Step {currentStep} of {CHECKOUT_STEPS.length}
        {' — '}
        {CHECKOUT_STEPS.find((s) => s.id === currentStep)?.label}
      </p>
    </nav>
  )
}

type SectionHeaderProps = {
  description: string
  icon: React.ComponentType<{ 'aria-hidden'?: boolean; className?: string }>
  step: number
  title: string
}

const CheckoutSectionHeader: React.FC<SectionHeaderProps> = ({
  description,
  icon: Icon,
  step,
  title,
}) => (
  <CardHeader className="flex-row items-start gap-3 space-y-0 border-b bg-muted/30 px-4 pb-4 pt-5 sm:gap-4 sm:px-6 sm:pb-5 sm:pt-6">
    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold tabular-nums text-primary-foreground sm:h-9 sm:w-9">
      {step}
    </span>
    <div className="flex min-w-0 flex-1 gap-4">
      <div className="hidden size-11 shrink-0 items-center justify-center rounded-xl border bg-background shadow-sm sm:flex">
        <Icon aria-hidden className="size-5 text-primary" />
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <CardTitle className="text-lg font-semibold tracking-tight sm:text-xl">{title}</CardTitle>
        <CardDescription className="text-pretty text-sm leading-relaxed">{description}</CardDescription>
      </div>
    </div>
  </CardHeader>
)

export const CheckoutPage: React.FC = () => {
  const { user } = useAuth()
  const router = useRouter()
  const { cart, refreshCart } = useCart()
  const { clearSession, user: ecommerceUser } = useEcommerce()
  const [paymentFailed, setPaymentFailed] = useState(false)
  const [guestFullName, setGuestFullName] = useState('')
  const [guestPhoneCountry, setGuestPhoneCountry] = useState<GuestPhoneCountry>('BD')
  const [guestPhoneNational, setGuestPhoneNational] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [guestPhoneError, setGuestPhoneError] = useState<string | null>(null)
  const [guestContactEditable, setGuestContactEditable] = useState(true)
  const { confirmOrder, initiatePayment } = usePayments()
  const { addresses } = useAddresses()
  const [shippingAddress, setShippingAddress] = useState<Partial<Address>>()
  const [billingAddress, setBillingAddress] = useState<Partial<Address>>()
  const [billingAddressSameAsShipping, setBillingAddressSameAsShipping] = useState(true)
  const [isProcessingPayment, setProcessingPayment] = useState(false)
  const [orderRedirecting, setOrderRedirecting] = useState(false)
  const [deliveryType, setDeliveryType] = useState<'point' | 'home'>('home')
  const [shippingQuote, setShippingQuote] = useState<CheckoutShippingQuote | null>(null)
  const [shippingQuoteLoading, setShippingQuoteLoading] = useState(false)
  const [inventoryError, setInventoryError] = useState<string | null>(null)
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>(1)
  const billingPrefillDone = useRef(false)
  const submitInFlight = useRef(false)
  const inventoryReservedRef = useRef(false)

  useEffect(() => {
    if (!cart?.id || inventoryReservedRef.current) return
    inventoryReservedRef.current = true
    void fetch('/api/checkout/reserve-inventory', {
      body: JSON.stringify({ cartId: cart.id }),
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    }).catch(() => {})
  }, [cart?.id])

  const cartIsEmpty = !cart || !cart.items || !cart.items.length
  const userContact = user ? user.phone || loginEmailToContact(user.email) : ''

  const summaryBundleDiscount =
    !cartIsEmpty && cart && typeof cart.bundleDiscountAmount === 'number' ?
      cart.bundleDiscountAmount
    : 0
  const summaryPromoDiscount =
    !cartIsEmpty && cart && typeof cart.promoDiscountAmount === 'number' ?
      cart.promoDiscountAmount
    : 0
  const summaryLoyaltyDiscount =
    !cartIsEmpty && cart && typeof cart.loyaltyDiscountAmount === 'number' ?
      cart.loyaltyDiscountAmount
    : 0
  const summaryGiftCardDiscount =
    !cartIsEmpty && cart && typeof cart.giftCardDiscountAmount === 'number' ?
      cart.giftCardDiscountAmount
    : 0
  const summaryTotalDiscount =
    summaryBundleDiscount +
    summaryPromoDiscount +
    summaryLoyaltyDiscount +
    summaryGiftCardDiscount
  const summaryMerchandiseGross =
    !cartIsEmpty && cart && typeof cart.subtotal === 'number' ?
      cart.subtotal + summaryTotalDiscount
    : 0
  const summaryHasDiscounts = summaryTotalDiscount > 0

  const districtForQuote = resolveCheckoutDistrict({
    billingAddress,
    billingAddressSameAsShipping,
    shippingAddress,
  })

  const cartLineFingerprint = JSON.stringify(
    cart?.items?.map((item) => ({
      p: typeof item.product === 'object' && item.product ? item.product.id : item.product,
      q: item.quantity,
      v: item.variant && typeof item.variant === 'object' ? item.variant.id : item.variant,
    })) ?? [],
  )

  const guestContactConfirmed = Boolean(
    guestFullName.trim() && guestPhone.trim() && !guestContactEditable && !guestPhoneError,
  )

  const confirmGuestContact = useCallback((): boolean => {
    const phoneResult = validateGuestPhone(guestPhoneCountry, guestPhoneNational)
    if (!phoneResult.ok) {
      setGuestPhoneError(phoneResult.message)
      return false
    }

    if (!guestFullName.trim()) {
      return false
    }

    setGuestPhone(phoneResult.normalized)
    setGuestPhoneNational(phoneResult.national)
    setGuestPhoneError(null)
    setGuestContactEditable(false)
    return true
  }, [guestFullName, guestPhoneCountry, guestPhoneNational])

  const contactStepComplete = Boolean(user) || guestContactConfirmed

  const shippingQuoteReady = shippingQuote?.ok === true

  const checkoutCustomerEmail = resolveCheckoutCustomerEmail({
    guestPhone: guestPhone.trim() || undefined,
    user,
  })

  const checkoutCartSecret = getCheckoutCartSecret(cart)
  const checkoutNeedsCartSecret = cartRequiresGuestSecret({
    cart,
    userId: user?.id,
  })
  const checkoutCartAccessible = !checkoutNeedsCartSecret || Boolean(checkoutCartSecret)

  const hasDeliveryAddress = Boolean(
    billingAddress &&
      districtForQuote.length > 0 &&
      (user ? billingAddressSameAsShipping || shippingAddress : true),
  )

  const deliveryStepComplete = Boolean(
    hasDeliveryAddress &&
      !inventoryError &&
      shippingQuoteReady &&
      !shippingQuoteLoading,
  )
  const payableGrandTotal = shippingQuote?.ok ? shippingQuote.grandTotalBdt : (cart?.subtotal ?? 0)

  const ecommerceSessionReady = !user?.id || ecommerceUser?.id === user.id

  const canSubmitOrder = Boolean(
    cart?.id &&
    (user || guestContactConfirmed) &&
    checkoutCustomerEmail &&
    ecommerceSessionReady &&
    checkoutCartAccessible &&
    billingAddress &&
    (billingAddressSameAsShipping || shippingAddress) &&
    districtForQuote.length > 0 &&
    shippingQuoteReady &&
    !shippingQuoteLoading,
  )

  useEffect(() => {
    if (user) {
      queueStateUpdate(() => setCheckoutStep((step) => (step === 1 ? 2 : step)))
    }
  }, [user])

  // Prefill billing once when saved addresses load (logged-in checkout).
  useEffect(() => {
    if (billingPrefillDone.current || billingAddress || !addresses?.length) {
      return
    }

    const preferred = findAddressWithDistrict(addresses)
    if (preferred) {
      queueStateUpdate(() => setBillingAddress(preferred))
      billingPrefillDone.current = true
    }
  }, [addresses, billingAddress])

  useEffect(() => {
    if (!user?.id || ecommerceUser?.id !== user.id) {
      return
    }

    if (cartRequiresGuestSecret({ cart, userId: user.id })) {
      return
    }

    void refreshCart()
  }, [cart, ecommerceUser?.id, refreshCart, user?.id])

  useEffect(() => {
    syncGuestCartSecretFromCart(cart)
  }, [cart])

  useEffect(() => {
    let cancelled = false
    async function runShippingQuote() {
      if (!cart?.id || !districtForQuote || cartIsEmpty) {
        if (!cancelled) {
          setShippingQuote(null)
          setShippingQuoteLoading(false)
        }
        return
      }

      // Wait for EcommerceProvider session before deciding cart access (avoids false guest-cart errors).
      if (user?.id && ecommerceUser?.id !== user.id) {
        if (!cancelled) {
          setShippingQuoteLoading(true)
        }
        return
      }

      const { cartSecret, needsCartSecret } = await resolveCheckoutCartAccess({
        cart,
        refreshCart,
        userId: user?.id,
      })

      if (needsCartSecret && !cartSecret) {
        if (!cancelled) {
          setShippingQuote(null)
          setShippingQuoteLoading(false)
          appToastError(CHECKOUT_CART_ACCESS_ERROR)
        }
        return
      }

      setShippingQuoteLoading(true)

      try {

        const payload: Record<string, unknown> = {
          cartID: cart.id,
          deliveryType,
          district: districtForQuote,
        }

        if (cartSecret) {
          payload.secret = cartSecret
        }

        const response = await fetch('/api/checkout/shipping-quote', {
          body: JSON.stringify(payload),
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        })

        const body = (await response.json().catch(() => ({}))) as {
          cause?: { code?: string }
          error?: string
          quote?: CheckoutShippingQuote
        }

        if (cancelled) {
          return
        }

        if (!response.ok) {
          setShippingQuote(null)
          const outOfStock = body.cause?.code === 'OutOfStock'
          const message =
            typeof body.error === 'string' ? body.error : 'Unable to quote shipping.'
          if (outOfStock) {
            setInventoryError(message)
          } else {
            setInventoryError(null)
          }
          appToastError(message)
          return
        }

        setInventoryError(null)

        const q = body.quote
        if (!q) {
          setShippingQuote(null)
          appToastError('Invalid shipping quote response.')
          return
        }

        setShippingQuote(q)
        if (!q.ok) {
          appToastError(q.message)
        }
      } catch {
        if (!cancelled) {
          setShippingQuote(null)
          appToastError('Unable to quote shipping.')
        }
      } finally {
        if (!cancelled) {
          setShippingQuoteLoading(false)
        }
      }
    }

    void runShippingQuote()

    return () => {
      cancelled = true
    }
  }, [
    cart?.customer,
    cart?.id,
    cart?.secret,
    cart?.subtotal,
    cartIsEmpty,
    cartLineFingerprint,
    checkoutCartSecret,
    checkoutNeedsCartSecret,
    deliveryType,
    districtForQuote,
    ecommerceUser?.id,
    refreshCart,
    user,
  ])

  useEffect(() => {
    return () => {
      setShippingAddress(undefined)
      setBillingAddress(undefined)
      setBillingAddressSameAsShipping(true)
      setGuestFullName('')
      setGuestPhoneCountry('BD')
      setGuestPhoneNational('')
      setGuestPhone('')
      setGuestPhoneError(null)
      setGuestContactEditable(true)
      setShippingQuote(null)
      setDeliveryType('home')
    }
  }, [])

  const redirectToOrder = useCallback(
    async (orderID: number, accessToken?: string) => {
      resetCartAfterOrder({ clearSession })

      const queryParams = new URLSearchParams()
      if (!user && accessToken) {
        queryParams.set('accessToken', accessToken)
      }
      const queryString = queryParams.toString()
      setProcessingPayment(false)
      setOrderRedirecting(true)
      router.replace(`/orders/${orderID}${queryString ? `?${queryString}` : ''}`)
    },
    [clearSession, router, user],
  )

  const submitCashOnDeliveryOrder = useCallback(async () => {
    if (submitInFlight.current) {
      return
    }
    submitInFlight.current = true
    setPaymentFailed(false)
    setProcessingPayment(true)

    try {
      await withCheckoutSubmitTimeout((async () => {
      const trimmedGuestFullName = guestFullName.trim()
      const trimmedGuestPhone = guestPhone.trim()
      const customerEmail = resolveCheckoutCustomerEmail({
        guestPhone: trimmedGuestPhone || undefined,
        user,
      })

      if (!customerEmail) {
        throw new Error('A customer email is required to make a purchase.')
      }

      if (user?.id && ecommerceUser?.id !== user.id) {
        throw new Error('Your session is still loading. Wait a moment and try again.')
      }

      const { cartSecret, needsCartSecret } = await resolveCheckoutCartAccess({
        cart,
        refreshCart,
        userId: user?.id,
      })
      if (needsCartSecret && !cartSecret) {
        throw new Error(CHECKOUT_CART_ACCESS_ERROR)
      }

      const shippingAddressForOrder = billingAddressSameAsShipping
        ? billingAddress
        : shippingAddress

      if (!shippingAddressForOrder?.district?.trim()) {
        throw new Error('Delivery address with district is required to place your order.')
      }
      const initiatedPayment = (await initiatePayment('cash-on-delivery', {
        additionalData: {
          customerEmail,
          ...(cartSecret ? { secret: cartSecret } : {}),
          ...(trimmedGuestFullName ? { customerFullName: trimmedGuestFullName } : {}),
          ...(trimmedGuestPhone ? { customerPhone: trimmedGuestPhone } : {}),
          billingAddress,
          deliveryType,
          shippingAddress: shippingAddressForOrder,
        },
      })) as Record<string, unknown>

      const transactionID = initiatedPayment?.transactionID
      const cartID = initiatedPayment?.cartID

      const confirmResult = (await confirmOrder('cash-on-delivery', {
        additionalData: {
          ...(transactionID ? { transactionID } : {}),
          ...(cartID ? { cartID } : {}),
          customerEmail,
          ...(cartSecret ? { secret: cartSecret } : {}),
          ...(trimmedGuestFullName ? { customerFullName: trimmedGuestFullName } : {}),
          ...(trimmedGuestPhone ? { customerPhone: trimmedGuestPhone } : {}),
          deliveryType,
          shippingAddress: shippingAddressForOrder,
        },
      })) as Record<string, unknown>

      const orderID = confirmResult?.orderID
      if (orderID == null || orderID === '') {
        throw new Error('Unable to confirm the cash on delivery order.')
      }

      const relatedRaw = confirmResult.relatedOrderIDs
      const relatedIds = Array.isArray(relatedRaw) ?
        relatedRaw.filter((id): id is number => typeof id === 'number')
      : []

      if (relatedIds.length > 0) {
        toast.message(
          `Multiple orders (${relatedIds.length + 1}) — one per shipment profile. IDs: ${[orderID, ...relatedIds].join(', ')}.`,
        )
      }

      const accessToken =
        typeof confirmResult.accessToken === 'string' ? confirmResult.accessToken : undefined
      await redirectToOrder(Number(orderID), accessToken)
      })())
    } catch (error) {
      const errorData = error instanceof Error ? parseCheckoutError(error.message) : {}
      let errorMessage = 'An error occurred while placing your order.'

      if (errorData?.cause?.code === 'OutOfStock') {
        errorMessage =
          typeof errorData.message === 'string' && errorData.message ?
            errorData.message
          : 'One or more items in your cart are out of stock.'
        setInventoryError(errorMessage)
      } else if (error instanceof Error && error.message.includes('out of stock')) {
        errorMessage = error.message
        setInventoryError(errorMessage)
      } else if (typeof errorData.message === 'string' && errorData.message) {
        errorMessage = errorData.message
      } else if (error instanceof Error && error.message) {
        errorMessage = error.message
      }

      if (errorMessage === ALREADY_CHECKED_OUT_MESSAGE) {
        const recoveredOrderID =
          typeof errorData.orderID === 'number' && Number.isFinite(errorData.orderID) ?
            errorData.orderID
          : null
        if (recoveredOrderID) {
          toast.message('This order was already placed. Opening your order…')
          await redirectToOrder(recoveredOrderID, errorData.accessToken)
          return
        }
        resetCartAfterOrder({ clearSession })
        errorMessage =
          'This cart was already used for an order. Add items again to start a new checkout.'
      }

      appToastError(errorMessage)
      setPaymentFailed(true)
      setOrderRedirecting(false)
    } finally {
      submitInFlight.current = false
      setProcessingPayment(false)
    }
  }, [
    billingAddress,
    billingAddressSameAsShipping,
    cart,
    confirmOrder,
    clearSession,
    deliveryType,
    ecommerceUser?.id,
    guestFullName,
    guestPhone,
    initiatePayment,
    refreshCart,
    redirectToOrder,
    router,
    shippingAddress,
    user,
  ])

  if (orderRedirecting) {
    return (
      <Card
        className={cn(checkoutSectionClass, 'mx-auto max-w-md border-none py-12 text-center shadow-md')}
      >
        <CardContent className="flex flex-col items-center gap-6 px-8 pb-12 pt-10">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
            <Loader2 aria-hidden className="size-8 animate-spin text-primary" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-semibold tracking-tight">Order confirmed</p>
            <p className="text-sm text-muted-foreground">Taking you to your order details…</p>
          </div>
          <LoadingSpinner />
        </CardContent>
      </Card>
    )
  }

  if (cartIsEmpty) {
    return (
      <Card
        className={cn(checkoutSectionClass, 'mx-auto max-w-lg border-none py-14 text-center shadow-md')}
      >
        <CardContent className="flex flex-col items-center gap-6 px-8 pb-14 pt-8">
          <div className="flex size-20 items-center justify-center rounded-full bg-muted">
            <ShoppingBag aria-hidden className="size-10 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold tracking-tight">Your cart is empty</h2>
            <p className="text-pretty text-sm text-muted-foreground">
              Add something you love—we will bring you back here when you are ready to pay.
            </p>
          </div>
          <Button asChild className="mt-2 min-w-40" size="lg">
            <Link href={SHOP_BASE_PATH}>Browse products</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex grow flex-col items-stretch justify-stretch gap-6 sm:gap-8 lg:my-4 lg:flex-row lg:gap-10 xl:gap-12">
      <CheckoutBeginBeacon />
      <AddPaymentInfoBeacon active={checkoutStep === 3} />
      <div className="flex min-w-0 basis-full flex-col gap-5 sm:gap-8 lg:basis-[62%]">
        <CheckoutProgress
          contactComplete={contactStepComplete}
          currentStep={checkoutStep}
          deliveryComplete={deliveryStepComplete}
          onStepClick={setCheckoutStep}
        />

        {checkoutStep === 1 ?
          <Card className={checkoutSectionClass}>
            <CheckoutSectionHeader
              description="Save time next time—sign in, or finish as a guest."
              icon={UserRound}
              step={1}
              title="Contact"
            />
            <CardContent className={checkoutCardContentClass}>
              {!user && (
                <div className="flex flex-col gap-5 sm:gap-4">
                  <SocialLoginButtons redirect="/checkout" />
                  <div className="flex flex-col gap-4 rounded-xl border border-dashed bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Already have an account?</p>
                      <p className="text-xs text-muted-foreground">
                        Use saved addresses and checkout faster.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button asChild size="sm" variant="default">
                        <Link href="/login?redirect=%2Fcheckout">Log in</Link>
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <Link href="/create-account?redirect=%2Fcheckout">Create account</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              {user ?
                <div className={checkoutInsetPanelClass}>
                  <p className="font-medium">{userContact}</p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Not you?{' '}
                    <Link
                      className="font-medium text-foreground underline underline-offset-4 hover:no-underline"
                      href="/logout"
                    >
                      Log out
                    </Link>
                  </p>
                </div>
              : guestContactConfirmed && !guestContactEditable ?
                <div className={checkoutInsetPanelClass}>
                  <p className="font-medium">{guestFullName.trim()}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatGuestPhoneDisplay(guestPhoneCountry, guestPhone)}
                  </p>
                  <Button
                    className="mt-4"
                    onClick={(e) => {
                      e.preventDefault()
                      setGuestContactEditable(true)
                    }}
                    size="sm"
                    variant="outline"
                  >
                    Edit contact
                  </Button>
                </div>
              : <div className={checkoutInsetPanelClass}>
                  <p className="mb-5 text-sm leading-relaxed text-muted-foreground sm:mb-6">
                    Enter your full name and phone number to continue as a guest.
                  </p>

                  <FormItem className="mb-5 gap-3 sm:mb-6">
                    <FormFieldLabel className="text-base sm:text-sm" htmlFor="guestFullName">
                      Full name
                    </FormFieldLabel>
                    <Input
                      autoComplete="name"
                      className={checkoutInputClass}
                      disabled={!guestContactEditable}
                      id="guestFullName"
                      name="guestFullName"
                      onChange={(e) => setGuestFullName(e.target.value)}
                      required
                      type="text"
                      value={guestFullName}
                    />
                  </FormItem>

                <div className="mb-5 sm:mb-6">
                  <GuestPhoneField
                    country={guestPhoneCountry}
                    disabled={!guestContactEditable}
                    error={guestPhoneError}
                    onCountryChange={(country) => {
                      setGuestPhoneCountry(country)
                      setGuestPhoneError(null)
                    }}
                    onValueChange={(value) => {
                      setGuestPhoneNational(value)
                      setGuestPhoneError(null)
                    }}
                    value={guestPhoneNational}
                  />
                </div>

                <Button
                  className={checkoutActionButtonClass}
                  disabled={
                    !guestFullName.trim() || !guestPhoneNational.trim() || !guestContactEditable
                  }
                  onClick={(e) => {
                    e.preventDefault()
                    if (!confirmGuestContact()) {
                      return
                    }
                    setCheckoutStep(2)
                  }}
                  size="lg"
                  variant="default"
                >
                  Continue as guest
                </Button>
                </div>
              }

              {contactStepComplete ?
                <div className="flex justify-stretch border-t pt-6 sm:justify-end">
                  <Button
                    className={checkoutActionButtonClass}
                    onClick={() => setCheckoutStep(2)}
                    size="lg"
                  >
                    Continue to delivery
                  </Button>
                </div>
              : null}
            </CardContent>
          </Card>
        : null}

        {checkoutStep === 2 ?
          <Card className={checkoutSectionClass}>
            <CheckoutSectionHeader
              description="We use this to prepare delivery and invoicing."
              icon={MapPin}
              step={2}
              title="Delivery address"
            />
            <CardContent className={checkoutCardContentClass}>
            {billingAddress ? (
              <AddressItem
                actions={
                  <Button
                    disabled={isProcessingPayment}
                    onClick={(e) => {
                      e.preventDefault()
                      setBillingAddress(undefined)
                    }}
                    variant="outline"
                  >
                    Change
                  </Button>
                }
                address={billingAddress}
              />
            ) : user ? (
              <CheckoutAddresses heading="Billing address" setAddress={setBillingAddress} />
            ) : (
              <CreateAddressModal
                buttonText="Add Address"
                callback={(address) => {
                  setBillingAddress(address)
                }}
                comfortableForm
                disabled={!guestContactConfirmed}
                modalTitle="Delivery address"
                skipSubmission={true}
                triggerClassName={checkoutActionButtonClass}
              />
            )}

            {user ?
              <div
                className={cn(
                  'flex items-start gap-3 rounded-xl border px-4 py-3.5 transition-colors',
                  billingAddressSameAsShipping && 'border-primary/20 bg-primary/4',
                )}
              >
                <Checkbox
                  checked={billingAddressSameAsShipping}
                  className="mt-1"
                  disabled={Boolean(isProcessingPayment)}
                  id="shippingTheSameAsBilling"
                  onCheckedChange={(state) => {
                    setBillingAddressSameAsShipping(state as boolean)
                  }}
                />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <Label
                    className="flex cursor-pointer items-center gap-2 text-base font-medium leading-snug"
                    htmlFor="shippingTheSameAsBilling"
                  >
                    <Truck aria-hidden className="size-4 shrink-0 text-primary" />
                    Shipping same as billing
                  </Label>
                  <span className="text-sm text-muted-foreground">
                    Uncheck if your package should go somewhere else.
                  </span>
                </div>
              </div>
            : null}

            {user && !billingAddressSameAsShipping ?
              <>
                {shippingAddress ?
                  <AddressItem
                    actions={
                      <Button
                        disabled={isProcessingPayment}
                        onClick={(e) => {
                          e.preventDefault()
                          setShippingAddress(undefined)
                        }}
                        variant="outline"
                      >
                        Change
                      </Button>
                    }
                    address={shippingAddress}
                  />
                : <CheckoutAddresses
                    description="Please select where we should ship this order."
                    heading="Shipping address"
                    setAddress={setShippingAddress}
                  />
                }
              </>
            : null}

            {billingAddress ?
              <>
                <CheckoutShipping
                  deliveryType={deliveryType}
                  disabled={isProcessingPayment || (!user && !guestContactConfirmed)}
                  hasDistrict={districtForQuote.length > 0}
                  loading={shippingQuoteLoading}
                  onDeliveryTypeChange={setDeliveryType}
                  quote={shippingQuote}
                />
                {cart?.id ?
                  <CheckoutDeliveryPreferences cartId={cart.id} />
                : null}
              </>
            : null}

            {inventoryError ?
              <p
                className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                role="alert"
              >
                {inventoryError}
              </p>
            : null}

              <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  className={checkoutActionButtonClass}
                  onClick={() => setCheckoutStep(1)}
                  size="lg"
                  variant="outline"
                >
                  <ChevronLeft aria-hidden className="mr-1 size-4" />
                  Back to contact
                </Button>
                <Button
                  className={cn(checkoutActionButtonClass, 'sm:min-w-48')}
                  disabled={!deliveryStepComplete}
                  onClick={() => setCheckoutStep(3)}
                  size="lg"
                >
                  Continue to review
                </Button>
              </div>
            </CardContent>
          </Card>
        : null}

        {checkoutStep === 3 ?
          <Card className={checkoutSectionClass}>
            <CheckoutSectionHeader
              description="Pay on delivery—we will confirm your order right away."
              icon={ClipboardList}
              step={3}
              title="Review & place order"
            />
            <CardContent className={checkoutCardContentClass}>
              <div className="space-y-4">
                <div className={checkoutInsetPanelClass}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Contact
                      </p>
                      <p className="mt-2 font-medium">
                        {user ? userContact : guestFullName.trim()}
                      </p>
                      {!user && guestPhone.trim() ?
                        <p className="text-sm text-muted-foreground">
                          {formatGuestPhoneDisplay(guestPhoneCountry, guestPhone)}
                        </p>
                      : null}
                    </div>
                    <Button
                      onClick={() => setCheckoutStep(1)}
                      size="sm"
                      variant="ghost"
                    >
                      Edit
                    </Button>
                  </div>
                </div>

                <div className={checkoutInsetPanelClass}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Delivery
                      </p>
                      {billingAddress ?
                        <div className="mt-2 space-y-3">
                          <div>
                            <p className="text-sm font-medium text-foreground">Billing address</p>
                            <AddressItem address={billingAddress} hideActions />
                          </div>
                          {!billingAddressSameAsShipping && shippingAddress ?
                            <div>
                              <p className="text-sm font-medium text-foreground">Shipping address</p>
                              <AddressItem address={shippingAddress} hideActions />
                            </div>
                          : null}
                          <p className="text-sm text-muted-foreground">
                            {deliveryType === 'home' ? 'Home delivery' : 'Point delivery'}
                            {shippingQuote?.ok ?
                              <>
                                {' · '}
                                <Price
                                  amount={shippingQuote.totalShippingBdt}
                                  as="span"
                                  className="inline font-medium text-foreground"
                                />{' '}
                                shipping
                              </>
                            : null}
                          </p>
                        </div>
                      : <p className="mt-2 text-sm text-muted-foreground">No address selected.</p>}
                    </div>
                    <Button
                      onClick={() => setCheckoutStep(2)}
                      size="sm"
                      variant="ghost"
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  className={checkoutActionButtonClass}
                  onClick={() => setCheckoutStep(2)}
                  size="lg"
                  variant="outline"
                >
                  <ChevronLeft aria-hidden className="mr-1 size-4" />
                  Back to delivery
                </Button>
                <Button
                  className={cn(checkoutActionButtonClass, 'sm:min-w-48')}
                  disabled={!canSubmitOrder || isProcessingPayment}
                  onClick={(e) => {
                    e.preventDefault()
                    void submitCashOnDeliveryOrder()
                  }}
                  size="lg"
                >
                  {isProcessingPayment ?
                    <>
                      <Loader2 aria-hidden className="mr-2 size-5 animate-spin" />
                      Submitting…
                    </>
                  : 'Place order'}
                </Button>
              </div>

              {paymentFailed ?
                <div className="flex justify-end">
                  <Button
                    onClick={(e) => {
                      e.preventDefault()
                      setPaymentFailed(false)
                      router.refresh()
                    }}
                    variant="secondary"
                  >
                    Try again
                  </Button>
                </div>
              : null}
            </CardContent>
          </Card>
        : null}
      </div>

      {!cartIsEmpty && (
        <aside className="relative flex min-w-0 basis-full flex-col lg:sticky lg:top-28 lg:basis-[38%] lg:self-start">
          <Card
            className={cn(
              checkoutSectionClass,
              'gap-6 border-primary/15 bg-linear-to-b from-muted/40 via-card to-card py-6 shadow-md dark:from-muted/25',
            )}
          >
            <CardHeader className="border-b pb-6">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-background shadow-sm ring-1 ring-border/80">
                  <ShoppingBag aria-hidden className="size-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold tracking-tight">
                    Order summary
                  </CardTitle>
                  <CardDescription>Items and total for this checkout.</CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex flex-col gap-0 px-0">
              <ul className="max-h-[min(55vh,36rem)] shrink-0 overflow-y-auto px-6 py-2">
                {cart?.items?.map((item, index) => {
                  if (typeof item.product !== 'object' || !item.product) return null
                  const {
                    product,
                    product: { meta, title, gallery },
                    quantity,
                    variant,
                  } = item

                  if (!quantity) return null

                  let image = gallery?.[0]?.image || meta?.image
                  let price = product?.priceInBDT

                  const isVariant = Boolean(variant) && typeof variant === 'object'

                  if (isVariant) {
                    price = variant?.priceInBDT

                    const imageVariant = product.gallery?.find(
                      (gitem: NonNullable<Product['gallery']>[number]) => {
                        if (!gitem.variantOption) return false
                        const variantOptionID =
                          typeof gitem.variantOption === 'object'
                            ? gitem.variantOption.id
                            : gitem.variantOption

                        const hasMatch = variant?.options?.some(
                          (option: Variant['options'][number]) => {
                            if (typeof option === 'object') return option.id === variantOptionID
                            else return option === variantOptionID
                          },
                        )

                        return hasMatch
                      },
                    )

                    if (imageVariant && typeof imageVariant.image !== 'string') {
                      image = imageVariant.image
                    }
                  }

                  return (
                    <li
                      className="flex gap-4 border-b border-border/60 py-4 last:border-0 last:pb-0"
                      key={index}
                    >
                      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border bg-background shadow-inner">
                        {image && typeof image !== 'string' && (
                          <Media className="" fill imgClassName="object-cover" resource={image} />
                        )}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
                        <p className="line-clamp-2 font-semibold leading-snug">{title}</p>
                        {variant && typeof variant === 'object' && (
                          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            {variant.options
                              ?.map((option: Variant['options'][number]) => {
                                if (typeof option === 'object') return option.label
                                return null
                              })
                              .filter(Boolean)
                              .join(' · ')}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium tabular-nums">
                            ×{quantity}
                          </span>
                          {typeof price === 'number' && (
                            <Price className="text-sm font-semibold" amount={price} />
                          )}
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
              {cart?.id ?
                <>
                  <CheckoutOrderDiscounts cartId={cart.id} />
                  <CheckoutOrderNotes cartId={cart.id} />
                </>
              : null}
              <div className="shrink-0 border-t bg-muted/20 px-6 py-5">
                <div className="flex flex-col gap-3">
                  {cart ?
                    <>
                      {summaryHasDiscounts ?
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="text-muted-foreground">Merchandise</span>
                          <Price
                            amount={summaryMerchandiseGross}
                            as="span"
                            className="font-semibold tabular-nums text-foreground"
                          />
                        </div>
                      : null}
                      {summaryBundleDiscount > 0 ?
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="text-muted-foreground">Bundle savings</span>
                          <span className="inline-flex items-baseline gap-0.5 font-semibold tabular-nums text-emerald-700 dark:text-emerald-500">
                            <span aria-hidden>−</span>
                            <Price amount={summaryBundleDiscount} as="span" className="font-semibold" />
                          </span>
                        </div>
                      : null}
                      {summaryPromoDiscount > 0 && typeof cart.appliedPromoCode === 'string' ?
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="text-muted-foreground">
                            Promo ({cart.appliedPromoCode})
                          </span>
                          <span className="inline-flex items-baseline gap-0.5 font-semibold tabular-nums text-emerald-700 dark:text-emerald-500">
                            <span aria-hidden>−</span>
                            <Price amount={summaryPromoDiscount} as="span" className="font-semibold" />
                          </span>
                        </div>
                      : null}
                      {summaryLoyaltyDiscount > 0 ?
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="text-muted-foreground">Loyalty points</span>
                          <span className="inline-flex items-baseline gap-0.5 font-semibold tabular-nums text-emerald-700 dark:text-emerald-500">
                            <span aria-hidden>−</span>
                            <Price amount={summaryLoyaltyDiscount} as="span" className="font-semibold" />
                          </span>
                        </div>
                      : null}
                      {summaryGiftCardDiscount > 0 && typeof cart.appliedGiftCardCode === 'string' ?
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="text-muted-foreground">
                            Gift card ({cart.appliedGiftCardCode})
                          </span>
                          <span className="inline-flex items-baseline gap-0.5 font-semibold tabular-nums text-emerald-700 dark:text-emerald-500">
                            <span aria-hidden>−</span>
                            <Price amount={summaryGiftCardDiscount} as="span" className="font-semibold" />
                          </span>
                        </div>
                      : null}
                      {summaryHasDiscounts ?
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="text-muted-foreground">Merchandise after discounts</span>
                          <Price
                            amount={cart.subtotal ?? 0}
                            as="span"
                            className="font-semibold tabular-nums text-foreground"
                          />
                        </div>
                      : null}
                      {shippingQuote?.ok ?
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="text-muted-foreground">Shipping</span>
                          <Price
                            amount={shippingQuote.totalShippingBdt}
                            as="span"
                            className="font-semibold tabular-nums text-foreground"
                          />
                        </div>
                      : null}
                      <div className="flex items-center justify-between gap-3 border-t border-border/50 pt-3">
                        <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                          Total
                        </span>
                        <Price
                          amount={payableGrandTotal}
                          className="text-2xl font-bold tracking-tight"
                        />
                      </div>
                      {summaryHasDiscounts ?
                        <p className="text-xs font-medium text-emerald-700 dark:text-emerald-500">
                          You saved{' '}
                          <Price
                            amount={summaryTotalDiscount}
                            as="span"
                            className="inline font-semibold"
                          />{' '}
                          on this order.
                        </p>
                      : null}
                    </>
                  : null}
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  {shippingQuote?.ok ?
                    shippingQuote.orderCount > 1 ?
                      `Total includes shipping across ${shippingQuote.orderCount} orders (one per shipment profile).`
                    : 'Total includes quoted shipping.'
                  : 'Select address and delivery method to include shipping in the total.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </aside>
      )}
    </div>
  )
}

function parseCheckoutError(message: string): {
  accessToken?: string
  cause?: { code?: string }
  message?: string
  orderID?: number
} {
  const trimmed = message.trim()
  if (!trimmed) return {}

  const tryParse = (raw: string) => {
    try {
      const parsed = JSON.parse(raw) as {
        accessToken?: string
        cause?: { code?: string }
        errors?: { message?: string }[]
        message?: string
        orderID?: number
      }
      if (!parsed || typeof parsed !== 'object') {
        return null
      }

      const normalizedMessage = messageFromPayloadBody(parsed, parsed.message ?? trimmed)
      return {
        accessToken: parsed.accessToken,
        cause: parsed.cause,
        message: normalizedMessage,
        orderID: parsed.orderID,
      }
    } catch {
      return null
    }
  }

  const direct = tryParse(trimmed)
  if (direct) {
    return direct
  }

  const jsonStart = trimmed.indexOf('{')
  if (jsonStart >= 0) {
    const embedded = tryParse(trimmed.slice(jsonStart))
    if (embedded) {
      return embedded
    }
  }

  return { message: trimmed }
}
