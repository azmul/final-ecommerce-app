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
                depth: 2,
                populate: {
                  products: {
                    slug: true,
                    title: true,
                    gallery: true,
                    inventory: true,
                  },
                  variants: {
                    title: true,
                    inventory: true,
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
              <WishlistProvider>
                <CompareProvider>{children}</CompareProvider>
              </WishlistProvider>
            </CartSheetProvider>
          </EcommerceProvider>
        </HeaderThemeProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
