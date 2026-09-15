/** Converted chapter photos: native size (after any crop) and the widths written to src/assets/chapters/. */
const SIZES = {
  'archaeopteryx-berlin': { width: 3926, height: 4691, widths: [1600, 3926] },
  'archaeopteryx-wing': { width: 4190, height: 3312, widths: [1600, 3200] },
  'sinosauropteryx-tail': { width: 405, height: 1030, widths: [405] },
  'sinosauropteryx-holotype': { width: 897, height: 958, widths: [897] },
  'mei-long': { width: 2211, height: 1579, widths: [1000, 2000] },
  'citipati-big-mama': { width: 2110, height: 1728, widths: [1000, 2000] },
  'kpg-boundary-colorado': { width: 6000, height: 4000, widths: [1440, 2880] },
  cassowary: { width: 1667, height: 2500, widths: [900, 1667] },
  'pigeon-peeking': { width: 3648, height: 2432, widths: [1440, 2880] },
} as const

export type PhotoFile = keyof typeof SIZES

export interface PhotoSources {
  avif: string
  webp: string
  /** Largest WebP, for the <img> fallback src. */
  fallback: string
  width: number
  height: number
}

const urls = import.meta.glob<string>('../assets/chapters/*.{avif,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
})

const url = (file: string, width: number, format: 'avif' | 'webp') => {
  const found = urls[`../assets/chapters/${file}-${width}.${format}`]
  if (!found) throw new Error(`Missing chapter photo ${file}-${width}.${format}`)
  return found
}

export function photoSources(file: string): PhotoSources {
  const size = SIZES[file as PhotoFile]
  if (!size) throw new Error(`Unknown chapter photo "${file}"`)
  const width = (w: number) => Math.min(w, size.width)
  const srcset = (format: 'avif' | 'webp') =>
    size.widths.map((w) => `${url(file, w, format)} ${width(w)}w`).join(', ')
  return {
    avif: srcset('avif'),
    webp: srcset('webp'),
    fallback: url(file, size.widths[size.widths.length - 1], 'webp'),
    width: size.width,
    height: size.height,
  }
}
