import { CHAPTERS, type Chapter } from '../../content/chapters'
import { ScrollTrigger } from '../../lib/gsap'
import { scrubCounter, setCounter, showCounter } from '../../lib/counter'
import { scrubGround, toggleGround, type Ground } from '../../lib/ground'

/** The ground a chapter hands to the next one (the impact returns to the theme for its aftermath). */
export const endGround = (chapter: Chapter): Ground => (chapter.aftermath ? 'theme' : chapter.ground)

export interface ChapterScrollOptions {
  reduce: boolean
  /** False when the chapter ticks its own counter (pinned chapters tick inside their timeline). */
  tick?: boolean
  /** False when the chapter changes the ground itself (e.g. the impact's hard cut). */
  ground?: boolean
}

/**
 * Counter ticks and ground changes as chapter `index` scrolls in. Call inside the chapter's
 * gsap context so everything is reverted with it.
 */
export function chapterScroll(section: HTMLElement, index: number, { reduce, tick = true, ground = true }: ChapterScrollOptions): void {
  const chapter = CHAPTERS[index]
  const previous = CHAPTERS[index - 1]
  const { from, to } = chapter.counter

  if (index === 0) {
    ScrollTrigger.create({
      trigger: section,
      start: 'top 80%',
      onEnter: () => showCounter(true),
      onLeaveBack: () => showCounter(false),
    })
  }

  if (reduce) {
    ScrollTrigger.create({
      trigger: section,
      start: 'top center',
      end: 'bottom center',
      onToggle: (self) => {
        if (self.isActive) setCounter(to)
      },
    })
  } else {
    if (previous && previous.counter.to !== from) {
      scrubCounter(previous.counter.to, from, { trigger: section, start: 'top bottom', end: 'top 40%' })
    }
    if (tick && from !== to) scrubCounter(from, to, { trigger: section, start: 'top 40%', end: 'bottom 60%' })
  }

  // The hero's pupil dive ends on black.
  const before: Ground = previous ? endGround(previous) : 'black'
  if (ground && before !== chapter.ground) groundChange(section, before, chapter.ground, reduce)
}

/** Changes the ground as `trigger` crosses the middle of the viewport. */
export function groundChange(trigger: Element, from: Ground, to: Ground, reduce: boolean): void {
  if (reduce) toggleGround(from, to, { trigger, start: 'top center' })
  else scrubGround(from, to, { trigger, start: 'top 75%', end: 'top 25%' })
}
