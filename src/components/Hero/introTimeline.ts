import { gsap } from '../../lib/gsap'
import { drawEye } from './drawEye'
import { almondPath, anchoredAt, lerp, scaleAlmond } from './geometry'
import { setPhotoTransform, setSpotlight, type HeroGeometry, type HeroParts } from './layout'
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
    .to(state, { sweep: 0, duration: 1.1, ease: 'power1.inOut' }, 0.8)
    .set(parts.lightLayer, { autoAlpha: 0 }, 1.9)
    .to(state, { open: 1, duration: 0.8, ease: 'power2.inOut' }, 1.8)

  if (photoOk) {
    timeline
      .set(parts.reveal, { autoAlpha: 1 }, 1.8)
      .to(parts.eye, { autoAlpha: 0, duration: 0.25, ease: 'power1.out' }, 2.6)
      .to(state, { grow: 1, duration: 0.8, ease: 'power3.inOut' }, 3.25)
      // The dimming ring is placed for the cover transform, which the photo reaches as the burst starts.
      .set(parts.dim, { autoAlpha: 1 }, 4.05)
      .to(state, { burst: 1, duration: 0.5, ease: 'power2.in' }, 4.05)
      // The photo now fills the hero: switch the nav to its over-photo color before anything fades in.
      .call(() => {
        nav.dataset.on = 'photo'
      }, [], 4.55)
  }

  // UI waits for the full reveal so no text sits half over the ground and half over the photo.
  timeline.to(
    [nav, parts.tagline, parts.cue],
    { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out', stagger: 0.1 },
    photoOk ? 4.6 : 2.7,
  )

  setSpotlight(parts.dim, getGeo().spotlight)
  redraw()
  return { timeline, redraw }
}
