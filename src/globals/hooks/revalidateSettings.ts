import type { GlobalAfterChangeHook } from 'payload'

import { revalidatePath, revalidateTag } from 'next/cache'

export const revalidateSettings: GlobalAfterChangeHook = ({ doc, req: { payload, context } }) => {
  if (!context.disableRevalidate) {
    payload.logger.info('Revalidating settings')
    try {
      revalidateTag('global_settings', 'max')
      revalidatePath('/', 'layout')
      revalidatePath('/manifest.webmanifest')
    } catch (error) {
      payload.logger.warn(
        `Settings revalidation skipped: ${error instanceof Error ? error.message : 'unknown error'}`,
      )
    }
  }

  return doc
}
