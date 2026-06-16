import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
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

import { CompareLists } from '@/collections/CompareLists'
import { AdminAuditLogs } from '@/collections/AdminAuditLogs'
import { InventoryReservations } from '@/collections/InventoryReservations'
import { ChatConversations } from '@/collections/ChatConversations'
import { ChatMessages } from '@/collections/ChatMessages'
import { BlogComments } from '@/collections/BlogComments'
import { Brands } from '@/collections/Brands'
import { Categories } from '@/collections/Categories'
import { createMediaCollection } from '@/collections/Media'
import { createS3StoragePlugin, resolveStorageMode } from '@/lib/upload'
import { NotificationBroadcasts } from '@/collections/NotificationBroadcasts'
import { NotificationPreferences } from '@/collections/NotificationPreferences'
import { Pages } from '@/collections/Pages'
import { Posts } from '@/collections/Posts'
import { ProductAlerts } from '@/collections/ProductAlerts'
import { PushSubscriptions } from '@/collections/PushSubscriptions'
import { AnalyticsEvents } from '@/collections/AnalyticsEvents'
import { Shipments } from '@/collections/Shipment'
import { StockLocations } from '@/collections/StockLocations'
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

const storageMode = await resolveStorageMode()

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
    ChatConversations,
    ChatMessages,
    Categories,
    Subcategories,
    Brands,
    createMediaCollection(storageMode),
    Wishlists,
    CompareLists,
    InventoryReservations,
    AdminAuditLogs,
    Users,
    NotificationPreferences,
    PushSubscriptions,
    ProductAlerts,
    UserNotifications,
    NotificationBroadcasts,
    Shipments,
    StockLocations,
    AnalyticsEvents,
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
  ...(process.env.SMTP_HOST ?
    {
      email: nodemailerAdapter({
        defaultFromAddress: process.env.EMAIL_FROM || 'orders@localhost',
        defaultFromName: process.env.SITE_NAME || process.env.COMPANY_NAME || 'Store',
        transportOptions: {
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT ?? 587),
          secure: Number(process.env.SMTP_PORT ?? 587) === 465,
          auth:
            process.env.SMTP_USER && process.env.SMTP_PASS ?
              {
                pass: process.env.SMTP_PASS,
                user: process.env.SMTP_USER,
              }
            : undefined,
        },
      }),
    }
  : {}),
  endpoints: [],
  globals: [Header, Footer],
  graphQL: {
    disable: false,
    disableIntrospectionInProduction: true,
    disablePlaygroundInProduction: true,
    maxComplexity: 100,
  },
  maxDepth: 5,
  plugins: [...(storageMode === 's3' ? [createS3StoragePlugin()] : []), ...plugins],
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  // Sharp is now an optional dependency -
  // if you want to resize images, crop, set focal point, etc.
  // make sure to install it and pass it to the config.
  // sharp,
})
