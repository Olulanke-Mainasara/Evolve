import { describe, expect, it } from 'vitest'
import {
  almondCoverScale,
  almondHalfHeightAt,
  almondPath,
  anchoredAt,
  CLOSED_SAG,
  coverAnchored,
  diveEndScale,
  fitToSlot,
  fitWordFontSize,
  lashes,
  LASH_COUNT,
  lidControls,
  logLerp,
  scaleAlmond,
  type Almond,
  type PhotoMetrics,
} from './geometry'

const photo: PhotoMetrics = {
  width: 1537,
  height: 1023,
  pupil: { x: 676, y: 486, r: 98 },
  iris: { rx: 237, ry: 202 },
}
const almond: Almond = { cx: 600, cy: 400, width: 210, height: 140 }

describe('fitWordFontSize', () => {
  it('fits the word to the viewport width', () => {
    expect(fitWordFontSize({ width: 1440, height: 900 }, 400, 72)).toBeCloseTo(316.8)
  })

  it('caps the size on short, wide viewports', () => {
    expect(fitWordFontSize({ width: 1440, height: 500 }, 400, 72)).toBeCloseTo(208.33, 1)
  })
})

describe('photo placement', () => {
  it('anchoredAt puts the pupil on the anchor', () => {
    const t = anchoredAt({ x: 300, y: 200 }, photo, 0.5)
    expect(t.x + photo.pupil.x * t.scale).toBeCloseTo(300)
    expect(t.y + photo.pupil.y * t.scale).toBeCloseTo(200)
  })

  it('fitToSlot centers the pupil and matches iris height to the almond', () => {
    const t = fitToSlot(almond, photo)
    expect(photo.iris.ry * 2 * t.scale).toBeCloseTo(almond.height)
    expect(t.x + photo.pupil.x * t.scale).toBeCloseTo(almond.cx)
    expect(t.y + photo.pupil.y * t.scale).toBeCloseTo(almond.cy)
  })

  it('coverAnchored covers the viewport with the smallest scale', () => {
    const viewport = { width: 1440, height: 900 }
    const anchor = { x: 634, y: 450 }
    const t = coverAnchored(viewport, anchor, photo)
    const right = t.x + photo.width * t.scale
    const bottom = t.y + photo.height * t.scale

    expect(t.x + photo.pupil.x * t.scale).toBeCloseTo(anchor.x)
    expect(t.y + photo.pupil.y * t.scale).toBeCloseTo(anchor.y)
    expect(t.x).toBeLessThanOrEqual(1e-6)
    expect(t.y).toBeLessThanOrEqual(1e-6)
    expect(right).toBeGreaterThanOrEqual(viewport.width - 1e-6)
    expect(bottom).toBeGreaterThanOrEqual(viewport.height - 1e-6)
    const slack = Math.min(Math.abs(t.x), Math.abs(t.y), Math.abs(right - viewport.width), Math.abs(bottom - viewport.height))
    expect(slack).toBeLessThan(1e-6)
  })
})

describe('almond lids', () => {
  it('closed lids coincide and dip below the corners', () => {
    const { upper, lower } = lidControls(140, 0)
    expect(upper).toBe(lower)
    expect(upper).toBeGreaterThan(0)
  })

  it('open lids reach half the height above and below center', () => {
    const { upper, lower } = lidControls(140, 1)
    expect(upper * 0.75).toBeCloseTo(-70)
    expect(lower * 0.75).toBeCloseTo(70)
  })

  it('almondPath is a closed path starting at the left corner', () => {
    const d = almondPath(almond, 1)
    expect(d.startsWith('M495 400C')).toBe(true)
    expect(d.endsWith('Z')).toBe(true)
  })

  it('half-height is h/2 at the center, 0 at the corners, and symmetric', () => {
    expect(almondHalfHeightAt(almond, 0)).toBeCloseTo(70)
    expect(almondHalfHeightAt(almond, 105)).toBe(0)
    expect(almondHalfHeightAt(almond, -40)).toBeCloseTo(almondHalfHeightAt(almond, 40))
  })

  it('scaleAlmond keeps the center', () => {
    expect(scaleAlmond(almond, 2)).toEqual({ cx: 600, cy: 400, width: 420, height: 280 })
  })
})

describe('almondCoverScale', () => {
  it('returns the smallest scale whose almond contains every viewport corner', () => {
    const viewport = { width: 1000, height: 600 }
    const a: Almond = { cx: 500, cy: 300, width: 150, height: 100 }
    const scale = almondCoverScale(viewport, a)
    const contains = (factor: number) =>
      [
        [0, 0],
        [1000, 0],
        [0, 600],
        [1000, 600],
      ].every(([x, y]) => almondHalfHeightAt(scaleAlmond(a, factor), x - a.cx) >= Math.abs(y - a.cy))

    expect(contains(scale)).toBe(true)
    expect(contains(scale * 0.98)).toBe(false)
  })
})

describe('dive', () => {
  it('diveEndScale grows the pupil to the farthest corner', () => {
    expect(diveEndScale({ width: 1000, height: 800 }, { x: 400, y: 300 }, 50)).toBeCloseTo(Math.hypot(600, 500) / 50)
  })

  it('logLerp interpolates geometrically', () => {
    expect(logLerp(1, 16, 0)).toBe(1)
    expect(logLerp(1, 16, 1)).toBeCloseTo(16)
    expect(logLerp(1, 16, 0.5)).toBeCloseTo(4)
  })
})

describe('lashes', () => {
  it('hang down when closed and point up when open', () => {
    const closed = lashes(almond, 0, 20)
    const open = lashes(almond, 1, 20)
    expect(closed).toHaveLength(LASH_COUNT)
    closed.forEach((lash) => expect(lash.y2).toBeGreaterThan(lash.y1))
    open.forEach((lash) => expect(lash.y2).toBeLessThan(lash.y1))
  })

  it('fan outward when open', () => {
    const open = lashes(almond, 1, 20)
    expect(open[0].x2).toBeLessThan(open[0].x1)
    expect(open[LASH_COUNT - 1].x2).toBeGreaterThan(open[LASH_COUNT - 1].x1)
  })

  it('shrink to nothing where the lid is straight', () => {
    const flip = CLOSED_SAG / (1 + CLOSED_SAG)
    lashes(almond, flip, 20).forEach((lash) => {
      expect(lash.x2).toBeCloseTo(lash.x1)
      expect(lash.y2).toBeCloseTo(lash.y1)
    })
  })
})
