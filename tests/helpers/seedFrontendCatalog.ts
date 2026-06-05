import { getPayload } from 'payload'

import config from '../../src/payload.config.js'

const seedContext = {
  disableRevalidate: true,
  skipProductEmbedding: true,
  skipProductNotificationTriggers: true,
}

const adminUser = {
  email: 'admin@test.com',
  password: 'admin',
}

export async function seedFrontendCatalog(): Promise<void> {
  const payload = await getPayload({ config })
  await ensureAdminUser(payload)
  await ensureCatalog(payload)
}

async function ensureAdminUser(payload: Awaited<ReturnType<typeof getPayload>>) {
  const existing = await payload.find({
    collection: 'users',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: { email: { equals: adminUser.email } },
  })

  if (existing.docs[0]) {
    await payload.update({
      id: existing.docs[0].id,
      collection: 'users',
      data: { roles: ['admin'] },
      overrideAccess: true,
      context: seedContext,
    })
    return
  }

  await payload.create({
    collection: 'users',
    data: {
      ...adminUser,
      roles: ['admin'],
    },
    overrideAccess: true,
    context: seedContext,
  })
}

async function ensureCatalog(payload: Awaited<ReturnType<typeof getPayload>>) {
  async function ensureProduct(args: {
    slug: string
    title: string
    inventory: number
  }): Promise<void> {
    const found = await payload.find({
      collection: 'products',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      where: { slug: { equals: args.slug } },
    })

    if (found.docs[0]?.id) {
      await payload.update({
        id: found.docs[0].id,
        collection: 'products',
        data: {
          inventory: args.inventory,
          _status: 'published',
        },
        overrideAccess: true,
        context: seedContext,
      })
      return
    }

    await payload.create({
      collection: 'products',
      data: {
        _status: 'published',
        enableVariants: false,
        gallery: [],
        inventory: args.inventory,
        layout: [],
        priceInBDT: 1000,
        priceInBDTEnabled: true,
        slug: args.slug,
        title: args.title,
      },
      overrideAccess: true,
      context: seedContext,
    })
  }

  await ensureProduct({
    inventory: 100,
    slug: 'test-product',
    title: 'Test Product',
  })

  await ensureProduct({
    inventory: 0,
    slug: 'no-inventory-product',
    title: 'No Inventory Product',
  })

  const admin = await payload.find({
    collection: 'users',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: { email: { equals: adminUser.email } },
  })
  const adminID = admin.docs[0]?.id
  if (!adminID) return

  const address = await payload.find({
    collection: 'addresses',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: { customer: { equals: adminID } },
  })

  if (!address.docs.length) {
    await payload.create({
      collection: 'addresses',
      data: {
        customer: adminID,
        district: 'Dhaka',
        fullAddress: '123 Test Street, Dhaka',
      },
      overrideAccess: true,
      context: seedContext,
    })
  }
}

export { adminUser }
