import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Suspense } from 'react'

import { noindexMetadata } from '@/lib/seo/noindexMetadata'

export const metadata: Metadata = noindexMetadata({
  title: 'Account',
})

import { headers as getHeaders } from 'next/headers.js'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { AccountNav } from '@/components/AccountNav'
import { RenderParams } from '@/components/RenderParams'
import { cmsPageGutterClassName } from '@/utilities/cmsLayout'
import { cn } from '@/utilities/cn'

export default async function RootLayout({ children }: { children: ReactNode }) {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })

  return (
    <div>
      <div className={cn(cmsPageGutterClassName, 'print:hidden')}>
        <RenderParams className="" />
      </div>

      <div className={cn(cmsPageGutterClassName, 'mt-8 flex flex-col gap-6 pb-8 md:flex-row md:gap-8')}>
        {user ?
          <Suspense fallback={null}>
            <AccountNav
              className="md:hidden"
              orientation="horizontal"
            />
            <AccountNav className="max-w-62 hidden grow flex-col items-start gap-4 md:flex" />
          </Suspense>
        : null}

        <div className="flex min-w-0 grow flex-col gap-12">{children}</div>
      </div>
    </div>
  )
}
