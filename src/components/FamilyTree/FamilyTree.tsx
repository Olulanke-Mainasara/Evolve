import { useRef } from 'react'
import { findChapter } from '../../content/chapters'
import { counter, renderCounter } from '../../lib/counter'
import { gsap } from '../../lib/gsap'
import { ChapterHeader } from '../Chapter/ChapterHeader'
import { ChapterText } from '../Chapter/ChapterText'
import { useChapter } from '../Chapter/useChapter'
import '../Chapter/Chapter.css'
import './FamilyTree.css'

const { chapter, index } = findChapter('family-tree')

/**
 * A rectangular cladogram in percentages of the tree box. Fact-checked 2026-09-15: birds,
 * dromaeosaurs (Velociraptor) and troodontids form Paraves; tyrannosaurs sit outside it;
 * Stegosaurus is outside the theropods. `lineage` marks the path to birds, drawn in the accent.
 */
interface Line {
  axis: 'x' | 'y'
  /** The fixed coordinate: y for a horizontal line, x for a vertical one. */
  at: number
  /** Drawn from `from` toward `to`. */
  from: number
  to: number
  lineage?: boolean
}

interface Step {
  lines: Line[]
  label?: { text: string; x: number; y: number; align: 'start' | 'end'; lineage?: boolean }
}

const STEPS: Step[] = [
  { lines: [{ axis: 'x', at: 50, from: 0, to: 14, lineage: true }], label: { text: 'Dinosaurs', x: 0, y: 50, align: 'start' } },
  { lines: [{ axis: 'y', at: 14, from: 50, to: 16 }, { axis: 'y', at: 14, from: 50, to: 64, lineage: true }] },
  { lines: [{ axis: 'x', at: 16, from: 14, to: 100 }], label: { text: 'Stegosaurus', x: 100, y: 16, align: 'end' } },
  { lines: [{ axis: 'x', at: 64, from: 14, to: 40, lineage: true }], label: { text: 'Theropods', x: 15, y: 64, align: 'start' } },
  { lines: [{ axis: 'y', at: 40, from: 64, to: 44 }, { axis: 'y', at: 40, from: 64, to: 80, lineage: true }] },
  { lines: [{ axis: 'x', at: 44, from: 40, to: 100 }], label: { text: 'T. rex', x: 100, y: 44, align: 'end' } },
  { lines: [{ axis: 'x', at: 80, from: 40, to: 68, lineage: true }] },
  { lines: [{ axis: 'y', at: 68, from: 80, to: 70 }, { axis: 'y', at: 68, from: 80, to: 92, lineage: true }] },
  { lines: [{ axis: 'x', at: 70, from: 68, to: 100 }], label: { text: 'Velociraptor', x: 100, y: 70, align: 'end' } },
  { lines: [{ axis: 'x', at: 92, from: 68, to: 100, lineage: true }], label: { text: 'Birds', x: 100, y: 92, align: 'end', lineage: true } },
]

const lineStyle = ({ axis, at, from, to }: Line) =>
  axis === 'x'
    ? { top: `${at}%`, left: `${Math.min(from, to)}%`, width: `${Math.abs(to - from)}%` }
    : { left: `${at}%`, top: `${Math.min(from, to)}%`, height: `${Math.abs(to - from)}%` }

const isPhone = () => window.matchMedia('(max-width: 800px)').matches

/** 02: pinned; scrolling draws the tree from the first dinosaurs out to birds. */
export function FamilyTree() {
  const ref = useRef<HTMLElement>(null)
  const titleId = `${chapter.id}-title`

  useChapter(
    ref,
    index,
    (section, reduce) => {
      if (reduce) return
      const steps = gsap.utils.toArray<HTMLElement>('.tree__step', section)
      const lede = section.querySelector('.chapter-text__lede')

      const timeline = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${isPhone() ? 140 : 220}%`,
          pin: true,
          scrub: true,
          invalidateOnRefresh: true,
        },
      })

      steps.forEach((step, i) => {
        const across = step.querySelectorAll('.tree__line--x')
        const down = step.querySelectorAll('.tree__line--y')
        // Longer lines take longer so every branch draws at a similar speed.
        const longest = Math.max(...STEPS[i].lines.map((line) => Math.abs(line.to - line.from)))
        const duration = 0.04 + longest / 400
        const position = timeline.duration()
        if (across.length) timeline.fromTo(across, { scaleX: 0 }, { scaleX: 1, duration }, position)
        if (down.length) timeline.fromTo(down, { scaleY: 0 }, { scaleY: 1, duration }, position)
        const label = step.querySelector('.tree__label')
        if (label) timeline.fromTo(label, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.08 }, '<50%')
      })

      timeline
        .fromTo(lede, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.12 })
        .to({}, { duration: 0.15 })
        .fromTo(
          counter,
          { value: chapter.counter.from },
          { value: chapter.counter.to, duration: timeline.duration(), onUpdate: renderCounter, immediateRender: false },
          0,
        )
    },
    { tick: false },
  )

  return (
    <section ref={ref} className="chapter family-tree" data-ground={chapter.ground} aria-labelledby={titleId}>
      <div className="chapter__grid family-tree__text" data-beat="main">
        <ChapterHeader chapter={chapter} />
        <ChapterText id={titleId} headline={chapter.headline} lede={chapter.lede} reveal="headline" />
      </div>

      <div className="tree" role="img" aria-label="Family tree: dinosaurs split into Stegosaurus and the theropods; theropods lead to T. rex, then to Velociraptor and birds.">
        {STEPS.map((step, i) => (
          <div key={i} className="tree__step">
            {step.lines.map((line, j) => (
              <span
                key={j}
                className={`tree__line tree__line--${line.axis}${line.lineage ? ' tree__line--lineage' : ''}`}
                style={{ ...lineStyle(line), transformOrigin: line.axis === 'x' ? 'left center' : line.to < line.from ? 'center bottom' : 'center top' }}
              />
            ))}
            {step.label && (
              <span
                className={`tree__label tree__label--${step.label.align}${step.label.lineage ? ' tree__label--lineage' : ''}`}
                style={{ top: `${step.label.y}%`, [step.label.align === 'end' ? 'right' : 'left']: `${step.label.align === 'end' ? 100 - step.label.x : step.label.x}%` }}
              >
                {step.label.text}
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
