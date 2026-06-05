import {
  buildBundlePricedLinesFromItems,
  computeBundleDiscount,
} from '@/lib/bundles/computeBundleDiscount'
import type { ProductBundle } from '@/payload-types'
import type { CollectionBeforeChangeHook } from 'payload'

export const bundleCartBeforeChange: CollectionBeforeChangeHook = async ({
  data,
  req,
  originalDoc,
}) => {
  const items =
    data.items !== undefined ? data.items : (originalDoc?.items as typeof data.items | undefined)
  if (!items?.length) {
    data.appliedBundle = null
    data.bundleDiscountAmount = null
    return data
  }

  const currency = (data.currency ?? originalDoc?.currency ?? 'BDT') as string
  const pricedLines = await buildBundlePricedLinesFromItems({
    currency,
    items,
    payload: req.payload,
    req,
  })

  const payableBeforeBundle =
    typeof data.subtotal === 'number' && Number.isFinite(data.subtotal) ?
      data.subtotal
    : typeof originalDoc?.subtotal === 'number' ?
      originalDoc.subtotal
    : 0

  const bundleTouched = Object.prototype.hasOwnProperty.call(data, 'appliedBundle')
  const bundleIdRaw = bundleTouched ? data.appliedBundle : originalDoc?.appliedBundle
  const bundleId =
    typeof bundleIdRaw === 'object' && bundleIdRaw && 'id' in bundleIdRaw ?
      bundleIdRaw.id
    : bundleIdRaw

  let bundle: ProductBundle | null = null
  if (typeof bundleId === 'number') {
    bundle = (await req.payload.findByID({
      id: bundleId,
      collection: 'product-bundles',
      depth: 0,
      overrideAccess: true,
      req,
    })) as ProductBundle | null
  } else {
    const active = await req.payload.find({
      collection: 'product-bundles',
      depth: 0,
      limit: 10,
      overrideAccess: true,
      req,
      where: { active: { equals: true } },
    })
    for (const candidate of active.docs as ProductBundle[]) {
      const discount = computeBundleDiscount({
        bundle: candidate,
        cartLines: items,
        payableCap: payableBeforeBundle,
        pricedLines,
      })
      if (discount > 0) {
        bundle = candidate
        data.appliedBundle = candidate.id
        break
      }
    }
  }

  if (!bundle) {
    data.appliedBundle = null
    data.bundleDiscountAmount = null
    return data
  }

  const discount = computeBundleDiscount({
    bundle,
    cartLines: items,
    payableCap: payableBeforeBundle,
    pricedLines,
  })

  if (discount <= 0) {
    data.appliedBundle = null
    data.bundleDiscountAmount = null
    return data
  }

  data.bundleDiscountAmount = discount
  data.subtotal = Math.max(0, payableBeforeBundle - discount)

  return data
}
