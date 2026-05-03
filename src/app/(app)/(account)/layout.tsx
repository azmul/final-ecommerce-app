import type { ReactNode } from 'react'

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

      <div className={cn(cmsPageGutterClassName, 'mt-8 flex gap-4 pb-8 md:gap-8')}>
        {user && <AccountNav className="max-w-62 grow flex-col items-start gap-4 hidden md:flex" />}

        <div className="flex min-w-0 flex-col gap-12 grow">{children}</div>
      </div>
    </div>
  )
}
