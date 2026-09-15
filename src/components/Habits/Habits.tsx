import { useRef } from 'react'
import { findChapter, type Exhibit } from '../../content/chapters'
import { gsap } from '../../lib/gsap'
import { ChapterHeader } from '../Chapter/ChapterHeader'
import { ChapterText } from '../Chapter/ChapterText'
import { Photo } from '../Chapter/Photo'
import { scrubY, useChapter } from '../Chapter/useChapter'
import '../Chapter/Chapter.css'
import './Habits.css'

const { chapter, index } = findChapter('habits')
const exhibits = chapter.exhibits ?? []

// Each exhibit's place around the headline and how far it drifts (px each way) while the chapter scrolls.
const PLACEMENT = [
  { className: 'habits__exhibit--sleep', drift: 90 },
  { className: 'habits__exhibit--nest', drift: 40 },
  { className: 'habits__exhibit--eggs', drift: 130 },
]

function ExhibitCard({ exhibit, className }: { exhibit: Exhibit; className: string }) {
  return (
    <article className={`habits__exhibit ${className}${exhibit.photo ? '' : ' habits__exhibit--text'}`}>
      {exhibit.photo && <Photo photo={exhibit.photo} sizes="(max-width: 800px) 100vw, 45vw" />}
      <h3 className="habits__exhibit-title">{exhibit.title}</h3>
      <p className="habits__exhibit-text">{exhibit.text}</p>
    </article>
  )
}

/** 05: the headline in the middle, three exhibits scattered around it. */
export function Habits() {
  const ref = useRef<HTMLElement>(null)
  const titleId = `${chapter.id}-title`

  useChapter(ref, index, (section, reduce) => {
    section.querySelectorAll('.habits__exhibit').forEach((card, i) => {
      gsap.from(card, {
        autoAlpha: 0,
        duration: reduce ? 0.6 : 0.9,
        ease: 'power2.out',
        scrollTrigger: { trigger: card, start: 'top 85%', toggleActions: 'play none none reverse' },
      })
      if (reduce) return
      const { drift } = PLACEMENT[i] ?? PLACEMENT[0]
      scrubY(card, section, drift, -drift)
    })
  })

  return (
    <section ref={ref} className="chapter habits" data-ground={chapter.ground} aria-labelledby={titleId}>
      <div className="chapter__grid habits__layout" data-beat="main">
        <ChapterHeader chapter={chapter} />
        <ChapterText id={titleId} headline={chapter.headline} lede={chapter.lede} />
        {exhibits.map((exhibit, i) => (
          <ExhibitCard key={exhibit.title} exhibit={exhibit} className={(PLACEMENT[i] ?? PLACEMENT[0]).className} />
        ))}
      </div>
    </section>
  )
}
