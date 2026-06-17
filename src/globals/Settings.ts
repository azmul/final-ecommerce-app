import type { GlobalConfig } from 'payload'

import { staffGlobalAccess } from '@/lib/permissions/collectionAccess'
import { revalidateSettings } from '@/globals/hooks/revalidateSettings'

export const Settings: GlobalConfig = {
  slug: 'settings',
  label: 'Settings',
  admin: {
    group: 'Settings',
  },
  access: {
    read: () => true,
    update: staffGlobalAccess('settings').update,
  },
  hooks: {
    afterChange: [revalidateSettings],
  },
  fields: [
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      label: 'Site logo',
      admin: {
        description:
          'Shown in the site header, favicon, PWA manifest, and Organization JSON-LD. Footer can override with its own logo.',
      },
    },
  ],
}
