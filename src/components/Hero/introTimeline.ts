import { gsap } from '../../lib/gsap'
import { drawEye } from './drawEye'
import { almondPath, anchoredAt, lerp, scaleAlmond } from './geometry'
import { setPhotoTransform, type HeroGeometry, type HeroParts } from './layout'
import { PHOTO } from './photo'

export interface Intro {
  timeline: gsap.core.Timeline
  /** Re-renders the current frame, e.g. after a resize re-measured the geometry. */
  redraw: () => void
}

interface IntroOptions {
  photoOk: boolean
  onComplete: () => void
}

export function createIntro(
  parts: HeroParts,
  nav: HTMLElement,
  getGeo: () => HeroGeometry,
  { photoOk, onComplete }: IntroOptions,
): Intro {
  // sweep: mask-position % (100 = band off the left edge, 0 = off the right edge)
  // open: eyelid openness; grow: photo fit → cover; burst: clip eye-sized → covering the viewport
  const state = { sweep: 100, open: 0, grow: 0, burst: 0 }

  const redraw = () => {
    const geo = getGeo()
    parts.lightLayer.style.setProperty('--sweep', `${state.sweep}%`)
    drawEye(parts.eye, geo.almond, state.open, geo.strokeWidth)
    drawEye(parts.eyeLight, geo.almond, state.open, geo.strokeWidth)
    if (!photoOk) return

    const photoScale = lerp(geo.fit.scale, geo.cover.scale, state.grow)
    setPhotoTransform(parts.photo, anchoredAt({ x: geo.almond.cx, y: geo.almond.cy }, PHOTO, photoScale))
    // While growing, the clip scales with the photo so the lids stay on the real eye.
    const tracked = photoScale / geo.fit.scale
    const clipScale = lerp(tracked, Math.max(tracked, geo.clipCoverScale), state.burst)
    parts.reveal.style.clipPath = `path("${almondPath(scaleAlmond(geo.almond, clipScale), state.open)}")`
  }

  const timeline = gsap.timeline({ onUpdate: redraw, onComplete })

  timeline
    .to(parts.stage, { autoAlpha: 1, duration: 0.3, ease: 'power1.out' }, 0)
    .set(parts.lightLayer, { autoAlpha: 1 }, 0.8)
    .to(state, { sweep: 0, duration: 0.6, ease: 'power2.inOut' }, 0.8)
    .set(parts.lightLayer, { autoAlpha: 0 }, 1.4)
    .to(state, { open: 1, duration: 0.45, ease: 'power3.out' }, 1.3)

  if (photoOk) {
    timeline
      .set(parts.reveal, { autoAlpha: 1 }, 1.3)
      .to(parts.eye, { autoAlpha: 0, duration: 0.25, ease: 'power1.out' }, 1.75)
      .to(state, { grow: 1, duration: 0.8, ease: 'power3.inOut' }, 2.4)
      .to(state, { burst: 1, duration: 0.5, ease: 'power2.in' }, 3.2)
  }

  timeline.to(
    [nav, parts.tagline, parts.cue],
    { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power2.out', stagger: 0.12 },
    photoOk ? 3.2 : 1.9,
  )

  redraw()
  return { timeline, redraw }
}
