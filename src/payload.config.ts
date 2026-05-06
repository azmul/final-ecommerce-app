import { postgresAdapter } from '@payloadcms/db-postgres'
import {
  EXPERIMENTAL_TableFeature,
  FixedToolbarFeature,
  LinkFeature,
  UploadFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'

import { BlogComments } from '@/collections/BlogComments'
import { Brands } from '@/collections/Brands'
import { Categories } from '@/collections/Categories'
import { Media } from '@/collections/Media'
import { NotificationBroadcasts } from '@/collections/NotificationBroadcasts'
import { NotificationPreferences } from '@/collections/NotificationPreferences'
import { Pages } from '@/collections/Pages'
import { Posts } from '@/collections/Posts'
import { ProductAlerts } from '@/collections/ProductAlerts'
import { PushSubscriptions } from '@/collections/PushSubscriptions'
import { Shipments } from '@/collections/Shipment'
import { Subcategories } from '@/collections/Subcategories'
import { UserNotifications } from '@/collections/UserNotifications'
import { Users } from '@/collections/Users'
import { Wishlists } from '@/collections/Wishlists'
import { Footer } from '@/globals/Footer'
import { Header } from '@/globals/Header'
import { ensureProductionEnv } from '@/utilities/ensureProductionEnv'
import { migrations } from './migrations'
import { plugins } from './plugins'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

ensureProductionEnv()

export default buildConfig({
  admin: {
    // Extensions may mutate <html>/<body> before hydration (Payload admin RootLayout).
    suppressHydrationWarning: true,
    components: {
      // The `BeforeLogin` component renders a message that you see while logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below and the import `BeforeLogin` statement on line 15.
      beforeLogin: ['@/components/BeforeLogin#BeforeLogin'],
      // The `BeforeDashboard` component renders the 'welcome' block that you see after logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below and the import `BeforeDashboard` statement on line 15.
      beforeDashboard: ['@/components/BeforeDashboard#BeforeDashboard'],
    },
    user: Users.slug,
  },
  collections: [
    Pages,
    Posts,
    BlogComments,
    Categories,
    Subcategories,
    Brands,
    Media,
    Wishlists,
    Users,
    NotificationPreferences,
    PushSubscriptions,
    ProductAlerts,
    UserNotifications,
    NotificationBroadcasts,
    Shipments,
  ],
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
    // Drizzle dev push breaks on Postgres enum changes (e.g. ecommerce currency). Use migrations.
    push: false,
    prodMigrations: migrations,
  }),
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => {
      const withoutLinkOrUpload = defaultFeatures.filter((feature) => {
        if (!(typeof feature === 'object' && feature !== null && 'key' in feature)) return true
        const k = (feature as { key: string }).key
        return k !== 'link' && k !== 'upload'
      })

      return [
        ...withoutLinkOrUpload,
        LinkFeature({
          enabledCollections: ['pages', 'posts'],
          fields: ({ defaultFields }) => {
            const defaultFieldsWithoutUrl = defaultFields.filter((field) => {
              if ('name' in field && field.name === 'url') return false
              return true
            })

            return [
              ...defaultFieldsWithoutUrl,
              {
                name: 'url',
                type: 'text',
                admin: {
                  condition: ({ linkType }) => linkType !== 'internal',
                },
                label: ({ t }) => t('fields:enterURL'),
                required: true,
              },
            ]
          },
        }),
        UploadFeature({
          enabledCollections: ['media'],
        }),
        EXPERIMENTAL_TableFeature(),
        FixedToolbarFeature(),
      ]
    },
  }),
  //email: nodemailerAdapter(),
  endpoints: [],
  globals: [Header, Footer],
  graphQL: {
    disablePlaygroundInProduction: true,
  },
  plugins,
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  // Sharp is now an optional dependency -
  // if you want to resize images, crop, set focal point, etc.
  // make sure to install it and pass it to the config.
  // sharp,
})
