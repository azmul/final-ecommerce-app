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
import sharp from 'sharp'
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
import { createR2StoragePlugin, resolveStorageMode } from '@/lib/upload'
import { NotificationBroadcasts } from '@/collections/NotificationBroadcasts'
import { NotificationPreferences } from '@/collections/NotificationPreferences'
import { Pages } from '@/collections/Pages'
import { Posts } from '@/collections/Posts'
import { ProductAlerts } from '@/collections/ProductAlerts'
import { PushSubscriptions } from '@/collections/PushSubscriptions'
import { SecurityEvents } from '@/monitoring/SecurityEvents'
import { AnalyticsEvents } from '@/collections/AnalyticsEvents'
import { Shipments } from '@/collections/Shipment'
import { StockLocations } from '@/collections/StockLocations'
import { Subcategories } from '@/collections/Subcategories'
import { UserNotifications } from '@/collections/UserNotifications'
import { Users } from '@/collections/Users'
import { Wishlists } from '@/collections/Wishlists'
import { Footer } from '@/globals/Footer'
import { Header } from '@/globals/Header'
import { Settings } from '@/globals/Settings'
import { ensureProductionEnv, requirePayloadSecret } from '@/utilities/ensureProductionEnv'
import { getServerSideURL } from '@/utilities/getURL'
import { getPayloadOriginPolicy } from '@/utilities/payloadOriginPolicy'
import { scheduleRagStartupSync } from '@/lib/ai/rag/startupSync'
import { migrations } from './migrations'
import { plugins } from './plugins'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

ensureProductionEnv()

const storageMode = await resolveStorageMode()

const payloadOriginPolicy = getPayloadOriginPolicy()

export default buildConfig({
  admin: {
    // Extensions may mutate <html>/<body> before hydration (Payload admin RootLayout).
    suppressHydrationWarning: true,
    components: {
      providers: [
        '@/components/admin/AdminServerActionRecovery#AdminServerActionRecovery',
        '@/components/admin/AdminLoginRedirect#AdminLoginRedirect',
      ],
      // The `BeforeLogin` component renders a message that you see while logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below and the import `BeforeLogin` statement on line 15.
      beforeLogin: [
        '@/components/BeforeLogin#BeforeLogin',
        '@/components/admin/AdminLoginRedirect#AdminLoginHardRedirect',
      ],
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
      // Bound the per-instance pool so N serverless instances can't exhaust
      // Postgres max_connections. Tune DB_POOL_MAX to max_connections / instances
      // (front with PgBouncer/Supabase pooler in transaction mode for serverless).
      max: Number(process.env.DB_POOL_MAX) || 10,
      idleTimeoutMillis: Number(process.env.DB_POOL_IDLE_TIMEOUT_MS) || 30_000,
      connectionTimeoutMillis: Number(process.env.DB_POOL_CONNECT_TIMEOUT_MS) || 10_000,
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
  globals: [Header, Footer, Settings],
  graphQL: {
    disable: true,
  },
  // Cap recursive relationship population; deep queries should opt into higher
  // depth explicitly with `select`/`populate` rather than paying for depth 5.
  maxDepth: 3,
  onInit: async (payload) => {
    scheduleRagStartupSync(payload)
    if (process.env.NODE_ENV === 'production') {
      const serverURL = getServerSideURL()
      payload.logger.info(
        {
          mode: payloadOriginPolicy.mode,
          origins: payloadOriginPolicy.origins,
          serverURL,
        },
        'Payload origin policy (CSRF/CORS)',
      )

      // Log (don't throw — `pnpm dev:prod` legitimately runs prod builds on localhost).
      let serverHostname = ''
      try {
        serverHostname = new URL(serverURL).hostname
      } catch {
        /* invalid URL already surfaces elsewhere */
      }
      if (['localhost', '127.0.0.1', '::1', '[::1]'].includes(serverHostname)) {
        payload.logger.error(
          `NEXT_PUBLIC_SERVER_URL resolved to ${serverURL} in a production build. ` +
            'On a self-hosted VPS this breaks admin auth (strict CSRF origin mismatch → /admin login redirect loop). ' +
            'Set NEXT_PUBLIC_SERVER_URL / PAYLOAD_PUBLIC_SERVER_URL / ALLOWED_ORIGINS to the real public origin ' +
            'and REBUILD — NEXT_PUBLIC_* values are baked in at build time (see README "Payload Admin on VPS IP").',
        )
      }
    }
  },
  plugins: [...(storageMode === 'r2' ? [createR2StoragePlugin()] : []), ...plugins],
  secret: requirePayloadSecret(),
  serverURL: getServerSideURL(),
  cors: payloadOriginPolicy.cors,
  csrf: payloadOriginPolicy.csrf,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  // Sharp re-encodes uploaded raster images (strips embedded scripts/metadata)
  // and is required for resize/crop/focal-point handling.
  sharp,
})
