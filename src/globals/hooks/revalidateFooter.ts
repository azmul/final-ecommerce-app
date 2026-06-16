import type { GlobalAfterChangeHook } from 'payload'

import { revalidateTag } from 'next/cache'

export const revalidateFooter: GlobalAfterChangeHook = ({ doc, req: { payload, context } }) => {
  if (!context.disableRevalidate) {
    payload.logger.info('Revalidating footer')
    try {
      revalidateTag('global_footer', 'max')
    } catch (error) {
      payload.logger.warn(
        `Footer revalidation skipped: ${error instanceof Error ? error.message : 'unknown error'}`,
      )
    }
  }

  return doc
}
