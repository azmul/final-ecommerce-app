import type { CollectionConfig } from 'payload'

import {
  usersCreateAccess,
  usersDeleteAccess,
  usersReadAccess,
  usersUnlockAccess,
  usersUpdateAccess,
} from '@/access/adminStaffUsersAccess'
import { canAccessAdminPanel } from '@/access/canAccessAdminPanel'
import { adminOnlyFieldAccess } from '@/access/adminOnlyFieldAccess'
import { staffCanViewAdminPage } from '@/access/staffAccess'
import { getStaffActionOptions, getStaffPageOptions } from '@/lib/permissions/registry'
import { STAFF_ACTIONS } from '@/lib/permissions/types'

import { assignReferralCode } from './hooks/generateReferralCode'
import { createDefaultNotificationPreferences } from './hooks/createDefaultNotificationPreferences'
import { ensureFirstUserIsAdmin } from './hooks/ensureFirstUserIsAdmin'
import { populateStaffPermissionsFromGrants } from './hooks/populateStaffPermissionsFromGrants'
import { syncStaffPermissions } from './hooks/syncStaffPermissions'

export const Users: CollectionConfig = {
  slug: 'users',
  hooks: {
    beforeChange: [assignReferralCode, syncStaffPermissions],
    afterChange: [createDefaultNotificationPreferences],
    afterRead: [populateStaffPermissionsFromGrants],
  },
  access: {
    admin: (args) => {
      if (canAccessAdminPanel(args)) return true
      return Boolean(staffCanViewAdminPage('users')(args))
    },
    create: usersCreateAccess,
    delete: usersDeleteAccess,
    read: usersReadAccess,
    unlock: usersUnlockAccess,
    update: usersUpdateAccess,
  },
  admin: {
    group: 'Users',
    components: {
      beforeListTable: ['@/components/admin/UserDateRangeFilter#UserDateRangeFilter'],
    },
    defaultColumns: ['name', 'email', 'roles'],
    useAsTitle: 'name',
  },
  auth: {
    tokenExpiration: 86400,
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'phone',
      type: 'text',
    },
    {
      name: 'referralCode',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'referredBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'loyaltyPoints',
      type: 'number',
      admin: {
        description: 'Current loyalty points balance (updated by loyalty transactions).',
        position: 'sidebar',
        readOnly: true,
      },
      defaultValue: 0,
      min: 0,
    },
    {
      name: 'googleId',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        description: 'Google account subject ID for OAuth sign-in.',
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'facebookId',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        description: 'Facebook account ID for OAuth sign-in.',
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'address',
      type: 'textarea',
    },
    {
      name: 'roles',
      type: 'select',
      access: {
        create: adminOnlyFieldAccess,
        read: adminOnlyFieldAccess,
        update: adminOnlyFieldAccess,
      },
      defaultValue: ['customer'],
      hasMany: true,
      hooks: {
        beforeChange: [ensureFirstUserIsAdmin],
      },
      options: [
        {
          label: 'admin',
          value: 'admin',
        },
        {
          label: 'customer',
          value: 'customer',
        },
        {
          label: 'officeStaff',
          value: 'officeStaff',
        },
      ],
      saveToJWT: true,
    },
    {
      name: 'staffPermissions',
      type: 'json',
      saveToJWT: true,
      access: {
        create: adminOnlyFieldAccess,
        read: adminOnlyFieldAccess,
        update: adminOnlyFieldAccess,
      },
      admin: {
        description:
          'Page-level and action-level permissions for office staff. Only admins can edit.',
        components: {
          Field: '@/components/admin/StaffPermissionsField#StaffPermissionsField',
        },
      },
    },
    {
      name: 'staffGrants',
      type: 'array',
      access: {
        create: adminOnlyFieldAccess,
        read: adminOnlyFieldAccess,
        update: adminOnlyFieldAccess,
      },
      admin: {
        hidden: true,
        description: 'Synced from staffPermissions on save (relational storage).',
      },
      fields: [
        {
          name: 'page',
          type: 'select',
          options: getStaffPageOptions(),
          required: true,
        },
        {
          name: 'actions',
          type: 'select',
          hasMany: true,
          options: STAFF_ACTIONS.map((action) => ({
            label: action.charAt(0).toUpperCase() + action.slice(1),
            value: action,
          })),
          required: true,
          validate: (value, { siblingData }) => {
            const page = (siblingData as { page?: string })?.page
            if (!page || !Array.isArray(value)) return true
            const allowed = getStaffActionOptions(page as Parameters<typeof getStaffActionOptions>[0])
            const allowedValues = new Set(allowed.map((o) => o.value))
            const invalid = value.filter((v) => !allowedValues.has(v as (typeof allowed)[number]['value']))
            if (invalid.length > 0) {
              return `Invalid actions for page: ${invalid.join(', ')}`
            }
            return true
          },
        },
      ],
      labels: {
        plural: 'Permission grants',
        singular: 'Permission grant',
      },
    },
    {
      name: 'orders',
      type: 'join',
      collection: 'orders',
      on: 'customer',
      admin: {
        allowCreate: false,
        defaultColumns: ['id', 'createdAt', 'amount', 'currency', 'items'],
      },
    },
    {
      name: 'cart',
      type: 'join',
      collection: 'carts',
      on: 'customer',
      admin: {
        allowCreate: false,
        defaultColumns: ['id', 'createdAt', 'subtotal', 'currency', 'items'],
      },
    },
    {
      name: 'addresses',
      type: 'join',
      collection: 'addresses',
      on: 'customer',
      admin: {
        allowCreate: false,
        defaultColumns: ['id'],
      },
    },
    {
      name: 'wishlist',
      type: 'join',
      collection: 'wishlists',
      on: 'customer',
      admin: {
        allowCreate: false,
        defaultColumns: ['id', 'updatedAt'],
      },
    },
  ],
}
