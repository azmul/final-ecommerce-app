import type { ReturnRequest } from '@/payload-types'
import type { CollectionAfterChangeHook } from 'payload'

export const notifyStaffOnReturnRequest: CollectionAfterChangeHook = async ({
  doc,
  operation,
  req,
}) => {
  if (operation !== 'create') return doc

  const request = doc as ReturnRequest
  const orderId =
    typeof request.order === 'object' && request.order ?
      request.order.id
    : request.order

  const title = 'New return / cancel request'
  const body = `Order #${orderId ?? '—'} — ${request.requestType === 'cancel' ? 'cancellation' : 'return/refund'} request submitted.`

  const staffUsers = await req.payload.find({
    collection: 'users',
    depth: 0,
    limit: 50,
    overrideAccess: true,
    req,
    where: {
      roles: {
        in: ['admin', 'officeStaff'],
      },
    },
  })

  await Promise.all(
    staffUsers.docs.map((user) =>
      req.payload.create({
        collection: 'user-notifications',
        data: {
          body,
          channels: ['inbox'],
          kind: 'system',
          linkUrl: `/admin/collections/return-requests/${request.id}`,
          title,
          user: user.id,
        },
        overrideAccess: true,
        req,
      }),
    ),
  )

  return doc
}
