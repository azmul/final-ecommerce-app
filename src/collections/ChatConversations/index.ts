import type { CollectionConfig } from 'payload'

import {
  chatApiOnlyWrite,
  chatConversationsCustomerRead,
  chatConversationsStaffDelete,
  chatConversationsStaffRead,
  chatConversationsStaffUpdate,
} from '@/access/chatAccess'
import { staffCanViewAdminPage } from '@/access/staffAccess'

export const ChatConversations: CollectionConfig = {
  slug: 'chat-conversations',
  admin: {
    defaultColumns: ['status', 'customer', 'assignedAgent', 'lastMessageAt', 'unreadByAgent'],
    group: 'Support',
    useAsTitle: 'subject',
  },
  labels: {
    plural: 'Chat Conversations',
    singular: 'Chat Conversation',
  },
  access: {
    admin: staffCanViewAdminPage('chat'),
    create: chatApiOnlyWrite,
    delete: chatConversationsStaffDelete,
    read: ({ req }) => {
      const read = chatConversationsCustomerRead({ req })
      if (read === false) {
        return chatConversationsStaffRead({ req })
      }
      return read
    },
    update: chatConversationsStaffUpdate,
  },
  fields: [
    {
      name: 'status',
      type: 'select',
      defaultValue: 'open',
      index: true,
      options: [
        { label: 'Open', value: 'open' },
        { label: 'Pending', value: 'pending' },
        { label: 'Resolved', value: 'resolved' },
        { label: 'Closed', value: 'closed' },
      ],
      required: true,
    },
    {
      name: 'customer',
      type: 'relationship',
      index: true,
      relationTo: 'users',
    },
    {
      name: 'guestSessionId',
      type: 'text',
      index: true,
      admin: {
        description: 'Browser session id for guest shoppers.',
      },
    },
    {
      name: 'assignedAgent',
      type: 'relationship',
      index: true,
      relationTo: 'users',
    },
    {
      name: 'subject',
      type: 'text',
    },
    {
      name: 'context',
      type: 'group',
      fields: [
        {
          name: 'pageUrl',
          type: 'text',
        },
        {
          name: 'productSlug',
          type: 'text',
        },
        {
          name: 'cart',
          type: 'relationship',
          relationTo: 'carts',
        },
        {
          name: 'order',
          type: 'relationship',
          relationTo: 'orders',
        },
        {
          name: 'guestOrderAccessToken',
          type: 'text',
          admin: {
            description: 'Verified guest order access token when linked from find-order flow.',
          },
        },
      ],
    },
    {
      name: 'lastMessageAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
      index: true,
    },
    {
      name: 'lastMessagePreview',
      type: 'text',
      maxLength: 200,
    },
    {
      name: 'unreadByCustomer',
      type: 'number',
      defaultValue: 0,
      min: 0,
    },
    {
      name: 'unreadByAgent',
      type: 'number',
      defaultValue: 0,
      min: 0,
    },
  ],
  timestamps: true,
}
