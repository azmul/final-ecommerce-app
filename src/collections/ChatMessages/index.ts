import type { CollectionConfig } from 'payload'

import {
  chatMessagesApiOnlyWrite,
  chatMessagesCustomerRead,
  chatMessagesStaffRead,
} from '@/access/chatAccess'
import { staffCanViewAdminPage } from '@/access/staffAccess'

export const ChatMessages: CollectionConfig = {
  slug: 'chat-messages',
  admin: {
    defaultColumns: ['conversation', 'senderType', 'sender', 'createdAt'],
    group: 'Notifications',
    useAsTitle: 'body',
  },
  labels: {
    plural: 'Chat Messages',
    singular: 'Chat Message',
  },
  access: {
    admin: staffCanViewAdminPage('chat'),
    create: chatMessagesApiOnlyWrite,
    delete: chatMessagesApiOnlyWrite,
    read: ({ req }) => {
      const read = chatMessagesCustomerRead({ req })
      if (read === false) {
        return chatMessagesStaffRead({ req })
      }
      return read
    },
    update: chatMessagesApiOnlyWrite,
  },
  fields: [
    {
      name: 'conversation',
      type: 'relationship',
      index: true,
      relationTo: 'chat-conversations',
      required: true,
    },
    {
      name: 'senderType',
      type: 'select',
      options: [
        { label: 'Customer', value: 'customer' },
        { label: 'Agent', value: 'agent' },
        { label: 'System', value: 'system' },
      ],
      required: true,
    },
    {
      name: 'sender',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'body',
      type: 'textarea',
      required: true,
    },
  ],
  timestamps: true,
}
