import { useRef } from 'react'
import { findChapter } from '../../content/chapters'
import { gsap } from '../../lib/gsap'
import { ChapterHeader } from '../Chapter/ChapterHeader'
import { ChapterText } from '../Chapter/ChapterText'
import { useChapter } from '../Chapter/useChapter'
import '../Chapter/Chapter.css'
import './Origins.css'

const { chapter, index } = findChapter('origins')

/** 01: a title card on the pupil's black. */
export function Origins() {
  const ref = useRef<HTMLElement>(null)
  const titleId = `${chapter.id}-title`

  useChapter(ref, index, (section, reduce) => {
    if (reduce) return
    // Leaves while the ground lifts into chapter 02, over the same scroll range, so bone type never sits on bone.
    gsap.to(section.querySelector('.origins__card'), {
      autoAlpha: 0,
      ease: 'none',
      scrollTrigger: { trigger: section, start: 'bottom 75%', end: 'bottom 25%', scrub: true },
    })
  })

  return (
    <section ref={ref} className="chapter origins" data-ground={chapter.ground} aria-labelledby={titleId}>
      <div className="chapter__grid origins__card" data-beat="main">
        <ChapterHeader chapter={chapter} />
        <ChapterText id={titleId} headline={chapter.headline} lede={chapter.lede} />
      </div>
    </section>
  )
}
