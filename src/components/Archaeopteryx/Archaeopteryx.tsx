import { useRef } from 'react'
import { findChapter } from '../../content/chapters'
import { gsap } from '../../lib/gsap'
import { ChapterHeader } from '../Chapter/ChapterHeader'
import { ChapterText } from '../Chapter/ChapterText'
import { Photo } from '../Chapter/Photo'
import { useChapter } from '../Chapter/useChapter'
import { preloadPhotos } from '../Chapter/preload'
import { lerp, logLerp } from '../Hero/geometry'
import '../Chapter/Chapter.css'
import './Archaeopteryx.css'

const { chapter, index } = findChapter('archaeopteryx')
const [slab, wing] = chapter.photos

/** The right wing on the slab photo, as fractions of the photo (measured by eye against the close-up). */
const WING = { left: 0.42, top: 0.22, width: 0.58, height: 0.38 }

/** 03: pinned; the slab photo pushes in until the wing fills the screen, then dissolves to the close-up. */
export function Archaeopteryx() {
  const ref = useRef<HTMLElement>(null)
  const titleId = `${chapter.id}-title`

  useChapter(ref, index, (section, reduce, phone) => {
    preloadPhotos(section)
    if (reduce) return
    const frame = section.querySelector<HTMLElement>('.archaeopteryx__frame')
    const text = section.querySelector('.archaeopteryx__text')
    const headline = section.querySelector('.chapter-text__headline')
    const lede = section.querySelector('.chapter-text__lede')
    const closeUp = section.querySelector('.archaeopteryx__wing')
    const closeUpImage = closeUp?.querySelector('.photo__img')
    const caption = section.querySelector('.archaeopteryx__caption')
    if (!frame) return

    const state = { zoom: 0 }

    // Scale the whole frame (photo only, no text) about its top-left so the wing lands centred and
    // covering the section. The focus point slides from the frame's centre to the wing's centre.
    const render = () => {
      const fw = frame.offsetWidth
      const fh = frame.offsetHeight
      const sw = section.clientWidth
      const sh = section.clientHeight
      const end = Math.max(sw / (WING.width * fw), sh / (WING.height * fh))
      const scale = logLerp(1, end, state.zoom)
      const focusX = lerp(fw / 2, (WING.left + WING.width / 2) * fw, state.zoom)
      const focusY = lerp(fh / 2, (WING.top + WING.height / 2) * fh, state.zoom)
      const screenX = lerp(frame.offsetLeft + fw / 2, sw / 2, state.zoom)
      const screenY = lerp(frame.offsetTop + fh / 2, sh / 2, state.zoom)
      gsap.set(frame, {
        x: screenX - frame.offsetLeft - scale * focusX,
        y: screenY - frame.offsetTop - scale * focusY,
        scale,
        transformOrigin: '0 0',
        force3D: true,
      })
    }

    // Phones show the headline first, then swap the lede into its place before the zoom (see the CSS).
    // Desktop reveals the lede on scroll-in like every other chapter.
    const textOut = phone ? 0.24 : 0.1
    if (!phone) {
      gsap.from(lede, {
        autoAlpha: 0,
        y: 16,
        duration: 0.8,
        delay: 0.5,
        ease: 'power2.out',
        scrollTrigger: { trigger: section, start: 'top 70%', toggleActions: 'play none none reverse' },
      })
    }

    const timeline = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: `+=${phone ? 180 : 240}%`,
        pin: true,
        scrub: true,
        invalidateOnRefresh: true,
        onRefresh: render,
      },
    })
    if (phone) {
      timeline
        .to(headline, { autoAlpha: 0, y: -16, duration: 0.08 }, 0.02)
        .fromTo(lede, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.08 }, 0.06)
    }
    timeline
      .to(text, { autoAlpha: 0, y: -24, duration: 0.18 }, textOut)
      .to(state, { zoom: 1, duration: 0.62, ease: 'power2.inOut', onUpdate: render }, textOut + 0.08)
      // The close-up was shot at a different angle, so it arrives as a dissolve while still settling in.
      .fromTo(closeUp, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.14 }, textOut + 0.64)
      .fromTo(caption, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.08 }, textOut + 0.8)
    if (closeUpImage) timeline.fromTo(closeUpImage, { scale: 1.08 }, { scale: 1, duration: 0.26 }, textOut + 0.64)

    render()
  })

  return (
    <section ref={ref} className="chapter archaeopteryx" data-ground={chapter.ground} aria-labelledby={titleId}>
      <div className="chapter__grid archaeopteryx__text" data-beat="main">
        <ChapterHeader chapter={chapter} />
        <ChapterText id={titleId} headline={chapter.headline} lede={chapter.lede} reveal="headline" />
      </div>

      <div className="archaeopteryx__frame">
        <Photo photo={slab} sizes="(max-width: 800px) 150vw, 200vw" showCaption={false} />
      </div>

      <div className="archaeopteryx__wing" aria-hidden="true">
        <Photo photo={wing} sizes="100vw" showCaption={false} />
      </div>

      <p className="archaeopteryx__caption">{slab.caption}</p>
    </section>
  )
}
