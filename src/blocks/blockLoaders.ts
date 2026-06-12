import type { ComponentType } from 'react'

import type { Page } from '@/payload-types'

export type LayoutBlock = Page['layout'][0]
export type BlockType = NonNullable<LayoutBlock['blockType']>

type BlockComponent = ComponentType<Record<string, unknown>>

function blockComponent(component: ComponentType<never>): BlockComponent {
  return component as BlockComponent
}

export async function loadBlockComponent(blockType: BlockType): Promise<BlockComponent | null> {
  switch (blockType) {
    case 'archive':
      return blockComponent((await import('@/blocks/ArchiveBlock/Component')).ArchiveBlock)
    case 'banner':
      return blockComponent((await import('@/blocks/Banner/Component')).BannerBlock)
    case 'brandsCarousel':
      return blockComponent((await import('@/blocks/BrandsCarousel/Component')).BrandsCarouselBlock)
    case 'carousel':
      return blockComponent((await import('@/blocks/Carousel/Component')).CarouselBlock)
    case 'featuredCategories':
      return blockComponent(
        (await import('@/blocks/FeaturedCategories/Component')).FeaturedCategoriesBlock,
      )
    case 'content':
      return blockComponent((await import('@/blocks/Content/Component')).ContentBlock)
    case 'cta':
      return blockComponent((await import('@/blocks/CallToAction/Component')).CallToActionBlock)
    case 'formBlock':
      return blockComponent((await import('@/blocks/Form/Component')).FormBlock)
    case 'mediaBlock':
      return blockComponent((await import('@/blocks/MediaBlock/Component')).MediaBlock)
    case 'threeItemGrid':
      return blockComponent((await import('@/blocks/ThreeItemGrid/Component')).ThreeItemGridBlock)
    case 'topSellingProducts':
      return blockComponent(
        (await import('@/blocks/TopSellingProducts/Component')).TopSellingProductsBlock,
      )
    case 'productShowcase':
      return blockComponent((await import('@/blocks/ProductShowcase/Component')).ProductShowcaseBlock)
    case 'exclusiveComboDeals':
      return blockComponent(
        (await import('@/blocks/ExclusiveComboDeals/Component')).ExclusiveComboDealsBlock,
      )
    case 'twoImagePromo':
      return blockComponent((await import('@/blocks/TwoImagePromo/Component')).TwoImagePromoBlock)
    case 'singleImageBanner':
      return blockComponent(
        (await import('@/blocks/SingleImageBanner/Component')).SingleImageBannerBlock,
      )
    case 'promoCarouselSplit':
      return blockComponent(
        (await import('@/blocks/PromoCarouselSplit/Component')).PromoCarouselSplitBlock,
      )
    case 'testimonials':
      return blockComponent((await import('@/blocks/Testimonials/Component')).TestimonialsBlock)
    case 'campaignHero':
      return blockComponent((await import('@/blocks/CampaignHero/Component')).CampaignHeroBlock)
    case 'countdownPromo':
      return blockComponent((await import('@/blocks/CountdownPromo/Component')).CountdownPromoBlock)
    case 'marketingFeatures':
      return blockComponent(
        (await import('@/blocks/MarketingFeatures/Component')).MarketingFeaturesBlock,
      )
    case 'trustStats':
      return blockComponent((await import('@/blocks/TrustStats/Component')).TrustStatsBlock)
    case 'campaignBannerStrip':
      return blockComponent(
        (await import('@/blocks/CampaignBannerStrip/Component')).CampaignBannerStripBlock,
      )
    case 'focusDiscountProduct':
      return blockComponent(
        (await import('@/blocks/FocusDiscountProduct/Component')).FocusDiscountProductBlock,
      )
    case 'categoryProductShowcase':
      return blockComponent(
        (await import('@/blocks/CategoryProductShowcase/Component')).CategoryProductShowcaseBlock,
      )
    case 'faq':
      return blockComponent((await import('@/blocks/Faq/Component')).FaqBlock)
    default:
      return null
  }
}
