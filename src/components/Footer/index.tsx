import type { Footer as FooterGlobal } from '@/payload-types'

import { FooterBrandSection } from '@/components/Footer/FooterBrandSection'
import { FooterLinkColumn } from '@/components/Footer/FooterLinkColumn'
import { getSiteSeoConfig } from '@/lib/seo/siteConfig'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { resolveMediaUrl } from '@/utilities/resolveMediaUrl'
import { cmsPageGutterClassName } from '@/utilities/cmsLayout'
import { cn } from '@/utilities/cn'
import React from 'react'

export async function Footer() {
  const footer: FooterGlobal = await getCachedGlobal('footer', 1)()
  const settings = await getCachedGlobal('settings', 1)()
  const site = getSiteSeoConfig()
  const siteName = site.name
  const logoUrl = resolveMediaUrl(footer.logo) ?? resolveMediaUrl(settings.logo)
  const linkColumns = footer.linkColumns || []
  const currentYear = new Date().getFullYear()
  const copyrightDate = `2023${currentYear > 2023 ? `-${currentYear}` : ''}`
  const copyrightLine =
    footer.copyrightText?.trim() ||
    `© ${copyrightDate} ${site.companyName || siteName}. All rights reserved.`

  return (
    <footer className="border-t border-border/60 bg-background text-sm">
      <div className={cn(cmsPageGutterClassName, 'py-12 md:py-14')}>
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,1fr))] lg:gap-8 xl:gap-12">
          <FooterBrandSection footer={footer} logoUrl={logoUrl} siteName={siteName} />

          {linkColumns.map((column, index) => (
            <FooterLinkColumn column={column} key={column.id ?? `${column.title}-${index}`} />
          ))}
        </div>
      </div>

      <div className="hidden border-t border-border/60 py-5 lg:block">
        <div className={cmsPageGutterClassName}>
          <p className="text-center text-xs text-muted-foreground">{copyrightLine}</p>
        </div>
      </div>
    </footer>
  )
}
