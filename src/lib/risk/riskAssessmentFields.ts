import type { Field } from 'payload'

import { adminOrStaffField } from '@/access/staffAccess'

function buildRiskAssessmentField(collection: 'orders' | 'users'): Field {
  return {
    name: 'riskAssessment',
    type: 'group',
    label: 'Risk assessment',
    admin: {
      description:
        'Automated fraud signals for staff review. Checkout and registration are never blocked automatically.',
    },
    access: {
      read: adminOrStaffField(collection, 'view'),
      update: adminOrStaffField(collection, 'edit'),
    },
    fields: [
      {
        name: 'riskScore',
        type: 'number',
        min: 0,
        max: 100,
        defaultValue: 0,
        admin: {
          readOnly: true,
          position: 'sidebar',
        },
      },
      {
        name: 'riskLevel',
        type: 'select',
        defaultValue: 'low',
        options: [
          { label: 'Low', value: 'low' },
          { label: 'Medium', value: 'medium' },
          { label: 'High', value: 'high' },
        ],
        admin: {
          readOnly: true,
          position: 'sidebar',
        },
      },
      {
        name: 'riskReviewStatus',
        type: 'select',
        defaultValue: 'cleared',
        options: [
          { label: 'Pending review', value: 'pending' },
          { label: 'Cleared', value: 'cleared' },
          { label: 'Confirmed fraud', value: 'confirmed_fraud' },
        ],
        admin: {
          position: 'sidebar',
        },
      },
      {
        name: 'riskFlags',
        type: 'array',
        admin: {
          initCollapsed: true,
          readOnly: true,
        },
        fields: [
          {
            name: 'flag',
            type: 'text',
            required: true,
          },
          {
            name: 'weight',
            type: 'number',
            required: true,
          },
          {
            name: 'detail',
            type: 'text',
          },
        ],
        labels: {
          plural: 'Risk flags',
          singular: 'Risk flag',
        },
      },
      {
        name: 'riskReviewedAt',
        type: 'date',
        admin: {
          date: { pickerAppearance: 'dayAndTime' },
          position: 'sidebar',
          readOnly: true,
        },
      },
      {
        name: 'riskReviewedBy',
        type: 'relationship',
        relationTo: 'users',
        admin: {
          position: 'sidebar',
          readOnly: true,
        },
      },
      {
        name: 'riskCapturedIp',
        type: 'text',
        admin: {
          position: 'sidebar',
          readOnly: true,
        },
      },
      {
        name: 'riskCapturedUserAgent',
        type: 'textarea',
        admin: {
          readOnly: true,
        },
      },
    ],
  }
}

export const orderRiskAssessmentField = buildRiskAssessmentField('orders')
export const userRiskAssessmentField = buildRiskAssessmentField('users')
