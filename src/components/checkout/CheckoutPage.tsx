'use client'

import { Media } from '@/components/Media'
import { Message } from '@/components/Message'
import { Price } from '@/components/Price'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/providers/Auth'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useCallback, useEffect, useState } from 'react'

import { useAddresses, useCart, usePayments } from '@payloadcms/plugin-ecommerce/client/react'
import { CheckoutPromoCode } from '@/components/checkout/CheckoutPromoCode'
import { CheckoutAddresses } from '@/components/checkout/CheckoutAddresses'
import { CheckoutShipping } from '@/components/checkout/CheckoutShipping'
import { CreateAddressModal } from '@/components/addresses/CreateAddressModal'
import type { CheckoutShippingQuote } from '@/lib/shipping/cartShipmentQuote'
import { Address, Product, Variant } from '@/payload-types'
import { Checkbox } from '@/components/ui/checkbox'
import { AddressItem } from '@/components/addresses/AddressItem'
import { FormItem } from '@/components/forms/FormItem'
import { toast } from 'sonner'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { contactToLoginEmail, loginEmailToContact } from '@/utilities/contactToLoginEmail'
import { Loader2, MapPin, ShoppingBag, Truck, UserRound } from 'lucide-react'
import { cn } from '@/utilities/cn'

const checkoutSectionClass =
  'gap-0 overflow-hidden border-border/80 bg-card py-0 shadow-none sm:shadow-sm'

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
  <CardHeader className="flex-row items-start gap-4 space-y-0 border-b bg-muted/30 pb-5 pt-6">
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold tabular-nums text-primary-foreground">
      {step}
    </span>
    <div className="flex min-w-0 flex-1 gap-4">
      <div className="hidden size-11 shrink-0 items-center justify-center rounded-xl border bg-background shadow-sm sm:flex">
        <Icon aria-hidden className="size-5 text-primary" />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <CardTitle className="text-xl font-semibold tracking-tight">{title}</CardTitle>
        <CardDescription className="text-pretty">{description}</CardDescription>
      </div>
    </div>
  </CardHeader>
)

export const CheckoutPage: React.FC = () => {
  const { user } = useAuth()
  const router = useRouter()
  const { cart, clearCart } = useCart()
  const [error, setError] = useState<null | string>(null)
  const [guestFullName, setGuestFullName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [guestContactEditable, setGuestContactEditable] = useState(true)
  const { confirmOrder, initiatePayment } = usePayments()
  const { addresses } = useAddresses()
  const [shippingAddress, setShippingAddress] = useState<Partial<Address>>()
  const [billingAddress, setBillingAddress] = useState<Partial<Address>>()
  const [billingAddressSameAsShipping, setBillingAddressSameAsShipping] = useState(true)
  const [isProcessingPayment, setProcessingPayment] = useState(false)
  const [deliveryType, setDeliveryType] = useState<'point' | 'home'>('home')
  const [shippingQuote, setShippingQuote] = useState<CheckoutShippingQuote | null>(null)
  const [shippingQuoteLoading, setShippingQuoteLoading] = useState(false)
  const [shippingQuoteFetchError, setShippingQuoteFetchError] = useState<string | null>(null)

  const cartIsEmpty = !cart || !cart.items || !cart.items.length
  const userContact = user ? user.phone || loginEmailToContact(user.email) : ''

  const summaryDiscount =
    !cartIsEmpty && cart && typeof cart.promoDiscountAmount === 'number' ? cart.promoDiscountAmount : 0
  const summarySubtotalBefore =
    !cartIsEmpty && cart && typeof cart.subtotalBeforeDiscount === 'number' ?
      cart.subtotalBeforeDiscount
    : !cartIsEmpty && cart && typeof cart.subtotal === 'number' ? cart.subtotal
    : 0
  const summaryHasPromo =
    Boolean(
      !cartIsEmpty &&
        cart &&
        summaryDiscount > 0 &&
        typeof cart.appliedPromoCode === 'string',
    )

  const shippingDestinationForDistrict = billingAddressSameAsShipping
    ? billingAddress
    : (shippingAddress ?? billingAddress)

  const districtForQuote =
    typeof shippingDestinationForDistrict?.district === 'string' ?
      shippingDestinationForDistrict.district.trim()
    : ''

  const cartLineFingerprint = JSON.stringify(
    cart?.items?.map((item) => ({
      p: typeof item.product === 'object' && item.product ? item.product.id : item.product,
      q: item.quantity,
      v: item.variant && typeof item.variant === 'object' ? item.variant.id : item.variant,
    })) ?? [],
  )

  const guestContactConfirmed = Boolean(
    guestFullName.trim() && guestPhone.trim() && !guestContactEditable,
  )

  const shippingQuoteReady = shippingQuote?.ok === true
  const payableGrandTotal = shippingQuote?.ok ? shippingQuote.grandTotalBdt : (cart?.subtotal ?? 0)

  const canSubmitOrder = Boolean(
    (user || guestContactConfirmed) &&
    billingAddress &&
    (billingAddressSameAsShipping || shippingAddress) &&
    districtForQuote.length > 0 &&
    shippingQuoteReady &&
    !shippingQuoteLoading,
  )

  // On initial load wait for addresses to be loaded and check to see if we can prefill a default one
  useEffect(() => {
    if (!shippingAddress) {
      if (addresses && addresses.length > 0) {
        const defaultAddress = addresses[0]
        if (defaultAddress) {
          setBillingAddress(defaultAddress)
        }
      }
    }
  }, [addresses])

  useEffect(() => {
    let cancelled = false
    async function runShippingQuote() {
      if (!cart?.id || !districtForQuote || cartIsEmpty) {
        if (!cancelled) {
          setShippingQuote(null)
          setShippingQuoteFetchError(null)
          setShippingQuoteLoading(false)
        }
        return
      }

      setShippingQuoteLoading(true)
      setShippingQuoteFetchError(null)

      try {
        const cartSecretField =
          typeof (cart as { secret?: string }).secret === 'string' ?
            (cart as { secret?: string }).secret
          : undefined

        const storageSecret =
          typeof window !== 'undefined' ? localStorage.getItem('cart_secret') : null

        const payload: Record<string, unknown> = {
          cartID: cart.id,
          deliveryType,
          district: districtForQuote,
        }

        if (cartSecretField) {
          payload.secret = cartSecretField
        } else if (storageSecret) {
          payload.secret = storageSecret
        }

        const response = await fetch('/api/checkout/shipping-quote', {
          body: JSON.stringify(payload),
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        })

        const body = (await response.json().catch(() => ({}))) as {
          error?: string
          quote?: CheckoutShippingQuote
        }

        if (cancelled) {
          return
        }

        if (!response.ok) {
          setShippingQuote(null)
          setShippingQuoteFetchError(
            typeof body.error === 'string' ? body.error : 'Unable to quote shipping.',
          )
          return
        }

        const q = body.quote
        if (!q) {
          setShippingQuote(null)
          setShippingQuoteFetchError('Invalid shipping quote response.')
          return
        }

        setShippingQuote(q)
        if (!q.ok) {
          setShippingQuoteFetchError(q.message)
        } else {
          setShippingQuoteFetchError(null)
        }
      } catch {
        if (!cancelled) {
          setShippingQuote(null)
          setShippingQuoteFetchError('Unable to quote shipping.')
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
    cart?.id,
    cart?.subtotal,
    cartIsEmpty,
    cartLineFingerprint,
    deliveryType,
    districtForQuote,
    user,
  ])

  useEffect(() => {
    return () => {
      setShippingAddress(undefined)
      setBillingAddress(undefined)
      setBillingAddressSameAsShipping(true)
      setGuestFullName('')
      setGuestPhone('')
      setGuestContactEditable(true)
      setShippingQuote(null)
      setShippingQuoteFetchError(null)
      setDeliveryType('home')
    }
  }, [])

  const submitCashOnDeliveryOrder = useCallback(async () => {
    setError(null)
    setProcessingPayment(true)

    try {
      const trimmedGuestFullName = guestFullName.trim()
      const trimmedGuestPhone = guestPhone.trim()
      const guestCustomerEmail = trimmedGuestPhone
        ? contactToLoginEmail(trimmedGuestPhone)
        : undefined
      const shippingAddressForOrder = billingAddressSameAsShipping
        ? billingAddress
        : shippingAddress
      const initiatedPayment = (await initiatePayment('cash-on-delivery', {
        additionalData: {
          ...(guestCustomerEmail ? { customerEmail: guestCustomerEmail } : {}),
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
          ...(guestCustomerEmail ? { customerEmail: guestCustomerEmail } : {}),
          ...(trimmedGuestFullName ? { customerFullName: trimmedGuestFullName } : {}),
          ...(trimmedGuestPhone ? { customerPhone: trimmedGuestPhone } : {}),
          deliveryType,
          shippingAddress: shippingAddressForOrder,
        },
      })) as Record<string, unknown>

      if (confirmResult?.orderID) {
        const relatedRaw = confirmResult.relatedOrderIDs
        const relatedIds = Array.isArray(relatedRaw) ?
          relatedRaw.filter((id): id is number => typeof id === 'number')
        : []

        if (relatedIds.length > 0) {
          toast.message(
            `Multiple orders (${relatedIds.length + 1}) — one per shipment profile. IDs: ${[confirmResult.orderID, ...relatedIds].join(', ')}.`,
          )
        }

        const queryParams = new URLSearchParams()
        const accessToken = confirmResult.accessToken

        if (typeof accessToken === 'string' && accessToken) {
          queryParams.set('accessToken', accessToken)
        }

        const queryString = queryParams.toString()
        const redirectUrl = `/orders/${confirmResult.orderID}${queryString ? `?${queryString}` : ''}`

        await clearCart()
        router.push(redirectUrl)
        return
      }

      throw new Error('Unable to confirm the cash on delivery order.')
    } catch (error) {
      const errorData = error instanceof Error ? safeParseJSON(error.message) : {}
      let errorMessage = 'An error occurred while initiating payment.'

      if (errorData?.cause?.code === 'OutOfStock') {
        errorMessage = 'One or more items in your cart are out of stock.'
      } else if (error instanceof Error && error.message) {
        errorMessage = error.message
      }

      setError(errorMessage)
      toast.error(errorMessage)
      setProcessingPayment(false)
    }
  }, [
    billingAddress,
    billingAddressSameAsShipping,
    clearCart,
    confirmOrder,
    deliveryType,
    guestFullName,
    guestPhone,
    initiatePayment,
    router,
    shippingAddress,
  ])

  if (cartIsEmpty && isProcessingPayment) {
    return (
      <Card
        className={cn(checkoutSectionClass, 'mx-auto max-w-md border-none py-12 text-center shadow-md')}
      >
        <CardContent className="flex flex-col items-center gap-6 px-8 pb-12 pt-10">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
            <Loader2 aria-hidden className="size-8 animate-spin text-primary" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-semibold tracking-tight">Submitting your order</p>
            <p className="text-sm text-muted-foreground">
              Hold on—we are confirming payment and inventory.
            </p>
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
            <Link href="/search">Browse products</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex grow flex-col items-stretch justify-stretch gap-10 lg:my-4 lg:flex-row lg:gap-10 xl:gap-12">
      <div className="flex min-w-0 basis-full flex-col gap-8 lg:basis-[62%]">
        <Card className={checkoutSectionClass}>
          <CheckoutSectionHeader
            description="Save time next time—sign in, or finish as a guest."
            icon={UserRound}
            step={1}
            title="Contact"
          />
          <CardContent className="flex flex-col gap-6 pt-6">
            {!user && (
              <div className="flex flex-col gap-4 rounded-xl border border-dashed bg-muted/20 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Already have an account?</p>
                  <p className="text-xs text-muted-foreground">
                    Use saved addresses and checkout faster.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button asChild size="sm" variant="default">
                    <Link href="/login">Log in</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/create-account">Create account</Link>
                  </Button>
                </div>
              </div>
            )}
            {user ? (
              <div className="rounded-xl border bg-muted/15 px-5 py-4">
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
            ) : (
              <div className="rounded-xl border bg-muted/15 px-5 py-6">
                <p className="mb-6 text-sm text-muted-foreground">
                  Enter your full name and phone number to continue as a guest.
                </p>

                <FormItem className="mb-6">
                  <Label htmlFor="guestFullName">Full name</Label>
                  <Input
                    autoComplete="name"
                    disabled={!guestContactEditable}
                    id="guestFullName"
                    name="guestFullName"
                    onChange={(e) => setGuestFullName(e.target.value)}
                    required
                    type="text"
                    value={guestFullName}
                  />
                </FormItem>

                <FormItem className="mb-6">
                  <Label htmlFor="guestPhone">Phone number</Label>
                  <Input
                    autoComplete="tel"
                    disabled={!guestContactEditable}
                    id="guestPhone"
                    name="guestPhone"
                    onChange={(e) => setGuestPhone(e.target.value)}
                    required
                    type="tel"
                    value={guestPhone}
                  />
                </FormItem>

                <Button
                  disabled={!guestFullName.trim() || !guestPhone.trim() || !guestContactEditable}
                  onClick={(e) => {
                    e.preventDefault()
                    setGuestContactEditable(false)
                  }}
                  size="lg"
                  variant="default"
                >
                  Continue as guest
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className={checkoutSectionClass}>
          <CheckoutSectionHeader
            description="We use this to prepare delivery and invoicing."
            icon={MapPin}
            step={2}
            title="Delivery address"
          />
          <CardContent className="flex flex-col gap-6 pt-6 pb-8">
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
                callback={(address) => {
                  setBillingAddress(address)
                }}
                disabled={!guestContactConfirmed}
                skipSubmission={true}
              />
            )}

            <div
              className={cn(
                'flex items-start gap-3 rounded-xl border px-4 py-3.5 transition-colors',
                billingAddressSameAsShipping && 'border-primary/20 bg-primary/4',
              )}
            >
              <Checkbox
                checked={billingAddressSameAsShipping}
                className="mt-1"
                disabled={Boolean(isProcessingPayment || (!user && !guestContactConfirmed))}
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

            {!billingAddressSameAsShipping && (
              <>
                {shippingAddress ? (
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
                ) : user ? (
                  <CheckoutAddresses
                    description="Please select where we should ship this order."
                    heading="Shipping address"
                    setAddress={setShippingAddress}
                  />
                ) : (
                  <CreateAddressModal
                    callback={(address) => {
                      setShippingAddress(address)
                    }}
                    disabled={!guestContactConfirmed}
                    skipSubmission={true}
                  />
                )}
              </>
            )}

            {billingAddress ?
              <CheckoutShipping
                deliveryType={deliveryType}
                disabled={isProcessingPayment || (!user && !guestContactConfirmed)}
                errorMessage={shippingQuoteFetchError}
                loading={shippingQuoteLoading}
                onDeliveryTypeChange={setDeliveryType}
                quote={shippingQuote}
              />
            : null}
          </CardContent>
        </Card>

        <Card className={checkoutSectionClass}>
          <CardHeader className="border-b bg-muted/30 pb-5 pt-6">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold tabular-nums text-primary-foreground">
                3
              </span>
              <div>
                <CardTitle className="text-xl font-semibold tracking-tight">
                  Review &amp; place order
                </CardTitle>
                <CardDescription>
                  Pay on delivery—we will confirm your order right away.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-6 pt-6 pb-8">
            <Button
              className="min-h-12 w-full text-base sm:min-w-48 sm:w-auto"
              disabled={!canSubmitOrder || isProcessingPayment}
              onClick={(e) => {
                e.preventDefault()
                void submitCashOnDeliveryOrder()
              }}
              size="lg"
            >
              {isProcessingPayment ? (
                <>
                  <Loader2 aria-hidden className="mr-2 size-5 animate-spin" />
                  Submitting…
                </>
              ) : (
                'Place order'
              )}
            </Button>

            {error && (
              <div className="space-y-4 rounded-xl border border-destructive/30 bg-destructive/5 p-5">
                <Message error={error} />
                <Button
                  onClick={(e) => {
                    e.preventDefault()
                    router.refresh()
                  }}
                  variant="secondary"
                >
                  Try again
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {!cartIsEmpty && (
        <aside className="relative flex min-w-0 basis-full flex-col lg:sticky lg:top-28 lg:max-h-[calc(100vh-8rem)] lg:basis-[38%] lg:self-start">
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

            <CardContent className="flex max-h-[min(78vh,46rem)] flex-col gap-0 overflow-hidden px-0">
              {cart?.id ? <CheckoutPromoCode cartId={cart.id} /> : null}
              <ul className="flex flex-col gap-0 overflow-y-auto px-6 pb-2">
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
              <div className="mt-auto border-t bg-muted/20 px-6 py-5">
                <div className="flex flex-col gap-3">
                  {summaryHasPromo && cart ? (
                    <>
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <Price
                          amount={summarySubtotalBefore}
                          as="span"
                          className="font-semibold tabular-nums text-foreground"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-muted-foreground">
                          Discount ({cart.appliedPromoCode})
                        </span>
                        <span className="inline-flex items-baseline gap-0.5 font-semibold tabular-nums text-emerald-700 dark:text-emerald-500">
                          <span aria-hidden>−</span>
                          <Price amount={summaryDiscount} as="span" className="font-semibold" />
                        </span>
                      </div>
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
                      <p className="text-xs font-medium text-emerald-700 dark:text-emerald-500">
                        You saved{' '}
                        <Price amount={summaryDiscount} as="span" className="inline font-semibold" />{' '}
                        with this code.
                      </p>
                    </>
                  ) : cart ? (
                    <>
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
                    </>
                  ) : null}
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

const safeParseJSON = (value: string) => {
  try {
    return JSON.parse(value)
  } catch {
    return {}
  }
}
