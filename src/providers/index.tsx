'use client'

import { ecommerceCurrenciesConfig } from '@/lib/ecommerceCurrency'
import { AuthProvider } from '@/providers/Auth'
import { EcommerceAuthSync } from '@/providers/EcommerceAuthSync'
import { EcommerceProvider } from '@payloadcms/plugin-ecommerce/client/react'
import { stripeAdapterClient } from '@payloadcms/plugin-ecommerce/payments/stripe'
import React from 'react'

import { cashOnDeliveryAdapterClient } from '@/plugins/cashOnDeliveryAdapter'
import { HeaderThemeProvider } from './HeaderTheme'
import { ThemeProvider } from './Theme'
import { SonnerProvider } from '@/providers/Sonner'
import { CompareProvider } from '@/providers/Compare'
import { RecentlyViewedProvider } from '@/providers/RecentlyViewed'
import { WishlistProvider } from '@/providers/Wishlist'
import { CartSheetProvider } from '@/components/Cart/CartSheetContext'
import { ChatProvider } from '@/components/chat'
import { PwaInstallPrompt } from '@/components/pwa/PwaInstallPrompt'
import { PwaRegister } from '@/components/pwa/PwaRegister'

export const Providers: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <HeaderThemeProvider>
          <SonnerProvider />
          <PwaRegister />
          <PwaInstallPrompt />
          <EcommerceProvider
            enableVariants={true}
            currenciesConfig={ecommerceCurrenciesConfig}
            api={{
              cartsFetchQuery: {
                depth: 3,
                select: {
                  appliedBundle: true,
                  appliedGiftCardCode: true,
                  appliedLoyaltyPoints: true,
                  appliedPromoCode: true,
                  bundleDiscountAmount: true,
                  customer: true,
                  giftCardDiscountAmount: true,
                  loyaltyDiscountAmount: true,
                  promoDiscountAmount: true,
                  secret: true,
                  subtotalBeforeDiscount: true,
                },
                populate: {
                  products: {
                    gallery: true,
                    inventory: true,
                    shipment: true,
                    slug: true,
                    title: true,
                  },
                  variants: {
                    inventory: true,
                    title: true,
                  },
                },
              },
            }}
            paymentMethods={[
              cashOnDeliveryAdapterClient(),
              stripeAdapterClient({
                publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
              }),
            ]}
          >
            <EcommerceAuthSync />
            <CartSheetProvider>
              <ChatProvider>
                <RecentlyViewedProvider>
                  <WishlistProvider>
                    <CompareProvider>{children}</CompareProvider>
                  </WishlistProvider>
                </RecentlyViewedProvider>
              </ChatProvider>
            </CartSheetProvider>
          </EcommerceProvider>
        </HeaderThemeProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
