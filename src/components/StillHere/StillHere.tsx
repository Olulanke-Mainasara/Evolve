import { useRef } from 'react'
import { findChapter } from '../../content/chapters'
import { gsap } from '../../lib/gsap'
import { ChapterHeader } from '../Chapter/ChapterHeader'
import { ChapterText } from '../Chapter/ChapterText'
import { Photo } from '../Chapter/Photo'
import { scrubY, useChapter } from '../Chapter/useChapter'
import { closingLines } from './closingLines'
import '../Chapter/Chapter.css'
import './StillHere.css'

const { chapter, index } = findChapter('still-here')
const [cassowary, pigeon] = chapter.photos
const LINES = closingLines(chapter.closing ?? '', 4)

/** 07: the cassowary beside the headline, the pigeon full-bleed, then the closing line fitted to the width. */
export function StillHere() {
  const ref = useRef<HTMLElement>(null)
  const titleId = `${chapter.id}-title`

  useChapter(ref, index, (section, reduce) => {
    const closing = section.querySelector<HTMLElement>('.still-here__closing')
    const lines = gsap.utils.toArray<HTMLElement>('.still-here__line', section)
    if (!closing || !lines.length) return

    // Size the closing so its widest line spans the column (widths scale linearly with font size).
    const fit = () => {
      closing.style.setProperty('--closing-size', '100px')
      const widest = Math.max(...lines.map((line) => line.offsetWidth))
      if (widest > 0) closing.style.setProperty('--closing-size', `${(100 * closing.clientWidth) / widest}px`)
    }
    fit()
    let active = true
    document.fonts.ready.then(() => {
      if (active) fit()
    })
    // Only width changes matter; the height changes every time fit() resizes the text.
    let width = 0
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width === width) return
      width = entry.contentRect.width
      fit()
    })
    observer.observe(closing)

    const scrollTrigger = { trigger: closing, start: 'top 75%', toggleActions: 'play none none reverse' }
    if (reduce) {
      gsap.from(lines, { autoAlpha: 0, duration: 0.6, ease: 'power1.out', scrollTrigger })
    } else {
      gsap.from(lines, { yPercent: 110, duration: 1, ease: 'power3.out', stagger: 0.1, scrollTrigger })
      // Both photos pan inside their frames; the frames themselves stay put.
      scrubY(section.querySelector('.still-here__cassowary .photo__img'), section.querySelector('.still-here__cassowary') ?? section, -10, 0, '%')
      scrubY(section.querySelector('.still-here__pigeon .photo__img'), section.querySelector('.still-here__pigeon') ?? section, -10, 0, '%')
    }

    return () => {
      active = false
      observer.disconnect()
    }
  })

  return (
    <section ref={ref} className="chapter still-here" data-ground={chapter.ground} aria-labelledby={titleId}>
      <div className="chapter__grid still-here__intro" data-beat="main">
        <ChapterHeader chapter={chapter} />
        <ChapterText id={titleId} headline={chapter.headline} lede={chapter.lede} />
        <Photo photo={cassowary} className="still-here__cassowary" sizes="(max-width: 800px) 100vw, 42vw" />
      </div>

      <Photo photo={pigeon} className="still-here__pigeon" sizes="100vw" />

      <p className="still-here__closing">
        {LINES.map((line, i) => (
          <span key={line} className="still-here__mask">
            <span className="still-here__line">{line}</span>
            {i < LINES.length - 1 && ' '}
          </span>
        ))}
      </p>
    </section>
  )
}
