import eyeAvif from '../../assets/eye.avif'
import eyeWebp from '../../assets/eye.webp'
import type { PhotoMetrics } from './geometry'

/** Measured in source pixels of src/assets/eye.png (1537×1023). Re-measure if the photo is replaced. */
export const PHOTO = {
  avif: eyeAvif,
  webp: eyeWebp,
  width: 1537,
  height: 1023,
  pupil: { x: 676, y: 486, r: 98 },
  iris: { rx: 237, ry: 202 },
} satisfies PhotoMetrics & { avif: string; webp: string }
