import type { CollectionAfterChangeHook } from 'payload'

export async function resolveOrderCartId(
  doc: Record<string, unknown>,
  req: Parameters<CollectionAfterChangeHook>[0]['req'],
): Promise<number | undefined> {
  const checkoutCart = doc.checkoutCart
  if (checkoutCart && typeof checkoutCart === 'object' && 'id' in checkoutCart) {
    return (checkoutCart as { id: number }).id
  }
  if (typeof checkoutCart === 'number') {
    return checkoutCart
  }

  const transactions = doc.transactions as unknown
  const txRef = Array.isArray(transactions) ? transactions[0] : undefined
  if (!txRef) {
    return undefined
  }
  const txId = typeof txRef === 'object' && txRef && 'id' in txRef ? txRef.id : txRef
  if (typeof txId !== 'number') {
    return undefined
  }

  const tx = await req.payload.findByID({
    id: txId,
    collection: 'transactions',
    depth: 0,
    req,
    overrideAccess: true,
  })
  const c = tx?.cart
  if (typeof c === 'object' && c && 'id' in c) {
    return c.id
  }
  if (typeof c === 'number') {
    return c
  }
  return undefined
}
