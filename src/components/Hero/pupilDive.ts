import { gsap } from '../../lib/gsap'
import { logLerp } from './geometry'
import type { HeroGeometry, HeroParts } from './layout'

export interface PupilDive {
  /** Re-applies the stage transform for the current scroll progress (after a resize). */
  render: () => void
  kill: () => void
}

interface DiveOptions {
  /** 'zoom' pushes into the pupil; 'fade' cross-fades to black (reduced motion or no photo). */
  mode: 'zoom' | 'fade'
  restingBackdrop: 'photo' | 'ground'
}

const NAV_VOID_PROGRESS = 0.65

export function createPupilDive(
  parts: HeroParts,
  nav: HTMLElement,
  getGeo: () => HeroGeometry,
  { mode, restingBackdrop }: DiveOptions,
): PupilDive {
  const state = { zoom: 0 }

  const render = () => {
    if (mode !== 'zoom') return
    const geo = getGeo()
    const scale = logLerp(1, geo.diveScale, state.zoom)
    gsap.set(parts.stage, {
      scale,
      transformOrigin: `${geo.almond.cx}px ${geo.almond.cy}px`,
      force3D: true,
    })
    // Once the ring is off screen, hiding it spares Chrome re-blurring it at every new scale.
    gsap.set(parts.dim, { autoAlpha: scale < geo.spotlightClearScale ? 1 : 0 })
  }

  const timeline = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: parts.hero,
      start: 'top top',
      end: '+=85%',
      pin: true,
      scrub: true,
      refreshPriority: 1, // the hero is first on the page but is created after the chapter's trigger
      onUpdate: (self) => {
        nav.dataset.on = self.progress > NAV_VOID_PROGRESS ? 'void' : restingBackdrop
      },
    },
  })

  timeline.to([parts.tagline, parts.cue], { autoAlpha: 0, duration: 0.15 }, 0)

  if (mode === 'zoom') {
    timeline
      // A short push rather than a fall: it ends with the blackout, at the capped dive scale.
      .to(state, { zoom: 1, duration: 0.78, ease: 'power1.in', onUpdate: render }, 0)
      // Photo and word leave together, over the window the word alone used to fade on.
      .to(parts.voidCover, { opacity: 1, duration: 0.5 }, 0.28)
      // Nothing shows through the black now; hiding the photo and letters ends their re-rasterizing.
      .set(parts.reveal, { autoAlpha: 0 }, 0.78)
  } else {
    timeline.to(parts.voidCover, { opacity: 1, duration: 1 }, 0)
  }

  render()

  return {
    render,
    kill: () => {
      timeline.scrollTrigger?.kill(true)
      timeline.kill()
    },
  }
}
