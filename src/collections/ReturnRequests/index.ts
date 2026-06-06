import { staffCollectionAccess } from '@/lib/permissions/collectionAccess'
import type { CollectionConfig } from 'payload'

import { notifyCustomerOnReturnRequest } from './hooks/notifyCustomerOnReturnRequest'
import { notifyCustomerOnReturnStatus } from './hooks/notifyCustomerOnReturnStatus'
import { notifyStaffOnReturnRequest } from './hooks/notifyStaffOnReturnRequest'
import { processReturnApprovalOnDecision } from './hooks/processReturnApprovalOnDecision'
import { syncOrderStatusOnReturnDecision } from './hooks/syncOrderStatusOnReturnDecision'

export const ReturnRequests: CollectionConfig = {
  slug: 'return-requests',
  admin: {
    defaultColumns: ['status', 'requestType', 'order', 'reason', 'customer', 'createdAt'],
    description: 'Customer cancellation and return/refund requests from order pages.',
    group: 'Ecommerce',
    useAsTitle: 'id',
  },
  access: staffCollectionAccess('return-requests'),
  hooks: {
    afterChange: [
      notifyCustomerOnReturnRequest,
      notifyStaffOnReturnRequest,
      syncOrderStatusOnReturnDecision,
      processReturnApprovalOnDecision,
      notifyCustomerOnReturnStatus,
    ],
  },
  fields: [
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      index: true,
      options: [
        { label: 'Pending review', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
      ],
      required: true,
    },
    {
      name: 'requestType',
      type: 'select',
      index: true,
      options: [
        { label: 'Cancel order', value: 'cancel' },
        { label: 'Return / refund', value: 'return' },
      ],
      required: true,
    },
    {
      name: 'order',
      type: 'relationship',
      index: true,
      relationTo: 'orders',
      required: true,
    },
    {
      name: 'customer',
      type: 'relationship',
      admin: {
        readOnly: true,
      },
      relationTo: 'users',
    },
    {
      name: 'guestEmail',
      type: 'email',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'items',
      type: 'array',
      admin: {
        description: 'Line items included in this request (full order when all items are listed).',
      },
      fields: [
        {
          name: 'orderItemId',
          type: 'text',
          required: true,
        },
        {
          name: 'product',
          type: 'relationship',
          relationTo: 'products',
          required: true,
        },
        {
          name: 'variant',
          type: 'relationship',
          relationTo: 'variants',
        },
        {
          name: 'quantity',
          type: 'number',
          min: 1,
          required: true,
        },
      ],
      labels: {
        plural: 'Items',
        singular: 'Item',
      },
    },
    {
      name: 'reason',
      type: 'select',
      options: [
        { label: 'Changed my mind', value: 'changed_mind' },
        { label: 'Wrong item received', value: 'wrong_item' },
        { label: 'Damaged or defective', value: 'damaged' },
        { label: 'Not as described', value: 'not_as_described' },
        { label: 'Missing parts', value: 'missing_parts' },
        { label: 'Other', value: 'other' },
      ],
      required: true,
    },
    {
      name: 'details',
      type: 'textarea',
    },
    {
      name: 'photos',
      type: 'upload',
      hasMany: true,
      relationTo: 'media',
      admin: {
        description: 'Optional photos from the customer (damage, wrong item, etc.).',
      },
    },
    {
      name: 'staffNote',
      type: 'textarea',
      admin: {
        description: 'Internal note for staff (not shown to the customer).',
      },
    },
    {
      name: 'resolutionNote',
      type: 'textarea',
      admin: {
        description: 'Optional message shown to the customer when a request is rejected.',
      },
    },
    {
      name: 'financialStatus',
      type: 'select',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
      options: [
        { label: 'Restocked only', value: 'restocked_only' },
        { label: 'Refunded (Stripe)', value: 'refunded' },
        { label: 'Manual refund required', value: 'manual_refund_required' },
      ],
    },
    {
      name: 'refundAmount',
      type: 'number',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'stripeRefundId',
      type: 'text',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'restockedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'financialProcessedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
  ],
  labels: {
    plural: 'Return Requests',
    singular: 'Return Request',
  },
}
