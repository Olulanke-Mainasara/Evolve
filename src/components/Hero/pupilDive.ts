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

const NAV_VOID_PROGRESS = 0.85

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
    gsap.set(parts.stage, {
      scale: logLerp(1, geo.diveScale, state.zoom),
      transformOrigin: `${geo.almond.cx}px ${geo.almond.cy}px`,
      force3D: true,
    })
  }

  const timeline = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: parts.hero,
      start: 'top top',
      end: '+=150%',
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
      .to(state, { zoom: 1, duration: 1, ease: 'power2.in', onUpdate: render }, 0)
      // Solid black over the upscaled pupil so the last frames stay crisp.
      .to(parts.pupilCover, { opacity: 1, duration: 0.34 }, 0.66)
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
