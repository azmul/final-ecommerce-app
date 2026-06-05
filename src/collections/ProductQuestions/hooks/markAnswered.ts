import type { CollectionBeforeChangeHook } from 'payload'
import { checkRole } from '@/access/utilities'

export const markAnswered: CollectionBeforeChangeHook = ({ data, originalDoc, req }) => {
  const isStaff = req.user && checkRole(['admin', 'officeStaff'], req.user)
  if (!isStaff) return data

  const answer = typeof data?.answer === 'string' ? data.answer.trim() : ''
  const prevAnswer = typeof originalDoc?.answer === 'string' ? originalDoc.answer.trim() : ''

  if (answer && answer !== prevAnswer) {
    return {
      ...data,
      answeredAt: new Date().toISOString(),
      status: 'answered',
    }
  }

  return data
}
