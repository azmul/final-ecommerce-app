import { ArchiveBlock } from '@/blocks/ArchiveBlock/Component'
import { BannerBlock } from '@/blocks/Banner/Component'
import { BrandsCarouselBlock } from '@/blocks/BrandsCarousel/Component'
import { CallToActionBlock } from '@/blocks/CallToAction/Component'
import { CarouselBlock } from '@/blocks/Carousel/Component'
import { FeaturedCategoriesBlock } from '@/blocks/FeaturedCategories/Component'
import { ContentBlock } from '@/blocks/Content/Component'
import { FormBlock } from '@/blocks/Form/Component'
import { MediaBlock } from '@/blocks/MediaBlock/Component'
import { ExclusiveComboDealsBlock } from '@/blocks/ExclusiveComboDeals/Component'
import { ProductShowcaseBlock } from '@/blocks/ProductShowcase/Component'
import { TestimonialsBlock } from '@/blocks/Testimonials/Component'
import { TopSellingProductsBlock } from '@/blocks/TopSellingProducts/Component'
import { ThreeItemGridBlock } from '@/blocks/ThreeItemGrid/Component'
import { PromoCarouselSplitBlock } from '@/blocks/PromoCarouselSplit/Component'
import { SingleImageBannerBlock } from '@/blocks/SingleImageBanner/Component'
import { TwoImagePromoBlock } from '@/blocks/TwoImagePromo/Component'
import { CampaignHeroBlock } from '@/blocks/CampaignHero/Component'
import { CountdownPromoBlock } from '@/blocks/CountdownPromo/Component'
import { MarketingFeaturesBlock } from '@/blocks/MarketingFeatures/Component'
import { TrustStatsBlock } from '@/blocks/TrustStats/Component'
import { CampaignBannerStripBlock } from '@/blocks/CampaignBannerStrip/Component'
import { FaqBlock } from '@/blocks/Faq/Component'
import { FocusDiscountProductBlock } from '@/blocks/FocusDiscountProduct/Component'
import { CategoryProductShowcaseBlock } from '@/blocks/CategoryProductShowcase/Component'
import { toKebabCase } from '@/utilities/toKebabCase'
import {
  cmsBlockShellClassName,
  cmsBlockStackGapClassName,
  cmsBlockSurfaceClassName,
} from '@/utilities/cmsLayout'
import { cn } from '@/utilities/cn'
import React from 'react'

import type { Page } from '../payload-types'

const blockTypesWithoutSurface = new Set<string>([
  'testimonials',
  'twoImagePromo',
  'singleImageBanner',
  'promoCarouselSplit',
  'campaignHero',
  'countdownPromo',
  'marketingFeatures',
  'trustStats',
  'campaignBannerStrip',
  'focusDiscountProduct',
  'categoryProductShowcase',
  'faq',
])

const blockComponents = {
  archive: ArchiveBlock,
  banner: BannerBlock,
  brandsCarousel: BrandsCarouselBlock,
  carousel: CarouselBlock,
  featuredCategories: FeaturedCategoriesBlock,
  content: ContentBlock,
  cta: CallToActionBlock,
  formBlock: FormBlock,
  mediaBlock: MediaBlock,
  threeItemGrid: ThreeItemGridBlock,
  topSellingProducts: TopSellingProductsBlock,
  productShowcase: ProductShowcaseBlock,
  exclusiveComboDeals: ExclusiveComboDealsBlock,
  twoImagePromo: TwoImagePromoBlock,
  singleImageBanner: SingleImageBannerBlock,
  promoCarouselSplit: PromoCarouselSplitBlock,
  testimonials: TestimonialsBlock,
  campaignHero: CampaignHeroBlock,
  countdownPromo: CountdownPromoBlock,
  marketingFeatures: MarketingFeaturesBlock,
  trustStats: TrustStatsBlock,
  campaignBannerStrip: CampaignBannerStripBlock,
  focusDiscountProduct: FocusDiscountProductBlock,
  categoryProductShowcase: CategoryProductShowcaseBlock,
  faq: FaqBlock,
}

export const RenderBlocks: React.FC<{
  blocks: Page['layout'][0][]
}> = (props) => {
  const { blocks } = props

  const hasBlocks = blocks && Array.isArray(blocks) && blocks.length > 0

  if (hasBlocks) {
    return (
      <div className={cmsBlockStackGapClassName}>
        {blocks.map((block, index) => {
          const { blockName, blockType } = block

          if (blockType && blockType in blockComponents) {
            const Block = blockComponents[blockType]

            if (Block) {
              const noBlockSurface = blockTypesWithoutSurface.has(blockType)

              return (
                <div
                  className={cn(
                    cmsBlockShellClassName,
                    !noBlockSurface && cmsBlockSurfaceClassName,
                    !noBlockSurface && 'p-6 sm:p-8',
                  )}
                  key={index}
                >
                  {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                  {/* @ts-ignore - weird type mismatch here */}
                  <Block id={toKebabCase(blockName!)} {...block} />
                </div>
              )
            }
          }
          return null
        })}
      </div>
    )
  }

  return null
}
