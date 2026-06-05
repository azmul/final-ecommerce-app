import type { Field } from 'payload'

export const reorderLevelField = (): Field => ({
  name: 'reorderLevel',
  type: 'number',
  min: 0,
  admin: {
    description: 'Low-stock alert threshold. Dashboard alerts when inventory is at or below this level.',
    position: 'sidebar',
  },
  defaultValue: 5,
})

export const inventoryByLocationField = (): Field => ({
  name: 'inventoryByLocation',
  type: 'array',
  admin: {
    description:
      'Optional per-warehouse stock. When rows exist, total available stock is the sum of quantities.',
  },
  fields: [
    {
      name: 'location',
      type: 'relationship',
      relationTo: 'stock-locations',
      required: true,
    },
    {
      name: 'quantity',
      type: 'number',
      min: 0,
      required: true,
      defaultValue: 0,
    },
  ],
  labels: {
    plural: 'Stock by location',
    singular: 'Stock by location',
  },
})
