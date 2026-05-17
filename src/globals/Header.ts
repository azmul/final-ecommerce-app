import type { GlobalConfig } from 'payload'

import { staffGlobalAccess } from '@/lib/permissions/collectionAccess'
import { link } from '@/fields/link'
import { revalidateHeader } from '@/globals/hooks/revalidateHeader'

export const Header: GlobalConfig = {
  slug: 'header',
  access: {
    read: () => true,
    update: staffGlobalAccess('header').update,
  },
  hooks: {
    afterChange: [revalidateHeader],
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
