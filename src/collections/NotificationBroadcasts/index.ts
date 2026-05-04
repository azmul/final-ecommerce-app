import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access/isAdmin'

export const NotificationBroadcasts: CollectionConfig = {
  slug: 'notification-broadcasts',
  admin: {
    group: 'Notifications',
    defaultColumns: ['title', 'status', 'scheduledFor', 'updatedAt'],
    useAsTitle: 'title',
    description:
      'Schedule or send store-wide notifications. “Scheduled” rows are processed by the notifications cron job (see CRON_SECRET).',
  },
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: isAdmin,
    update: isAdmin,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'body',
      type: 'textarea',
      required: true,
    },
    {
      name: 'linkUrl',
      type: 'text',
      admin: {
        description: 'Optional path or URL.',
      },
    },
    {
      name: 'scheduledFor',
      type: 'date',
      index: true,
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        description: 'When status is “Scheduled”, sends at or after this time (UTC).',
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      required: true,
      index: true,
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Scheduled', value: 'scheduled' },
        { label: 'Sending', value: 'sending' },
        { label: 'Completed', value: 'completed' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
    },
    {
      name: 'segment',
      type: 'select',
      defaultValue: 'push_enabled',
      required: true,
      options: [
        {
          label: 'Users with push enabled',
          value: 'push_enabled',
        },
        {
          label: 'Users with push + marketing opt-in',
          value: 'marketing_opt_in',
        },
      ],
    },
    {
      name: 'statsRecipients',
      type: 'number',
      admin: {
        description: 'Filled automatically after a run.',
        readOnly: true,
      },
      defaultValue: 0,
      min: 0,
    },
    {
      name: 'lastError',
      type: 'textarea',
      admin: {
        readOnly: true,
      },
    },
  ],
  timestamps: true,
}
