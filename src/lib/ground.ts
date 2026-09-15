import { gsap, ScrollTrigger } from './gsap'

export type Ground = 'black' | 'theme'

/**
 * Tween target for the page ground: 1 is pure black, 0 is the theme ground. Chapters tween
 * this object, so they work whether or not the backdrop has mounted yet.
 */
export const ground = { black: 1 }

let layer: HTMLElement | null = null
const followers = new Set<HTMLElement>()

const amount = (value: Ground) => (value === 'black' ? 1 : 0)

/** Paints the backdrop's black layer. Pass as a tween's onUpdate. */
export function renderGround(): void {
  if (layer) layer.style.opacity = String(ground.black)
}

/**
 * Sets data-on ('void' or 'ground') on the nav and counter. Called from ScrollTrigger
 * updates, never on load, so it can't override the hero's own nav states.
 */
export function syncGroundFollowers(): void {
  const on = ground.black > 0.5 ? 'void' : 'ground'
  for (const element of followers) element.dataset.on = on
}

export function connectGround(blackLayer: HTMLElement): () => void {
  layer = blackLayer
  renderGround()
  return () => {
    if (layer === blackLayer) layer = null
  }
}

export function followGround(element: HTMLElement): () => void {
  followers.add(element)
  return () => {
    followers.delete(element)
  }
}

/** Scrubs the ground from one value to another across a scroll range. */
export function scrubGround(from: Ground, to: Ground, scrollTrigger: ScrollTrigger.Vars): gsap.core.Tween {
  return gsap.fromTo(
    ground,
    { black: amount(from) },
    {
      black: amount(to),
      ease: 'none',
      immediateRender: false,
      onUpdate: renderGround,
      scrollTrigger: { scrub: true, ...scrollTrigger, onUpdate: syncGroundFollowers },
    },
  )
}

/** Flips the ground when a scroll position is crossed: a short fade, or a hard cut with `duration: 0`. */
export function toggleGround(from: Ground, to: Ground, scrollTrigger: ScrollTrigger.Vars, duration = 0.4): ScrollTrigger {
  const go = (value: Ground) => {
    gsap.to(ground, {
      black: amount(value),
      duration,
      ease: 'power1.inOut',
      onUpdate: renderGround,
      onComplete: syncGroundFollowers,
    })
  }
  return ScrollTrigger.create({ ...scrollTrigger, onEnter: () => go(to), onLeaveBack: () => go(from) })
}
