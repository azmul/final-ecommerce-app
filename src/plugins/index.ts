import { amountField, ecommercePlugin } from '@payloadcms/plugin-ecommerce'
import { formBuilderPlugin } from '@payloadcms/plugin-form-builder'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { GenerateTitle, GenerateURL } from '@payloadcms/plugin-seo/types'
import { FixedToolbarFeature, HeadingFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import type { CollectionBeforeChangeHook, Plugin } from 'payload'

import { cashOnDeliveryAdapter } from '@/plugins/cashOnDeliveryAdapter'
import { stripeAdapter } from '@payloadcms/plugin-ecommerce/payments/stripe'

import { appendAnalysisAfterEcommercePlugin } from '@/plugins/appendAnalysisAfterEcommerce'
import { enforceStaffAdminNavPlugin } from '@/plugins/enforceStaffAdminNav'
import { appendNotificationsAfterEcommercePlugin } from '@/plugins/appendNotificationsAfterEcommerce'
import { orderEcommerceCollectionsPlugin } from '@/plugins/orderEcommerceCollections'
import { appendProductReviewsAfterProductsPlugin } from '@/plugins/appendProductReviewsAfterProducts'
import { appendPromoCodesAfterProductsPlugin } from '@/plugins/appendPromoCodesAfterProducts'
import { appendQuoteRequestsAfterProductsPlugin } from '@/plugins/appendQuoteRequestsAfterProducts'
import { appendLoyaltyTransactionsAfterProductsPlugin } from '@/plugins/appendLoyaltyTransactionsAfterProducts'
import { appendProductQuestionsAfterProductsPlugin } from '@/plugins/appendProductQuestionsAfterProducts'
import { appendRecentlyViewedAfterProductsPlugin } from '@/plugins/appendRecentlyViewedAfterProducts'
import { appendGiftCardsAfterProductsPlugin } from '@/plugins/appendGiftCardsAfterProducts'
import { appendProductBundlesAfterProductsPlugin } from '@/plugins/appendProductBundlesAfterProducts'
import { appendReturnRequestsAfterProductsPlugin } from '@/plugins/appendReturnRequestsAfterProducts'
import { appendSubscriptionsAfterProductsPlugin } from '@/plugins/appendSubscriptionsAfterProducts'
import { appendShipmentsAfterTransactionsPlugin } from '@/plugins/appendShipmentsAfterTransactions'

import { accessOr } from '@/access/accessOr'
import { adminOnlyFieldAccess } from '@/access/adminOnlyFieldAccess'
import { adminOrStaffField } from '@/access/staffAccess'
import { adminOrPublishedStatus } from '@/access/adminOrPublishedStatus'
import { customerOnlyFieldAccess } from '@/access/customerOnlyFieldAccess'
import { isAdmin } from '@/access/isAdmin'
import { adminOrStaff, staffCanViewAdminPage } from '@/access/staffAccess'
import { staffOrDocumentOwner } from '@/access/staffOrDocumentOwner'
import { staffCollectionAccess } from '@/lib/permissions/collectionAccess'
import { isDocumentOwner } from '@/access/isDocumentOwner'
import { bundleCartBeforeChange } from '@/collections/Carts/bundleCartBeforeChange'
import { giftCardCartBeforeChange } from '@/collections/Carts/giftCardCartBeforeChange'
import { inventoryCartBeforeChange } from '@/collections/Carts/inventoryCartBeforeChange'
import { loyaltyCartBeforeChange } from '@/collections/Carts/loyaltyCartBeforeChange'
import { promoCartBeforeChange } from '@/collections/Carts/promoCartBeforeChange'
import { decrementInventoryOnOrderCreate } from '@/collections/Orders/decrementInventoryOnOrderCreate'
import { assertGiftCardBeforeCreate } from '@/collections/Orders/assertGiftCardBeforeCreate'
import { assertInventoryBeforeCreate } from '@/collections/Orders/assertInventoryBeforeCreate'
import { assertLoyaltyBeforeCreate } from '@/collections/Orders/assertLoyaltyBeforeCreate'
import { earnLoyaltyOnOrderStatus } from '@/collections/Orders/earnLoyaltyOnOrderStatus'
import { earnReferralRewards } from '@/collections/Orders/earnReferralRewards'
import { enrichOrderGiftCardFromCart } from '@/collections/Orders/enrichOrderGiftCardFromCart'
import { enrichOrderLoyaltyFromCart } from '@/collections/Orders/enrichOrderLoyaltyFromCart'
import { enrichOrderPromoFromCart } from '@/collections/Orders/enrichOrderPromoFromCart'
import { redeemGiftCardOnOrderCreate } from '@/collections/Orders/redeemGiftCardOnOrderCreate'
import { notifyOrderDeliveredSms, notifyOrderPlacedSms } from '@/collections/Orders/notifyOrderSms'
import { notifyOrderShipped } from '@/collections/Orders/notifyOrderShipped'
import { redeemLoyaltyOnOrderCreate } from '@/collections/Orders/redeemLoyaltyOnOrderCreate'
import { sendOrderConfirmationEmail } from '@/collections/Orders/sendOrderConfirmationEmail'
import { ProductsCollection } from '@/collections/Products'
import { VariantsCollection } from '@/collections/Variants'
import { ecommerceCurrenciesConfig } from '@/lib/ecommerceCurrency'
import { afterFormSubmissionEsp } from '@/lib/marketing/afterFormSubmissionEsp'
import { Page, Post, Product } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'

const siteTitle = process.env.SITE_NAME || process.env.COMPANY_NAME || 'Store'

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

  if (collectionSlug === 'products') {
    return `${url}/products/${slug}`
  }

  return `${url}/${slug}`
}

const orderStatusOptions = [
  {
    label: 'Processing',
    value: 'processing',
  },
  {
    label: 'Shipped',
    value: 'shipped',
  },
  {
    label: 'Delivered',
    value: 'delivered',
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
      access: staffCollectionAccess('form-submissions'),
      admin: {
        group: 'Content',
      },
      hooks: {
        afterChange: [afterFormSubmissionEsp],
      },
    },
    formOverrides: {
      access: staffCollectionAccess('forms'),
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
      addressesCollectionOverride: ({ defaultCollection }) => ({
        ...defaultCollection,
        access: {
          ...(defaultCollection.access ?? {}),
          admin: staffCanViewAdminPage('orders'),
          create: adminOrStaff('orders', 'create'),
          read: staffOrDocumentOwner('orders', 'view', 'customer'),
          update: adminOrStaff('orders', 'update'),
          delete: adminOrStaff('orders', 'delete'),
        },
      }),
    },
    customers: {
      slug: 'users',
    },
    carts: {
      cartsCollectionOverride: ({ defaultCollection }) => {
        const defaultAccess = defaultCollection.access ?? {}
        return {
        ...defaultCollection,
        access: {
          ...defaultAccess,
          admin: staffCanViewAdminPage('carts'),
          create: accessOr(
            defaultAccess.create ?? (() => false),
            adminOrStaff('carts', 'create'),
          ),
          read: accessOr(
            defaultAccess.read ?? (() => false),
            adminOrStaff('carts', 'read'),
          ),
          update: accessOr(
            defaultAccess.update ?? (() => false),
            adminOrStaff('carts', 'update'),
          ),
          delete: accessOr(
            defaultAccess.delete ?? (() => false),
            adminOrStaff('carts', 'delete'),
          ),
        },
        hooks: {
          ...defaultCollection.hooks,
          beforeChange: [
            ...(defaultCollection.hooks?.beforeChange ?? []),
            inventoryCartBeforeChange,
            bundleCartBeforeChange,
            promoCartBeforeChange,
            loyaltyCartBeforeChange,
            giftCardCartBeforeChange,
          ],
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
              update: adminOnlyFieldAccess,
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
                update: adminOnlyFieldAccess,
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
                update: adminOnlyFieldAccess,
              },
              admin: {
                position: 'sidebar',
                readOnly: true,
              },
            },
          }),
          {
            name: 'appliedLoyaltyPoints',
            type: 'number',
            admin: {
              position: 'sidebar',
              description: 'Loyalty points applied at checkout.',
            },
            min: 0,
          },
          amountField({
            currenciesConfig: ecommerceCurrenciesConfig,
            overrides: {
              name: 'loyaltyDiscountAmount',
              label: 'Loyalty discount amount',
              access: {
                update: adminOnlyFieldAccess,
              },
              admin: {
                position: 'sidebar',
                readOnly: true,
              },
            },
          }),
          {
            name: 'appliedGiftCardCode',
            type: 'text',
            admin: { position: 'sidebar' },
          },
          {
            name: 'giftCard',
            type: 'relationship',
            relationTo: 'gift-cards',
            admin: { position: 'sidebar', readOnly: true },
          },
          amountField({
            currenciesConfig: ecommerceCurrenciesConfig,
            overrides: {
              name: 'giftCardDiscountAmount',
              label: 'Gift card discount',
              access: { update: adminOnlyFieldAccess },
              admin: { position: 'sidebar', readOnly: true },
            },
          }),
          {
            name: 'appliedBundle',
            type: 'relationship',
            relationTo: 'product-bundles',
            admin: { position: 'sidebar' },
          },
          amountField({
            currenciesConfig: ecommerceCurrenciesConfig,
            overrides: {
              name: 'bundleDiscountAmount',
              label: 'Bundle discount',
              access: { update: adminOnlyFieldAccess },
              admin: { position: 'sidebar', readOnly: true },
            },
          }),
          {
            name: 'abandonedCartEmailSentAt',
            type: 'date',
            admin: {
              position: 'sidebar',
              readOnly: true,
              description: 'Set when an abandoned-cart recovery email was sent.',
            },
          },
        ],
        }
      }
    },
    orders: {
      ordersCollectionOverride: ({ defaultCollection }) => ({
        ...defaultCollection,
        access: {
          ...(defaultCollection.access ?? {}),
          admin: staffCanViewAdminPage('orders'),
          create: adminOrStaff('orders', 'create'),
          read: adminOrStaff('orders', 'read'),
          update: adminOrStaff('orders', 'update'),
          delete: adminOrStaff('orders', 'delete'),
        },
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
            assertInventoryBeforeCreate,
            assertGiftCardBeforeCreate,
            assertLoyaltyBeforeCreate,
            trackOrderStatusTimeline,
          ],
          afterChange: [
            ...(defaultCollection.hooks?.afterChange ?? []),
            enrichOrderPromoFromCart,
            enrichOrderLoyaltyFromCart,
            enrichOrderGiftCardFromCart,
            decrementInventoryOnOrderCreate,
            redeemLoyaltyOnOrderCreate,
            redeemGiftCardOnOrderCreate,
            sendOrderConfirmationEmail,
            notifyOrderPlacedSms,
            notifyOrderShipped,
            notifyOrderDeliveredSms,
            earnLoyaltyOnOrderStatus,
            earnReferralRewards,
          ],
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
            name: 'appliedLoyaltyPoints',
            type: 'number',
            admin: {
              position: 'sidebar',
              readOnly: true,
            },
            min: 0,
          },
          amountField({
            currenciesConfig: ecommerceCurrenciesConfig,
            overrides: {
              name: 'loyaltyDiscountAmount',
              label: 'Loyalty discount amount',
              admin: {
                position: 'sidebar',
                readOnly: true,
              },
            },
          }),
          {
            name: 'loyaltyPointsEarned',
            type: 'number',
            admin: {
              position: 'sidebar',
              readOnly: true,
            },
            min: 0,
          },
          {
            name: 'appliedGiftCardCode',
            type: 'text',
            admin: { position: 'sidebar', readOnly: true },
          },
          {
            name: 'giftCard',
            type: 'relationship',
            relationTo: 'gift-cards',
            admin: { position: 'sidebar', readOnly: true },
          },
          amountField({
            currenciesConfig: ecommerceCurrenciesConfig,
            overrides: {
              name: 'giftCardDiscountAmount',
              label: 'Gift card discount',
              admin: { position: 'sidebar', readOnly: true },
            },
          }),
          {
            name: 'checkoutBatchId',
            type: 'text',
            admin: {
              description:
                'Shared when one checkout creates multiple orders (different shipment profiles).',
              position: 'sidebar',
              readOnly: true,
            },
          },
          {
            name: 'checkoutShipmentSummary',
            type: 'json',
            admin: {
              description:
                'Shipment group, delivery prefs, and charge lines (base + cumulative) for this order.',
              position: 'sidebar',
              readOnly: true,
            },
          },
          {
            name: 'shipmentName',
            type: 'text',
            virtual: true,
            admin: {
              position: 'sidebar',
              readOnly: true,
            },
            hooks: {
              afterRead: [
                ({ data, value }) => {
                  if (value) return value
                  const summary = data?.checkoutShipmentSummary
                  if (summary && typeof summary === 'object' && 'shipmentGroup' in summary) {
                    const group = (summary as Record<string, unknown>).shipmentGroup
                    if (group && typeof group === 'object' && 'shipmentName' in group) {
                      return String((group as Record<string, unknown>).shipmentName ?? '')
                    }
                  }
                  return null
                },
              ],
            },
          },
          {
            name: 'shipmentCharge',
            type: 'text',
            virtual: true,
            admin: {
              position: 'sidebar',
              readOnly: true,
            },
            hooks: {
              afterRead: [
                ({ data, value }) => {
                  if (value) return value
                  const summary = data?.checkoutShipmentSummary
                  if (summary && typeof summary === 'object' && 'shipmentGroup' in summary) {
                    const group = (summary as Record<string, unknown>).shipmentGroup
                    if (group && typeof group === 'object' && 'shippingTotalBdt' in group) {
                      const charge = (group as Record<string, unknown>).shippingTotalBdt
                      return charge !== null && charge !== undefined ? `৳${charge}` : null
                    }
                  }
                  return null
                },
              ],
            },
          },
          {
            name: 'fulfillment',
            type: 'group',
            label: 'Fulfillment',
            fields: [
              {
                name: 'trackingNumber',
                type: 'text',
                label: 'Tracking number',
              },
              {
                name: 'carrier',
                type: 'select',
                label: 'Carrier',
                options: [
                  { label: 'Manual / Other', value: 'manual' },
                  { label: 'Steadfast', value: 'steadfast' },
                  { label: 'Pathao', value: 'pathao' },
                  { label: 'RedX', value: 'redx' },
                ],
              },
              {
                name: 'shippedAt',
                type: 'date',
                admin: {
                  date: { pickerAppearance: 'dayAndTime' },
                },
              },
              {
                name: 'internalNote',
                type: 'textarea',
                access: {
                  read: adminOrStaffField('orders', 'view'),
                  update: adminOrStaffField('orders', 'edit'),
                },
                admin: {
                  description: 'Internal note for fulfillment staff (not shown to customers).',
                },
              },
            ],
          },
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
        access: {
          ...(defaultCollection.access ?? {}),
          admin: staffCanViewAdminPage('transactions'),
          create: adminOrStaff('transactions', 'create'),
          read: adminOrStaff('transactions', 'read'),
          update: adminOrStaff('transactions', 'update'),
          delete: adminOrStaff('transactions', 'delete'),
        },
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
              description:
                'Shared when one checkout creates multiple orders (different shipment profiles).',
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
          {
            name: 'shipmentName',
            type: 'text',
            virtual: true,
            admin: {
              position: 'sidebar',
              readOnly: true,
            },
            hooks: {
              afterRead: [
                ({ data, value }) => {
                  if (value) return value
                  const summary = data?.checkoutShipmentSummary
                  if (summary && typeof summary === 'object' && 'shipmentGroup' in summary) {
                    const group = (summary as Record<string, unknown>).shipmentGroup
                    if (group && typeof group === 'object' && 'shipmentName' in group) {
                      return String((group as Record<string, unknown>).shipmentName ?? '')
                    }
                  }
                  return null
                },
              ],
            },
          },
          {
            name: 'shipmentCharge',
            type: 'text',
            virtual: true,
            admin: {
              position: 'sidebar',
              readOnly: true,
            },
            hooks: {
              afterRead: [
                ({ data, value }) => {
                  if (value) return value
                  const summary = data?.checkoutShipmentSummary
                  if (summary && typeof summary === 'object' && 'shipmentGroup' in summary) {
                    const group = (summary as Record<string, unknown>).shipmentGroup
                    if (group && typeof group === 'object' && 'shippingTotalBdt' in group) {
                      const charge = (group as Record<string, unknown>).shippingTotalBdt
                      return charge !== null && charge !== undefined ? `৳${charge}` : null
                    }
                  }
                  return null
                },
              ],
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
  appendQuoteRequestsAfterProductsPlugin(),
  appendReturnRequestsAfterProductsPlugin(),
  appendLoyaltyTransactionsAfterProductsPlugin(),
  appendRecentlyViewedAfterProductsPlugin(),
  appendProductQuestionsAfterProductsPlugin(),
  appendGiftCardsAfterProductsPlugin(),
  appendProductBundlesAfterProductsPlugin(),
  appendSubscriptionsAfterProductsPlugin(),
  appendShipmentsAfterTransactionsPlugin(),
  orderEcommerceCollectionsPlugin(),
  appendAnalysisAfterEcommercePlugin(),
  appendNotificationsAfterEcommercePlugin(),
  enforceStaffAdminNavPlugin(),
]
