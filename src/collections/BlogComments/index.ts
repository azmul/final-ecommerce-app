import type { CollectionBeforeValidateHook, CollectionConfig } from 'payload'

import { authenticated } from '@/access/authenticated'
import { adminOnlyField } from '@/access/adminOnly'
import { blogCommentsPublicRead } from '@/access/blogCommentsPublicRead'
import { commentOwnerOrAdminOrStaff } from '@/access/commentOwnerOrAdminOrStaff'
import { adminOrStaffAnyAction, staffCanViewAdminPage } from '@/access/staffAccess'
import { hasStaffPermission, isFullAdmin } from '@/lib/permissions/check'
import { checkRole } from '@/access/utilities'

import {
  revalidateBlogCommentPaths,
  revalidateBlogCommentPathsDelete,
} from './hooks/revalidateBlogCommentPaths'

type CommentIncoming = Record<string, unknown>

const normalizeCommentDraft: CollectionBeforeValidateHook = ({ data, operation, req }) => {
  if (!data || typeof data !== 'object') return data

  const base: CommentIncoming = { ...(data as CommentIncoming) }

  if (operation === 'create' && req?.user) {
    if (typeof base.body === 'string') {
      base.body = base.body.trim()
    }

    base.author = req.user.id

    if (
      !isFullAdmin(req.user) &&
      !hasStaffPermission(req.user, 'blog-comments', 'approve')
    ) {
      base.moderationStatus = 'pending'
    }
  }

  return base as typeof data
}

export const BlogComments: CollectionConfig = {
  slug: 'blog-comments',
  admin: {
    defaultColumns: ['moderationStatus', 'post', 'author', 'createdAt'],
    description:
      'Public comments appear on posts only after approval. Use the sidebar moderation status dropdown.',
    group: 'Content',
    useAsTitle: 'id',
  },
  labels: {
    plural: 'Blog Comments',
    singular: 'Blog Comment',
  },
  access: {
    admin: staffCanViewAdminPage('blog-comments'),
    create: authenticated,
    delete: commentOwnerOrAdminOrStaff('blog-comments'),
    read: blogCommentsPublicRead,
    update: adminOrStaffAnyAction('blog-comments', ['edit', 'approve']),
  },
  fields: [
    {
      name: 'post',
      type: 'relationship',
      index: true,
      relationTo: 'posts',
      required: true,
    },
    {
      name: 'author',
      type: 'relationship',
      admin: {
        description: 'Set automatically when a customer submits.',
      },
      relationTo: 'users',
      required: false,
      access: {
        update: adminOnlyField,
      },
    },
    {
      name: 'body',
      type: 'textarea',
      admin: {
        description: 'Up to 2,000 characters.',
      },
      maxLength: 2000,
      minLength: 2,
      required: true,
    },
    {
      name: 'moderationStatus',
      type: 'select',
      access: {
        create: ({ req }) => Boolean(req?.user && checkRole(['admin'], req.user)),
        update: adminOnlyField,
      },
      admin: {
        description: 'Only approved comments appear on the live blog.',
        position: 'sidebar',
      },
      defaultValue: 'pending',
      options: [
        { label: 'Pending review', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
      ],
      required: true,
    },
  ],
  hooks: {
    afterChange: [revalidateBlogCommentPaths],
    afterDelete: [revalidateBlogCommentPathsDelete],
    beforeValidate: [normalizeCommentDraft],
  },
  timestamps: true,
}
