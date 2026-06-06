import type { ReturnRequest } from '@/payload-types'
import type { CollectionAfterChangeHook } from 'payload'

function resolveCustomerUserId(request: ReturnRequest): number | null {
  const customer = request.customer
  if (typeof customer === 'number' && Number.isFinite(customer)) return customer
  if (customer && typeof customer === 'object' && 'id' in customer) {
    const id = (customer as { id: unknown }).id
    if (typeof id === 'number' && Number.isFinite(id)) return id
  }
  return null
}

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

  const submittingCustomerId = resolveCustomerUserId(request)

  await Promise.all(
    staffUsers.docs
      .filter((user) => submittingCustomerId == null || user.id !== submittingCustomerId)
      .map((user) =>
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
