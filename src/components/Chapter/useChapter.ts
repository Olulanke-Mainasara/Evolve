import type { RefObject } from 'react'
import { gsap, useGSAP } from '../../lib/gsap'
import { chapterScroll, type ChapterScrollOptions } from './chapterScroll'
import { revealText } from './reveal'

/** Returns an optional cleanup for anything GSAP doesn't revert (observers, listeners). */
type Setup = (section: HTMLElement, reduce: boolean, phone: boolean) => void | (() => void)

/**
 * Motion every chapter shares: text reveals for each [data-beat], counter ticks and ground
 * changes. `setup` adds the chapter's own motion inside the same reduced-motion branch; it re-runs
 * when the viewport crosses the phone breakpoint (800px, as in the CSS).
 */
export function useChapter(
  ref: RefObject<HTMLElement | null>,
  index: number,
  setup?: Setup,
  options: Omit<ChapterScrollOptions, 'reduce'> = {},
): void {
  useGSAP(
    () => {
      const section = ref.current
      if (!section) return
      const mm = gsap.matchMedia()
      mm.add(
        {
          reduce: '(prefers-reduced-motion: reduce)',
          motion: '(prefers-reduced-motion: no-preference)',
          phone: '(max-width: 800px)',
        },
        (context) => {
          const reduce = Boolean(context.conditions?.reduce)
          const phone = Boolean(context.conditions?.phone)
          for (const beat of gsap.utils.toArray<HTMLElement>('[data-beat]', section)) {
            revealText(beat, beat, { reduce })
          }
          chapterScroll(section, index, { ...options, reduce })
          return setup?.(section, reduce, phone)
        },
      )
      return () => mm.revert()
    },
    { scope: ref },
  )
}

/** Scrubs `target`'s y (px) or yPercent from one value to another while `trigger` crosses the viewport. */
export function scrubY(
  target: Element | null,
  trigger: Element,
  from: number,
  to: number,
  unit: 'px' | '%' = 'px',
): void {
  if (!target) return
  const prop = unit === 'px' ? 'y' : 'yPercent'
  gsap.fromTo(
    target,
    { [prop]: from },
    { [prop]: to, ease: 'none', scrollTrigger: { trigger, start: 'top bottom', end: 'bottom top', scrub: true } },
  )
}
