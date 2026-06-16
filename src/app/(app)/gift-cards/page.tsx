import type { Metadata } from 'next'

import { GiftCardPurchaseForm } from '@/components/gift-cards/GiftCardPurchaseForm'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'

export const metadata: Metadata = {
  description: 'Purchase a digital gift card for friends and family.',
  openGraph: mergeOpenGraph({
    title: 'Gift cards',
    url: '/gift-cards',
  }),
  title: 'Gift cards',
}

export default function GiftCardsPage() {
  return (
    <div className="container py-10 md:py-14">
      <GiftCardPurchaseForm />
    </div>
  )
}
