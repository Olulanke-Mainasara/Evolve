import { useRef } from 'react'
import { findChapter } from '../../content/chapters'
import { showCounter } from '../../lib/counter'
import { gsap } from '../../lib/gsap'
import { toggleGround } from '../../lib/ground'
import { ChapterHeader } from '../Chapter/ChapterHeader'
import { ChapterText } from '../Chapter/ChapterText'
import { groundChange } from '../Chapter/chapterScroll'
import { Photo } from '../Chapter/Photo'
import { preloadPhotos } from '../Chapter/preload'
import { useChapter } from '../Chapter/useChapter'
import '../Chapter/Chapter.css'
import './Impact.css'

const { chapter, index } = findChapter('impact')
const [boundary] = chapter.photos
const aftermath = chapter.aftermath ?? { headline: '', lede: '' }

/** 06: a hard cut to black, a huge 66, the headline, then the extinction layer rises over it all. */
export function Impact() {
  const ref = useRef<HTMLElement>(null)
  const titleId = `${chapter.id}-title`

  useChapter(
    ref,
    index,
    (section, reduce, phone) => {
      const pin = section.querySelector<HTMLElement>('.impact__pin')
      const after = section.querySelector('.impact__aftermath')
      if (!pin || !after) return
      preloadPhotos(section)

      // No fade: the whole screen goes black the moment the chapter reaches the middle.
      toggleGround('theme', 'black', { trigger: section, start: 'top 50%' }, reduce ? 0.4 : 0)
      groundChange(after, 'black', 'theme', reduce)
      if (reduce) return

      const find = (selector: string) => pin.querySelector(selector)
      gsap
        .timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: pin,
            start: 'top top',
            end: `+=${phone ? 160 : 240}%`,
            pin: true,
            scrub: true,
            invalidateOnRefresh: true,
            // The big 66 takes over from the corner counter while pinned.
            onEnter: () => showCounter(false),
            onLeaveBack: () => showCounter(true),
            onLeave: () => showCounter(true),
            onEnterBack: () => showCounter(false),
          },
        })
        .fromTo(find('.chapter-header__rule'), { scaleX: 0 }, { scaleX: 1, duration: 0.1, ease: 'power2.inOut' }, 0)
        .fromTo(find('.chapter-header__labels'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.06 }, 0.04)
        .fromTo(find('.impact__number'), { autoAlpha: 0, y: 48 }, { autoAlpha: 1, y: 0, duration: 0.14, ease: 'power2.out' }, 0.04)
        .fromTo(find('.chapter-text__headline'), { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.1 }, 0.16)
        .fromTo(find('.chapter-text__lede'), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.1 }, 0.24)
        // The photo rises inside a mask that moves the opposite way, so the rock itself stays still.
        .fromTo(find('.impact__photo'), { yPercent: 100 }, { yPercent: 0, duration: 0.28, ease: 'power2.inOut' }, 0.46)
        .fromTo(find('.impact__photo-inner'), { yPercent: -100 }, { yPercent: 0, duration: 0.28, ease: 'power2.inOut' }, 0.46)
        .fromTo(find('.impact__caption'), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.08 }, 0.76)
        .to({}, { duration: 0.16 })
    },
    { ground: false },
  )

  return (
    <section ref={ref} className="chapter impact" data-ground={chapter.ground} aria-labelledby={titleId}>
      <div className="impact__pin">
        <div className="chapter__grid impact__grid">
          <ChapterHeader chapter={chapter} />
          <p className="impact__number" aria-hidden="true">
            {chapter.counter.to}
          </p>
          <ChapterText id={titleId} headline={chapter.headline} lede={chapter.lede} reveal="none" />
        </div>

        <div className="impact__photo">
          <div className="impact__photo-inner">
            <Photo photo={boundary} sizes="100vw" showCaption={false} />
          </div>
          <p className="impact__caption">{boundary.caption}</p>
        </div>
      </div>

      <div className="chapter__grid impact__aftermath" data-beat="aftermath" data-ground="theme">
        <ChapterText headline={aftermath.headline} lede={aftermath.lede} />
      </div>
    </section>
  )
}
