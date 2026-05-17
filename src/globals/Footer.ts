import type { GlobalConfig } from 'payload'

import { staffGlobalAccess } from '@/lib/permissions/collectionAccess'
import { link } from '@/fields/link'
import { revalidateFooter } from '@/globals/hooks/revalidateFooter'

export const Footer: GlobalConfig = {
  slug: 'footer',
  access: {
    read: () => true,
    update: staffGlobalAccess('footer').update,
  },
  hooks: {
    afterChange: [revalidateFooter],
  },
  fields: [
    {
      name: 'navItems',
      type: 'array',
      fields: [
        link({
          appearances: false,
        }),
      ],
      maxRows: 6,
    },
  ],
}
