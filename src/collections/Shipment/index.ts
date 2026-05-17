import { APIError, type CollectionConfig } from 'payload'

import { staffPublicCollectionAccess } from '@/lib/permissions/collectionAccess'

/** When free delivery is on, stored charge amounts are persisted as zero for consistency. */
function applyFreeDeliveryCharges<T extends Record<string, unknown>>(data: T): T {
  if (!data.freeDelivery) {
    return data
  }
  return {
    ...data,
    dhakaPointDeliveryCharge: 0,
    dhakaHomeDeliveryCharge: 0,
    outsideDhakaPointDeliveryCharge: 0,
    outsideDhakaHomeDeliveryCharge: 0,
    cumulativeCharge: 0,
  }
}

export const Shipments: CollectionConfig = {
  slug: 'shipments',
  labels: {
    singular: 'Shipment',
    plural: 'Shipments',
  },
  admin: {
    group: 'Ecommerce',
    useAsTitle: 'shippingName',
    defaultColumns: [
      'shippingName',
      'freeDelivery',
      'dhakaHomeDeliveryCharge',
      'outsideDhakaHomeDeliveryCharge',
      'updatedAt',
    ],
    description:
      'Delivery charge profiles by zone (Dhaka vs outside Dhaka, point vs home). Use cumulative rules to add extra freight by product count.',
  },
  access: staffPublicCollectionAccess('shipments'),
  hooks: {
    beforeValidate: [
      ({ data }) => {
        const d = data as Record<string, unknown> | undefined
        if (!d) return data
        const count = d.cumulativeCount
        const extra = d.cumulativeCharge
        if (
          typeof extra === 'number' &&
          !Number.isNaN(extra) &&
          extra > 0 &&
          (typeof count !== 'number' || count < 1 || !Number.isInteger(count))
        ) {
          throw new APIError(
            'Cumulative count must be a whole number ≥ 1 when cumulative charge is greater than 0.',
            400,
          )
        }
        return data
      },
    ],
    beforeChange: [
      ({ data }) => {
        if (!data) return data
        return applyFreeDeliveryCharges(data as Record<string, unknown>)
      },
    ],
  },
  fields: [
    {
      name: 'shippingName',
      type: 'text',
      required: true,
      label: 'Shipping Name',
    },
    {
      type: 'collapsible',
      label: 'Dhaka delivery charges',
      admin: { initCollapsed: false },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'dhakaPointDeliveryCharge',
              type: 'number',
              label: 'Dhaka – Point delivery charge',
              min: 0,
              defaultValue: 0,
              admin: {
                width: '50%',
                step: 1,
                description: 'Pickup / point delivery in BDT.',
              },
            },
            {
              name: 'dhakaHomeDeliveryCharge',
              type: 'number',
              label: 'Dhaka – Home delivery charge',
              min: 0,
              defaultValue: 0,
              admin: {
                width: '50%',
                step: 1,
                description: 'Door-to-door in Dhaka metro (BDT).',
              },
            },
          ],
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Outside Dhaka delivery charges',
      admin: { initCollapsed: false },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'outsideDhakaPointDeliveryCharge',
              type: 'number',
              label: 'Outside Dhaka – Point delivery charge',
              min: 0,
              defaultValue: 0,
              admin: { width: '50%', step: 1 },
            },
            {
              name: 'outsideDhakaHomeDeliveryCharge',
              type: 'number',
              label: 'Outside Dhaka – Home delivery charge',
              min: 0,
              defaultValue: 0,
              admin: { width: '50%', step: 1 },
            },
          ],
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Free delivery',
      admin: {
        initCollapsed: false,
        description:
          'When enabled, all zone delivery charges and the cumulative surcharge are treated as zero (saved values are cleared to match).',
      },
      fields: [
        {
          name: 'freeDelivery',
          type: 'checkbox',
          label: 'Free delivery',
          defaultValue: false,
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Cumulative charge rules',
      admin: {
        initCollapsed: false,
        description:
          'Adds extra freight by item count (e.g. count 2 and charge 20 → +৳20 for every 2 products, on top of the base zone rate). Disabled when cumulative count is empty or cumulative charge is 0.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'cumulativeCount',
              type: 'number',
              label: 'Cumulative count',
              min: 1,
              admin: {
                width: '50%',
                step: 1,
                description:
                  'How many products complete one increment (e.g. 2 → charge increases every 2 items).',
              },
            },
            {
              name: 'cumulativeCharge',
              type: 'number',
              label: 'Cumulative charge',
              min: 0,
              defaultValue: 0,
              admin: {
                width: '50%',
                step: 1,
                description: 'BDT added each time the cumulative count is reached.',
              },
            },
          ],
        },
      ],
    },
  ],
}
