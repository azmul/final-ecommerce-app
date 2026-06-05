import { adminOnlyField } from '@/access/adminOnly'
import { authenticated } from '@/access/authenticated'
import { commentOwnerOrAdminOrStaff } from '@/access/commentOwnerOrAdminOrStaff'
import { staffCanViewAdminPage } from '@/access/staffAccess'
import { productQuestionsPublicRead } from '@/access/productQuestionsPublicRead'
import type { CollectionConfig } from 'payload'

import { markAnswered } from './hooks/markAnswered'
import { prepareProductQuestion } from './hooks/prepareProductQuestion'
import { revalidateProductQuestionPaths } from './hooks/revalidateProductQuestionPaths'

export const ProductQuestions: CollectionConfig = {
  slug: 'product-questions',
  admin: {
    defaultColumns: ['status', 'product', 'author', 'createdAt'],
    description: 'Pre-purchase customer questions and staff answers (shown on PDP when answered).',
    group: 'Ecommerce',
    useAsTitle: 'id',
  },
  access: {
    admin: staffCanViewAdminPage('product-questions'),
    create: authenticated,
    delete: commentOwnerOrAdminOrStaff('product-questions'),
    read: productQuestionsPublicRead,
    update: commentOwnerOrAdminOrStaff('product-questions'),
  },
  hooks: {
    afterChange: [revalidateProductQuestionPaths],
    beforeChange: [markAnswered],
    beforeValidate: [prepareProductQuestion],
  },
  fields: [
    {
      name: 'product',
      type: 'relationship',
      index: true,
      relationTo: 'products',
      required: true,
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      access: { update: adminOnlyField },
    },
    {
      name: 'askerDisplayName',
      type: 'text',
      required: true,
      access: { update: adminOnlyField },
      admin: { readOnly: true },
    },
    {
      name: 'question',
      type: 'textarea',
      maxLength: 1000,
      minLength: 10,
      required: true,
    },
    {
      name: 'answer',
      type: 'textarea',
      maxLength: 3000,
      admin: {
        description: 'Staff answer — published on the product page when status is Answered.',
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Answered', value: 'answered' },
      ],
      required: true,
      access: { create: adminOnlyField, update: adminOnlyField },
      admin: { position: 'sidebar' },
    },
    {
      name: 'answeredAt',
      type: 'date',
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'staffNote',
      type: 'textarea',
      access: { create: adminOnlyField, read: adminOnlyField, update: adminOnlyField },
      admin: { position: 'sidebar' },
    },
  ],
  labels: {
    plural: 'Product Questions',
    singular: 'Product Question',
  },
  timestamps: true,
}
