import { ecommerceCurrenciesConfig } from '@/lib/ecommerceCurrency'
import { AuthProvider } from '@/providers/Auth'
import { EcommerceProvider } from '@payloadcms/plugin-ecommerce/client/react'
import { stripeAdapterClient } from '@payloadcms/plugin-ecommerce/payments/stripe'
import React from 'react'

import { cashOnDeliveryAdapterClient } from '@/plugins/cashOnDeliveryAdapter'
import { HeaderThemeProvider } from './HeaderTheme'
import { ThemeProvider } from './Theme'
import { SonnerProvider } from '@/providers/Sonner'
import { CompareProvider } from '@/providers/Compare'
import { WishlistProvider } from '@/providers/Wishlist'
import { CartSheetProvider } from '@/components/Cart/CartSheetContext'
import { ChatProvider } from '@/components/chat'

export const Providers: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <HeaderThemeProvider>
          <SonnerProvider />
          <EcommerceProvider
            enableVariants={true}
            currenciesConfig={ecommerceCurrenciesConfig}
            api={{
              cartsFetchQuery: {
                depth: 3,
                select: {
                  appliedPromoCode: true,
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
            <CartSheetProvider>
              <ChatProvider>
                <WishlistProvider>
                  <CompareProvider>{children}</CompareProvider>
                </WishlistProvider>
              </ChatProvider>
            </CartSheetProvider>
          </EcommerceProvider>
        </HeaderThemeProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
