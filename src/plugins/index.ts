import { formBuilderPlugin } from '@payloadcms/plugin-form-builder'
import { seoPlugin } from '@payloadcms/plugin-seo'
import type { CollectionBeforeChangeHook, Plugin } from 'payload'
import { GenerateTitle, GenerateURL } from '@payloadcms/plugin-seo/types'
import { FixedToolbarFeature, HeadingFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { ecommercePlugin, amountField } from '@payloadcms/plugin-ecommerce'

import { stripeAdapter } from '@payloadcms/plugin-ecommerce/payments/stripe'
import { cashOnDeliveryAdapter } from '@/plugins/cashOnDeliveryAdapter'

import { appendNotificationsAfterEcommercePlugin } from '@/plugins/appendNotificationsAfterEcommerce'
import { appendPromoCodesAfterProductsPlugin } from '@/plugins/appendPromoCodesAfterProducts'
import { appendProductReviewsAfterProductsPlugin } from '@/plugins/appendProductReviewsAfterProducts'
import { appendShipmentsAfterTransactionsPlugin } from '@/plugins/appendShipmentsAfterTransactions'

import { ecommerceCurrenciesConfig } from '@/lib/ecommerceCurrency'
import { afterFormSubmissionEsp } from '@/lib/marketing/afterFormSubmissionEsp'
import { Page, Post, Product } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'
import { ProductsCollection } from '@/collections/Products'
import { VariantsCollection } from '@/collections/Variants'
import { adminOrPublishedStatus } from '@/access/adminOrPublishedStatus'
import { adminOnlyFieldAccess } from '@/access/adminOnlyFieldAccess'
import { customerOnlyFieldAccess } from '@/access/customerOnlyFieldAccess'
import { isAdmin } from '@/access/isAdmin'
import { isDocumentOwner } from '@/access/isDocumentOwner'
import { promoCartBeforeChange } from '@/collections/Carts/promoCartBeforeChange'
import { enrichOrderPromoFromCart } from '@/collections/Orders/enrichOrderPromoFromCart'

const siteTitle =
  process.env.SITE_NAME || process.env.COMPANY_NAME || 'Store'

const generateTitle: GenerateTitle<Product | Page | Post> = ({ doc }) => {
  return doc?.title ? `${doc.title} | ${siteTitle}` : siteTitle
}

const generateURL: GenerateURL<Product | Page | Post> = ({ doc, collectionSlug }) => {
  const url = getServerSideURL()
  const slug = doc?.slug

  if (!slug) return url

  if (collectionSlug === 'posts') {
    return `${url}/blog/${slug}`
  }

  return `${url}/${slug}`
}

const orderStatusOptions = [
  {
    label: 'Processing',
    value: 'processing',
  },
  {
    label: 'Completed',
    value: 'completed',
  },
  {
    label: 'Cancelled',
    value: 'cancelled',
  },
  {
    label: 'Refunded',
    value: 'refunded',
  },
] as const

const trackOrderStatusTimeline: CollectionBeforeChangeHook = ({ data, operation, originalDoc }) => {
  const status = data?.status ?? (operation === 'create' ? 'processing' : undefined)
  const previousStatus = originalDoc?.status
  const timeline = Array.isArray(originalDoc?.statusTimeline) ? originalDoc.statusTimeline : []
  const hasIncomingTimeline = Object.prototype.hasOwnProperty.call(data ?? {}, 'statusTimeline')

  if (!status) {
    return hasIncomingTimeline
      ? {
          ...data,
          statusTimeline: timeline,
        }
      : data
  }

  if (operation === 'create' || status !== previousStatus) {
    return {
      ...data,
      statusTimeline: [
        ...timeline,
        {
          status,
          updatedAt: new Date().toISOString(),
        },
      ],
    }
  }

  return hasIncomingTimeline
    ? {
        ...data,
        statusTimeline: timeline,
      }
    : data
}

export const plugins: Plugin[] = [
  seoPlugin({
    generateTitle,
    generateURL,
  }),
  formBuilderPlugin({
    fields: {
      payment: false,
    },
    formSubmissionOverrides: {
      access: {
        delete: isAdmin,
        read: isAdmin,
        update: isAdmin,
      },
      admin: {
        group: 'Content',
      },
      hooks: {
        afterChange: [afterFormSubmissionEsp],
      },
    },
    formOverrides: {
      access: {
        delete: isAdmin,
        read: isAdmin,
        update: isAdmin,
        create: isAdmin,
      },
      admin: {
        group: 'Content',
      },
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ('name' in field && field.name === 'confirmationMessage') {
            return {
              ...field,
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    FixedToolbarFeature(),
                    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                  ]
                },
              }),
            }
          }
          return field
        })
      },
    },
  }),
  ecommercePlugin({
    currencies: ecommerceCurrenciesConfig,
    access: {
      adminOnlyFieldAccess,
      adminOrPublishedStatus,
      customerOnlyFieldAccess,
      isAdmin,
      isDocumentOwner,
    },
    addresses: {
      addressFields: () => [
        {
          name: 'district',
          type: 'text',
          label: 'District',
          required: true,
        },
        {
          name: 'fullAddress',
          type: 'textarea',
          label: 'Full address',
          required: true,
        },
      ],
    },
    customers: {
      slug: 'users',
    },
    carts: {
      cartsCollectionOverride: ({ defaultCollection }) => ({
        ...defaultCollection,
        hooks: {
          ...defaultCollection.hooks,
          beforeChange: [...(defaultCollection.hooks?.beforeChange ?? []), promoCartBeforeChange],
        },
        admin: {
          ...defaultCollection.admin,
          listSearchableFields: ['id'],
          components: {
            ...defaultCollection.admin?.components,
            beforeListTable: [
              ...(defaultCollection.admin?.components?.beforeListTable ?? []),
              '@/components/admin/CartDateRangeFilter#CartDateRangeFilter',
            ],
          },
        },
        fields: [
          ...defaultCollection.fields,
          {
            name: 'appliedPromoCode',
            type: 'text',
            admin: {
              position: 'sidebar',
              description: 'Checkout coupon code (case-insensitive for customers).',
            },
          },
          {
            name: 'promoCode',
            type: 'relationship',
            relationTo: 'promo-codes',
            access: {
              update: isAdmin,
            },
            admin: {
              position: 'sidebar',
              readOnly: true,
            },
          },
          amountField({
            currenciesConfig: ecommerceCurrenciesConfig,
            overrides: {
              name: 'promoDiscountAmount',
              label: 'Promo discount amount',
              access: {
                update: isAdmin,
              },
              admin: {
                position: 'sidebar',
                readOnly: true,
              },
            },
          }),
          amountField({
            currenciesConfig: ecommerceCurrenciesConfig,
            overrides: {
              name: 'subtotalBeforeDiscount',
              label: 'Subtotal before discount',
              access: {
                update: isAdmin,
              },
              admin: {
                position: 'sidebar',
                readOnly: true,
              },
            },
          }),
        ],
      }),
    },
    orders: {
      ordersCollectionOverride: ({ defaultCollection }) => ({
        ...defaultCollection,
        admin: {
          ...defaultCollection.admin,
          listSearchableFields: ['id'],
          components: {
            ...defaultCollection.admin?.components,
            beforeListTable: [
              ...(defaultCollection.admin?.components?.beforeListTable ?? []),
              '@/components/admin/OrderDateRangeFilter#OrderDateRangeFilter',
            ],
            edit: {
              ...defaultCollection.admin?.components?.edit,
              beforeDocumentControls: [
                ...(defaultCollection.admin?.components?.edit?.beforeDocumentControls ?? []),
                '@/components/admin/PrintOrderButton#PrintOrderButton',
              ],
            },
          },
        },
        hooks: {
          ...defaultCollection.hooks,
          beforeChange: [
            ...(defaultCollection.hooks?.beforeChange ?? []),
            trackOrderStatusTimeline,
          ],
          afterChange: [...(defaultCollection.hooks?.afterChange ?? []), enrichOrderPromoFromCart],
        },
        fields: [
          ...defaultCollection.fields,
          {
            name: 'checkoutCart',
            type: 'relationship',
            relationTo: 'carts',
            admin: {
              hidden: true,
            },
          },
          {
            name: 'appliedPromoCode',
            type: 'text',
            admin: {
              position: 'sidebar',
              readOnly: true,
            },
          },
          {
            name: 'promoCode',
            type: 'relationship',
            relationTo: 'promo-codes',
            admin: {
              position: 'sidebar',
              readOnly: true,
            },
          },
          amountField({
            currenciesConfig: ecommerceCurrenciesConfig,
            overrides: {
              name: 'promoDiscountAmount',
              label: 'Promo discount amount',
              admin: {
                position: 'sidebar',
                readOnly: true,
              },
            },
          }),
          amountField({
            currenciesConfig: ecommerceCurrenciesConfig,
            overrides: {
              name: 'subtotalBeforeDiscount',
              label: 'Subtotal before discount',
              admin: {
                position: 'sidebar',
                readOnly: true,
              },
            },
          }),
          {
            name: 'statusTimeline',
            type: 'array',
            admin: {
              initCollapsed: true,
              readOnly: true,
            },
            fields: [
              {
                name: 'status',
                type: 'select',
                options: [...orderStatusOptions],
                required: true,
              },
              {
                name: 'updatedAt',
                type: 'date',
                admin: {
                  date: {
                    pickerAppearance: 'dayAndTime',
                  },
                },
                required: true,
              },
            ],
            label: 'Status Timeline',
            labels: {
              plural: 'Status Updates',
              singular: 'Status Update',
            },
          },
          {
            name: 'accessToken',
            type: 'text',
            unique: true,
            index: true,
            admin: {
              position: 'sidebar',
              readOnly: true,
            },
            hooks: {
              beforeValidate: [
                ({ value, operation }) => {
                  if (operation === 'create' || !value) {
                    return crypto.randomUUID()
                  }
                  return value
                },
              ],
            },
          },
          {
            name: 'customerFullName',
            type: 'text',
            admin: {
              position: 'sidebar',
              readOnly: true,
            },
            hooks: {
              afterRead: [
                async ({ data, req, value }) => {
                  if (value) {
                    return value
                  }

                  const customer = data?.customer

                  if (!customer) {
                    return null
                  }

                  if (typeof customer === 'object' && 'name' in customer) {
                    return customer.name ?? null
                  }

                  const customerID =
                    typeof customer === 'object' && 'id' in customer ? customer.id : customer

                  if (!customerID || !req?.payload) {
                    return null
                  }

                  const customerDoc = await req.payload.findByID({
                    collection: 'users',
                    id: customerID,
                    depth: 0,
                    req,
                    select: {
                      name: true,
                    },
                  })

                  return customerDoc?.name ?? null
                },
              ],
            },
          },
          {
            name: 'customerPhone',
            type: 'text',
            admin: {
              position: 'sidebar',
              readOnly: true,
            },
            hooks: {
              afterRead: [
                async ({ data, req, value }) => {
                  if (value) {
                    return value
                  }

                  const customer = data?.customer

                  if (!customer) {
                    return null
                  }

                  if (typeof customer === 'object' && 'phone' in customer) {
                    return customer.phone ?? null
                  }

                  const customerID =
                    typeof customer === 'object' && 'id' in customer ? customer.id : customer

                  if (!customerID) {
                    return null
                  }

                  if (!req?.payload) {
                    return value ?? null
                  }

                  const customerDoc = await req.payload.findByID({
                    collection: 'users',
                    id: customerID,
                    depth: 0,
                    req,
                    select: {
                      phone: true,
                    },
                  })

                  return customerDoc?.phone ?? null
                },
              ],
            },
          },
        ],
      }),
    },
    transactions: {
      transactionsCollectionOverride: ({ defaultCollection }) => ({
        ...defaultCollection,
        admin: {
          ...defaultCollection.admin,
          listSearchableFields: ['id'],
          components: {
            ...defaultCollection.admin?.components,
            beforeListTable: [
              ...(defaultCollection.admin?.components?.beforeListTable ?? []),
              '@/components/admin/TransactionDateRangeFilter#TransactionDateRangeFilter',
            ],
          },
        },
        fields: [
          ...defaultCollection.fields,
          {
            name: 'customerFullName',
            type: 'text',
            admin: {
              position: 'sidebar',
              readOnly: true,
            },
          },
          {
            name: 'customerPhone',
            type: 'text',
            admin: {
              position: 'sidebar',
              readOnly: true,
            },
          },
          {
            name: 'checkoutBatchId',
            type: 'text',
            admin: {
              description: 'Shared when one checkout creates multiple orders (different shipment profiles).',
              position: 'sidebar',
              readOnly: true,
            },
          },
          {
            name: 'checkoutShipmentSummary',
            type: 'json',
            admin: {
              description: 'Shipment group, delivery prefs, and charge lines for this order.',
              position: 'sidebar',
              readOnly: true,
            },
          },
        ],
      }),
    },
    payments: {
      paymentMethods: [
        cashOnDeliveryAdapter(),
        stripeAdapter({
          secretKey: process.env.STRIPE_SECRET_KEY!,
          publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
          webhookSecret: process.env.STRIPE_WEBHOOKS_SIGNING_SECRET!,
        }),
      ],
    },
    products: {
      variants: {
        variantsCollectionOverride: VariantsCollection,
      },
      productsCollectionOverride: ProductsCollection,
    },
  }),
  appendProductReviewsAfterProductsPlugin(),
  appendPromoCodesAfterProductsPlugin(),
  appendShipmentsAfterTransactionsPlugin(),
  appendNotificationsAfterEcommercePlugin(),
]
