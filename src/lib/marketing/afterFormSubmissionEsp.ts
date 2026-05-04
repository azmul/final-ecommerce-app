import type { FormSubmission } from '@/payload-types'
import { extractEmailFromSubmissionData, subscribeEmailToKlaviyoList } from '@/lib/marketing/klaviyoSubscribe'
import type { CollectionAfterChangeHook } from 'payload'

export const afterFormSubmissionEsp: CollectionAfterChangeHook<FormSubmission> = async ({
  doc,
  operation,
}) => {
  if (operation !== 'create') return doc

  const apiKey = process.env.KLAVIYO_PRIVATE_API_KEY
  const listId = process.env.KLAVIYO_LIST_ID
  if (!apiKey || !listId) return doc

  const email = extractEmailFromSubmissionData(doc.submissionData)
  if (!email) return doc

  try {
    await subscribeEmailToKlaviyoList({ apiKey, email, listId })
  } catch (err) {
    console.warn('[klaviyo] form submission sync failed', err)
  }

  return doc
}
