import { gsap } from './gsap'

/** Tween target for the fixed counter, in million years ago. */
export const counter = { value: 230 }

let root: HTMLElement | null = null
let output: HTMLElement | null = null
let shown = -1

/** Writes the rounded value to the counter. Pass as a tween's onUpdate. */
export function renderCounter(): void {
  const rounded = Math.round(counter.value)
  if (!output || rounded === shown) return
  shown = rounded
  output.textContent = String(rounded)
}

export function connectCounter(counterRoot: HTMLElement, valueOutput: HTMLElement): () => void {
  root = counterRoot
  output = valueOutput
  shown = -1
  renderCounter()
  return () => {
    if (root === counterRoot) root = output = null
  }
}

/** Jumps straight to a value (reduced motion, where nothing scrubs the counter). */
export function setCounter(value: number): void {
  counter.value = value
  renderCounter()
}

export function showCounter(visible: boolean): void {
  if (!root) return
  gsap.to(root, { autoAlpha: visible ? 1 : 0, duration: 0.5, ease: 'power2.out', overwrite: true })
}

/** Ticks the counter between two values across a scroll range. */
export function scrubCounter(from: number, to: number, scrollTrigger: ScrollTrigger.Vars): gsap.core.Tween {
  return gsap.fromTo(
    counter,
    { value: from },
    { value: to, ease: 'none', immediateRender: false, onUpdate: renderCounter, scrollTrigger: { scrub: true, ...scrollTrigger } },
  )
}
