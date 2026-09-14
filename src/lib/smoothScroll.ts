import Lenis from 'lenis'
import { gsap, ScrollTrigger } from './gsap'

let lenis: Lenis | null = null
let locked = false

/** Creates Lenis (skipped for reduced motion) driven by GSAP's ticker. Returns a cleanup. */
export function initSmoothScroll(): () => void {
  ScrollTrigger.config({ ignoreMobileResize: true })
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {}

  const instance = new Lenis()
  lenis = instance
  if (locked) instance.stop()
  instance.on('scroll', ScrollTrigger.update)
  const tick = (time: number) => instance.raf(time * 1000)
  gsap.ticker.add(tick)
  gsap.ticker.lagSmoothing(0)

  return () => {
    gsap.ticker.remove(tick)
    gsap.ticker.lagSmoothing(500, 33)
    instance.destroy()
    if (lenis === instance) lenis = null
  }
}

/** Blocks wheel, touch and keyboard scrolling. Safe to call before initSmoothScroll. */
export function lockScroll(): void {
  locked = true
  document.documentElement.classList.add('is-locked')
  lenis?.stop()
}

export function unlockScroll(): void {
  locked = false
  document.documentElement.classList.remove('is-locked')
  lenis?.start()
}
