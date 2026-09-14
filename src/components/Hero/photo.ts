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
  // Undimmed area around the eye; the blur feather eats into it, so it is drawn larger than the lid opening.
  spot: { x: 690, y: 490, rx: 370, ry: 280, rotation: 8 },
  // Inner corner ≈ (415, 480), outer corner ≈ (1020, 630): the eye leans about 15° clockwise.
  tilt: 15,
} satisfies PhotoMetrics & { avif: string; webp: string }
