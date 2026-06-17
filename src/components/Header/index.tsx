import { getSiteSeoConfig } from '@/lib/seo/siteConfig'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { resolveMediaUrl } from '@/utilities/resolveMediaUrl'

import './index.css'
import { HeaderClient } from './index.client'
import { getShopCategoryNavData } from './shopCategoryNavData'

export async function Header() {
  const header = await getCachedGlobal('header', 1)()
  const settings = await getCachedGlobal('settings', 1)()
  const shopCategories = await getShopCategoryNavData()
  const siteName = process.env.SITE_NAME || process.env.COMPANY_NAME || 'Store'
  const { contactPhone } = getSiteSeoConfig()
  const logoUrl = resolveMediaUrl(settings.logo)

  return (
    <HeaderClient
      contactPhone={contactPhone}
      header={header}
      logoUrl={logoUrl}
      shopCategories={shopCategories}
      siteName={siteName}
    />
  )
}
