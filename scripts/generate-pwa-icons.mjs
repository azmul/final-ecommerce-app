import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const iconsDir = path.join(root, 'public', 'icons')

const sources = [
  {
    file: path.join(root, 'public', 'favicon.svg'),
    out: [{ name: 'icon-192.png', size: 192 }, { name: 'icon-512.png', size: 512 }],
  },
  {
    file: path.join(iconsDir, 'icon-maskable.svg'),
    out: [{ name: 'icon-maskable-512.png', size: 512 }],
  },
]

async function generate() {
  await fs.mkdir(iconsDir, { recursive: true })

  for (const { file, out } of sources) {
    const input = await fs.readFile(file)
    for (const { name, size } of out) {
      await sharp(input).resize(size, size).png().toFile(path.join(iconsDir, name))
      console.log(`wrote public/icons/${name}`)
    }
  }

  const appleSource = await fs.readFile(path.join(root, 'public', 'favicon.svg'))
  await sharp(appleSource).resize(180, 180).png().toFile(path.join(iconsDir, 'apple-touch-icon.png'))
  console.log('wrote public/icons/apple-touch-icon.png')
}

generate().catch((error) => {
  console.error(error)
  process.exit(1)
})
