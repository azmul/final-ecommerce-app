import { CallToAction } from '@/blocks/CallToAction/config'
import { Content } from '@/blocks/Content/config'
import { MediaBlock } from '@/blocks/MediaBlock/config'
import { generatePreviewPath } from '@/utilities/generatePreviewPath'
import { CollectionOverride } from '@payloadcms/plugin-ecommerce/types'
import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'
import {
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import { afterChangeProductNotifications } from '@/collections/Products/hooks/afterChangeProductNotifications'
import {
  revalidateProductPaths,
  revalidateProductPathsDelete,
} from '@/collections/Products/hooks/revalidateProductPaths'
import { stashProductNotificationSnapshot } from '@/collections/Products/hooks/stashProductNotificationSnapshot'
import { syncCategoriesSubcategories } from '@/collections/Products/syncCategoriesSubcategories'
import { adminOrPublishedStatus } from '@/access/adminOrPublishedStatus'
import { adminOrStaff, staffCanViewAdminPage } from '@/access/staffAccess'
import { DefaultDocumentIDType, slugField, Where } from 'payload'

export const ProductsCollection: CollectionOverride = ({ defaultCollection }) => ({
  ...defaultCollection,
  access: {
    ...(defaultCollection.access ?? {}),
    admin: staffCanViewAdminPage('products'),
    create: adminOrStaff('products', 'create'),
    read: adminOrPublishedStatus,
    update: adminOrStaff('products', 'update'),
    delete: adminOrStaff('products', 'delete'),
  },
  hooks: {
    ...defaultCollection.hooks,
    afterChange: [
      ...(defaultCollection.hooks?.afterChange ?? []),
      revalidateProductPaths,
      afterChangeProductNotifications,
    ],
    afterDelete: [
      ...(defaultCollection.hooks?.afterDelete ?? []),
      revalidateProductPathsDelete,
    ],
    beforeChange: [
      stashProductNotificationSnapshot,
      ...(defaultCollection.hooks?.beforeChange ?? []),
      syncCategoriesSubcategories,
    ],
  },
  admin: {
    ...defaultCollection?.admin,
    components: {
      ...defaultCollection?.admin?.components,
      beforeListTable: [
        ...(defaultCollection?.admin?.components?.beforeListTable ?? []),
        '@/components/admin/ProductDateRangeFilter#ProductDateRangeFilter',
      ],
    },
    defaultColumns: ['title', 'enableVariants', '_status', 'variants.variants'],
    livePreview: {
      url: ({ data, req }) =>
        generatePreviewPath({
          slug: data?.slug,
          collection: 'products',
          req,
        }),
    },
    preview: (data, { req }) =>
      generatePreviewPath({
        slug: data?.slug as string,
        collection: 'products',
        req,
      }),
    useAsTitle: 'title',
  },
  defaultPopulate: {
    ...defaultCollection?.defaultPopulate,
    title: true,
    slug: true,
    variantOptions: true,
    variants: true,
    enableVariants: true,
    gallery: true,
    brand: true,
    priceInBDT: true,
    discountPercentage: true,
    productBadge: true,
    inventory: true,
    meta: true,
    subcategories: true,
    technicalSpecs: true,
    relatedProducts: true,
    shipment: true,
    reviewAverageRating: true,
    reviewCount: true,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      type: 'tabs',
      tabs: [
        {
          fields: [
            {
              name: 'description',
              type: 'richText',
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                    FixedToolbarFeature(),
                    InlineToolbarFeature(),
                    HorizontalRuleFeature(),
                  ]
                },
              }),
              label: false,
              required: false,
            },
            {
              name: 'gallery',
              type: 'array',
              minRows: 1,
              fields: [
                {
                  name: 'image',
                  type: 'upload',
                  relationTo: 'media',
                  required: true,
                },
                {
                  name: 'variantOption',
                  type: 'relationship',
                  relationTo: 'variantOptions',
                  admin: {
                    condition: (data) => {
                      return data?.enableVariants === true && data?.variantTypes?.length > 0
                    },
                  },
                  filterOptions: ({ data }) => {
                    if (data?.enableVariants && data?.variantTypes?.length) {
                      const variantTypeIDs = data.variantTypes.map((item: any) => {
                        if (typeof item === 'object' && item?.id) {
                          return item.id
                        }
                        return item
                      }) as DefaultDocumentIDType[]

                      if (variantTypeIDs.length === 0)
                        return {
                          variantType: {
                            in: [],
                          },
                        }

                      const query: Where = {
                        variantType: {
                          in: variantTypeIDs,
                        },
                      }

                      return query
                    }

                    return {
                      variantType: {
                        in: [],
                      },
                    }
                  },
                },
              ],
            },

            {
              name: 'layout',
              type: 'blocks',
              blocks: [CallToAction, Content, MediaBlock],
            },
          ],
          label: 'Content',
        },
        {
          fields: [
            ...defaultCollection.fields,
            {
              name: 'discountPercentage',
              type: 'number',
              admin: {
                description: 'Optional discount percentage shown as "Save X%" on product cards.',
                step: 1,
              },
              label: 'Discount Percentage',
              max: 100,
              min: 0,
            },
            {
              name: 'productBadge',
              type: 'text',
              admin: {
                description:
                  'Optional badge text shown on product cards, for example "Best Selling".',
              },
              label: 'Product Badge',
            },
            {
              name: 'technicalSpecs',
              type: 'array',
              admin: {
                description:
                  'Optional rows shown on the product comparison page (e.g. Material, Weight).',
                initCollapsed: false,
              },
              fields: [
                {
                  name: 'label',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'value',
                  type: 'text',
                  required: true,
                },
              ],
              labels: {
                plural: 'Technical specs',
                singular: 'Technical spec',
              },
            },
            {
              name: 'relatedProducts',
              type: 'relationship',
              filterOptions: ({ id }) => {
                if (id) {
                  return {
                    id: {
                      not_in: [id],
                    },
                  }
                }

                // ID comes back as undefined during seeding so we need to handle that case
                return {
                  id: {
                    exists: true,
                  },
                }
              },
              hasMany: true,
              relationTo: 'products',
            },
            {
              name: 'reviewAverageRating',
              type: 'number',
              admin: {
                description:
                  'Rolling average of approved star ratings (1–5). Maintained automatically.',
                readOnly: true,
              },
              label: 'Average rating',
              max: 5,
              min: 1,
            },
            {
              name: 'reviewCount',
              type: 'number',
              admin: {
                description: 'Count of approved reviews. Maintained automatically.',
                readOnly: true,
              },
              defaultValue: 0,
              label: 'Approved review count',
              min: 0,
            },
          ],
          label: 'Product Details',
        },
        {
          name: 'meta',
          label: 'SEO',
          fields: [
            OverviewField({
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
              imagePath: 'meta.image',
            }),
            MetaTitleField({
              hasGenerateFn: true,
            }),
            MetaImageField({
              relationTo: 'media',
            }),

            MetaDescriptionField({}),
            PreviewField({
              // if the `generateUrl` function is configured
              hasGenerateFn: true,

              // field paths to match the target field for data
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
            }),
          ],
        },
      ],
    },
    {
      name: 'categories',
      type: 'relationship',
      admin: {
        description: 'Pick at least one category before assigning subcategories below.',
        position: 'sidebar',
        sortOptions: 'title',
      },
      hasMany: true,
      relationTo: 'categories',
    },
    {
      name: 'subcategories',
      type: 'relationship',
      admin: {
        description:
          'Filter options reflect the categories chosen above (select categories first).',
        position: 'sidebar',
        sortOptions: 'title',
      },
      filterOptions: ({ data }) => {
        const categories = data?.categories
        if (!Array.isArray(categories) || categories.length === 0) {
          return {
            id: {
              in: [],
            },
          }
        }

        const ids = categories.map((item: unknown) => {
          if (typeof item === 'object' && item !== null && 'id' in item) {
            return (item as { id: DefaultDocumentIDType }).id
          }
          return item as DefaultDocumentIDType
        }) as DefaultDocumentIDType[]

        const query: Where = {
          parent: {
            in: ids,
          },
        }

        return query
      },
      hasMany: true,
      relationTo: 'subcategories',
    },
    {
      name: 'brand',
      type: 'relationship',
      admin: {
        position: 'sidebar',
        sortOptions: 'title',
      },
      relationTo: 'brands',
    },
    {
      name: 'shipment',
      type: 'relationship',
      relationTo: 'shipments',
      admin: {
        description:
          'Delivery pricing profile (Dhaka / outside Dhaka charges and cumulative rules). Used for checkout when this product is in the cart.',
        position: 'sidebar',
        sortOptions: 'shippingName',
      },
    },
    slugField(),
  ],
})
