import { getCachedGlobal } from '@/utilities/getGlobals'

import './index.css'
import { HeaderClient } from './index.client'
import { getShopCategoryNavData } from './shopCategoryNavData'

export async function Header() {
  const header = await getCachedGlobal('header', 1)()
  const shopCategories = await getShopCategoryNavData()

  return <HeaderClient header={header} shopCategories={shopCategories} />
}
