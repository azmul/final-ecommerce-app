import { getPayload } from 'payload'
import config from '../src/payload.config'

async function run() {
  const email = process.argv[2]
  if (!email) {
    console.error('Usage: npx tsx scripts/promote-user.ts <email>')
    process.exit(1)
  }

  const payload = await getPayload({ config })
  const users = await payload.find({
    collection: 'users',
    where: { email: { equals: email } },
    depth: 0,
  })

  if (users.totalDocs === 0) {
    console.error(`User with email "${email}" not found in the database.`)
    process.exit(1)
  }

  const user = users.docs[0]
  
  // Update user roles to include 'admin'
  const currentRoles = user.roles || []
  if (currentRoles.includes('admin')) {
    console.log(`User "${email}" is already an admin.`)
    process.exit(0)
  }

  await payload.update({
    collection: 'users',
    id: user.id,
    data: {
      roles: [...currentRoles, 'admin'],
    },
  })

  console.log(`Successfully promoted "${email}" to admin!`)
  process.exit(0)
}

run().catch((err) => {
  console.error('Error running script:', err)
  process.exit(1)
})
