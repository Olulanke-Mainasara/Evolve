import { mkdir, readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SOURCE = resolve(root, 'src/assets/icon.svg')
const OUT_DIR = resolve(root, 'public/icons')

/** tokens.css --ink and --bone. Bone on ink, to match the manifest splash. */
const INK = '#0e0d0b'
const BONE = '#ede8dd'

/**
 * `scale` is the mark's share of the canvas, and it is the reason this script exists:
 * - 1.00 keeps the margin already built into the viewBox, which is all a plain icon needs.
 * - 0.70 puts the mark's bounding-box corners inside the 80% circle Android masks to.
 * - 0.86 clears the corners iOS rounds off.
 */
const TARGETS = [
  { file: 'icon-192.png', size: 192, scale: 1 },
  { file: 'icon-512.png', size: 512, scale: 1 },
  { file: 'maskable-512.png', size: 512, scale: 0.7 },
  { file: 'apple-touch-icon.png', size: 180, scale: 0.86 },
]

const source = (await readFile(SOURCE, 'utf8')).replace(`color="${INK}"`, `color="${BONE}"`)
if (!source.includes(BONE)) throw new Error(`Expected color="${INK}" on the root <svg> of ${SOURCE}`)

await mkdir(OUT_DIR, { recursive: true })

for (const { file, size, scale } of TARGETS) {
  const mark = Math.round(size * scale)
  // Rasterise well above the target and let the resize downsample: librsvg renders the
  // viewBox at 72dpi otherwise, which softens the stroke at 512.
  const rendered = await sharp(Buffer.from(source), { density: 300 }).resize(mark, mark).png().toBuffer()
  const offset = Math.round((size - mark) / 2)

  await sharp({ create: { width: size, height: size, channels: 4, background: INK } })
    .composite([{ input: rendered, top: offset, left: offset }])
    .png()
    .toFile(resolve(OUT_DIR, file))

  console.log(`${file.padEnd(22)} ${size}x${size}  mark ${Math.round(scale * 100)}%`)
}
