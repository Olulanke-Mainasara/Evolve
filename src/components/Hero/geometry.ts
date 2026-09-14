export interface Point {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

/** An eye-shaped box: two cubic Bézier lids meeting at the left and right corners. */
export interface Almond {
  cx: number
  cy: number
  width: number
  height: number
}

/** Translation (px) and scale applied to the photo with transform-origin at its top-left. */
export interface PhotoTransform {
  x: number
  y: number
  scale: number
}

/** Pupil and iris measured in the photo's source pixels. */
export interface PhotoMetrics {
  width: number
  height: number
  pupil: { x: number; y: number; r: number }
  iris: { rx: number; ry: number }
}

export interface Lash {
  x1: number
  y1: number
  x2: number
  y2: number
}

/** How far the closed lid dips, as a fraction of the open lid's control offset. */
export const CLOSED_SAG = 0.35
const LASH_POSITIONS = [0.18, 0.34, 0.5, 0.66, 0.82]
export const LASH_COUNT = LASH_POSITIONS.length

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Interpolates scale in log space so a zoom reads at a constant speed. */
export const logLerp = (a: number, b: number, t: number) => a * Math.pow(b / a, t)

const round = (n: number) => Math.round(n * 100) / 100

const corners = ({ width, height }: Size): Point[] => [
  { x: 0, y: 0 },
  { x: width, y: 0 },
  { x: 0, y: height },
  { x: width, y: height },
]

/** Font size (px) that spans `widthRatio` of the viewport, capped so the cap height stays within `maxCapRatio` of its height. */
export function fitWordFontSize(
  viewport: Size,
  widthPer100px: number,
  capPer100px: number,
  widthRatio = 0.88,
  maxCapRatio = 0.3,
): number {
  const byWidth = (viewport.width * widthRatio * 100) / widthPer100px
  const byHeight = (viewport.height * maxCapRatio * 100) / capPer100px
  return Math.min(byWidth, byHeight)
}

/** Photo transform that puts the pupil on `anchor` at `scale`. */
export function anchoredAt(anchor: Point, photo: PhotoMetrics, scale: number): PhotoTransform {
  return { x: anchor.x - photo.pupil.x * scale, y: anchor.y - photo.pupil.y * scale, scale }
}

/** Pupil on the almond's center, iris exactly as tall as the almond. */
export function fitToSlot(almond: Almond, photo: PhotoMetrics): PhotoTransform {
  return anchoredAt({ x: almond.cx, y: almond.cy }, photo, almond.height / (photo.iris.ry * 2))
}

/** Smallest transform that covers the viewport while the pupil stays on `anchor`. */
export function coverAnchored(viewport: Size, anchor: Point, photo: PhotoMetrics): PhotoTransform {
  const { x: px, y: py } = photo.pupil
  const scale = Math.max(
    anchor.x / px,
    (viewport.width - anchor.x) / (photo.width - px),
    anchor.y / py,
    (viewport.height - anchor.y) / (photo.height - py),
  )
  return anchoredAt(anchor, photo, scale)
}

export function scaleAlmond(almond: Almond, factor: number): Almond {
  return { ...almond, width: almond.width * factor, height: almond.height * factor }
}

/** Control-point y offsets (relative to center) for both lids. Openness 0 is a closed, dipped lid; 1 is fully open. */
export function lidControls(height: number, openness: number): { upper: number; lower: number } {
  const open = (height * 2) / 3 // a cubic with this control offset peaks at height / 2
  const sag = open * CLOSED_SAG
  return { upper: lerp(sag, -open, openness), lower: lerp(sag, open, openness) }
}

export function lidPaths(almond: Almond, openness: number): { upper: string; lower: string; clip: string } {
  const { cx, cy, width } = almond
  const { upper, lower } = lidControls(almond.height, openness)
  const left = round(cx - width / 2)
  const right = round(cx + width / 2)
  const innerLeft = round(cx - width / 4)
  const innerRight = round(cx + width / 4)
  const y = round(cy)
  const upperY = round(cy + upper)
  const lowerY = round(cy + lower)
  const upperCurve = `C${innerLeft} ${upperY} ${innerRight} ${upperY} ${right} ${y}`
  const lowerCurve = `C${innerRight} ${lowerY} ${innerLeft} ${lowerY} ${left} ${y}`
  return {
    upper: `M${left} ${y}${upperCurve}`,
    lower: `M${right} ${y}${lowerCurve}`,
    clip: `M${left} ${y}${upperCurve}${lowerCurve}Z`,
  }
}

export const almondPath = (almond: Almond, openness: number) => lidPaths(almond, openness).clip

/** Lid x-position normalized to -1…1 at Bézier parameter t. */
const lidX = (t: number) => {
  const u = 1 - t
  return -(u ** 3) - 1.5 * u * u * t + 1.5 * u * t * t + t ** 3
}

const lidXSlope = (t: number) => {
  const u = 1 - t
  return 1.5 * u * u + 6 * u * t + 1.5 * t * t
}

/** Half-height of the fully open almond at horizontal offset `dx` from its center. */
export function almondHalfHeightAt(almond: Almond, dx: number): number {
  const target = Math.abs(dx) / (almond.width / 2)
  if (target >= 1) return 0
  let lo = 0.5
  let hi = 1
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2
    if (lidX(mid) < target) lo = mid
    else hi = mid
  }
  const t = (lo + hi) / 2
  return 2 * almond.height * t * (1 - t)
}

/** Smallest scale at which the open almond contains all four viewport corners. */
export function almondCoverScale(viewport: Size, almond: Almond): number {
  if (almond.width <= 0 || almond.height <= 0) return 1
  const covers = (factor: number) => {
    const scaled = scaleAlmond(almond, factor)
    return corners(viewport).every((c) => almondHalfHeightAt(scaled, c.x - almond.cx) >= Math.abs(c.y - almond.cy))
  }
  if (covers(1)) return 1
  let lo = 1
  let hi = 2
  while (!covers(hi)) {
    lo = hi
    hi *= 2
  }
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2
    if (covers(mid)) hi = mid
    else lo = mid
  }
  return hi
}

/** Scale at which a pupil of `radius` reaches the farthest viewport corner. */
export function diveEndScale(viewport: Size, pupil: Point, radius: number): number {
  if (radius <= 0) return 1
  const farthest = Math.max(...corners(viewport).map((c) => Math.hypot(c.x - pupil.x, c.y - pupil.y)))
  return farthest / radius
}

/**
 * Lashes along the upper lid. They hang down while the lid dips, shrink to nothing
 * where the lid is straight, then grow back pointing up and fanned outward.
 */
export function lashes(almond: Almond, openness: number, length: number): Lash[] {
  const { cx, cy, width } = almond
  const { upper } = lidControls(almond.height, openness)
  const flip = CLOSED_SAG / (1 + CLOSED_SAG)
  const hanging = openness < flip
  const size = length * (hanging ? 1 - openness / flip : (openness - flip) / (1 - flip))
  const direction = hanging ? 1 : -1

  return LASH_POSITIONS.map((t) => {
    const x1 = cx + (width / 2) * lidX(t)
    const y1 = cy + upper * 3 * t * (1 - t)
    const dx = (width / 2) * lidXSlope(t)
    const dy = upper * 3 * (1 - 2 * t)
    const norm = Math.hypot(dx, dy) || 1
    return {
      x1,
      y1,
      x2: x1 + (-dy / norm) * size * direction,
      y2: y1 + (dx / norm) * size * direction,
    }
  })
}
