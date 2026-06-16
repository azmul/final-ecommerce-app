import { seedFrontendCatalog } from '../helpers/seedFrontendCatalog'
import { describe, it } from 'vitest'

describe('seed frontend catalog', () => {
  it(
    'creates e2e products and admin user',
    async () => {
      await seedFrontendCatalog()
    },
    60_000,
  )
})
