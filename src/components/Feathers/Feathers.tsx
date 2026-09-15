import { useRef } from 'react'
import { findChapter } from '../../content/chapters'
import { ChapterHeader } from '../Chapter/ChapterHeader'
import { ChapterText } from '../Chapter/ChapterText'
import { Photo } from '../Chapter/Photo'
import { scrubY, useChapter } from '../Chapter/useChapter'
import '../Chapter/Chapter.css'
import './Feathers.css'

const { chapter, index } = findChapter('feathers')
const [tail, holotype] = chapter.photos

/** 04: the tail close-up with the framed fossil layered over its lower-left edge. */
export function Feathers() {
  const ref = useRef<HTMLElement>(null)
  const titleId = `${chapter.id}-title`

  useChapter(ref, index, (section, reduce) => {
    if (reduce) return
    // The framed fossil drifts faster than the close-up behind it.
    scrubY(section.querySelector('.feathers__tail'), section, 60, -60)
    scrubY(section.querySelector('.feathers__holotype'), section, 140, -140)
  })

  return (
    <section ref={ref} className="chapter feathers" data-ground={chapter.ground} aria-labelledby={titleId}>
      <div className="chapter__grid feathers__layout" data-beat="main">
        <ChapterHeader chapter={chapter} />
        <ChapterText id={titleId} headline={chapter.headline} lede={chapter.lede} />
        <Photo photo={tail} className="feathers__tail" sizes="(max-width: 800px) 70vw, 405px" />
        <Photo photo={holotype} className="feathers__holotype" sizes="(max-width: 800px) 70vw, 30vw" />
      </div>
    </section>
  )
}
