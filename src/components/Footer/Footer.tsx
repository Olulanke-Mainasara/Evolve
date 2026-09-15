import { useRef } from 'react'
import { CHAPTERS } from '../../content/chapters'
import { showCounter } from '../../lib/counter'
import { ScrollTrigger, useGSAP } from '../../lib/gsap'
import { drawEye } from '../Hero/drawEye'
import { fitWordFontSize, type Almond } from '../Hero/geometry'
import { PHOTO } from '../Hero/photo'
import './Footer.css'

/** Lid stroke and pupil size relative to the wordmark, heavy enough to sit with the letter stems. */
const STROKE_EM = 0.045
const PUPIL_RATIO = 0.22

const PHOTOS = CHAPTERS.flatMap((chapter) => [
  ...chapter.photos,
  ...(chapter.exhibits ?? []).flatMap((exhibit) => (exhibit.photo ? [exhibit.photo] : [])),
])

const external = { target: '_blank', rel: 'noreferrer' }

export function Footer() {
  const ref = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const footer = ref.current
      const mark = footer?.querySelector<HTMLElement>('.footer__mark')
      const word = mark?.querySelector<HTMLElement>('.footer__word')
      const slot = mark?.querySelector<HTMLElement>('.footer__slot')
      const eye = mark?.querySelector<SVGSVGElement>('.footer__eye')
      const pupil = eye?.querySelector('circle')
      if (!footer || !mark || !word || !slot || !eye || !pupil) return

      // Same construction as the hero: the word (its widest line, on phones) spans the width and
      // the eye is drawn in the O's slot. The word is max-content wide, so offsetWidth is the text.
      const layout = () => {
        mark.style.setProperty('--word-size', '100px')
        const size = fitWordFontSize({ width: mark.clientWidth, height: Infinity }, word.offsetWidth, slot.offsetHeight, 1)
        mark.style.setProperty('--word-size', `${size}px`)
        const almond: Almond = {
          cx: word.offsetLeft + slot.offsetLeft + slot.offsetWidth / 2,
          cy: word.offsetTop + slot.offsetTop + slot.offsetHeight / 2,
          width: slot.offsetWidth,
          height: slot.offsetHeight,
          rotation: PHOTO.tilt,
        }
        drawEye(eye, almond, 1, size * STROKE_EM)
        pupil.setAttribute('cx', String(almond.cx))
        pupil.setAttribute('cy', String(almond.cy))
        pupil.setAttribute('r', String(almond.height * PUPIL_RATIO))
      }

      layout()
      let active = true
      document.fonts.ready.then(() => {
        if (active) layout()
      })
      // Only width changes matter; the height changes every time layout() resizes the word.
      let width = 0
      const observer = new ResizeObserver(([entry]) => {
        if (entry.contentRect.width === width) return
        width = entry.contentRect.width
        layout()
      })
      observer.observe(mark)

      ScrollTrigger.create({
        trigger: footer,
        start: 'top 85%',
        onEnter: () => showCounter(false),
        onLeaveBack: () => showCounter(true),
      })

      return () => {
        active = false
        observer.disconnect()
      }
    },
    { scope: ref },
  )

  return (
    <footer ref={ref} className="footer">
      <div className="footer__mark" aria-hidden="true">
        <p className="footer__word">
          <span>EV</span>
          <span className="footer__slot" />
          <span className="footer__break" />
          <span>LVE</span>
        </p>
        <svg className="footer__eye" focusable="false">
          <path />
          <path />
          <circle className="footer__pupil" />
        </svg>
      </div>

      <div className="footer__columns">
        <section aria-labelledby="footer-sources">
          <h2 id="footer-sources" className="footer__heading">
            Sources
          </h2>
          {CHAPTERS.map((chapter) => (
            <div key={chapter.id} className="footer__group">
              <h3 className="footer__group-title">
                {chapter.number} · {chapter.headline}
              </h3>
              <ul className="footer__list">
                {chapter.sources.map((source) => (
                  <li key={source.url}>
                    <a href={source.url} {...external}>
                      {source.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section aria-labelledby="footer-credits">
          <h2 id="footer-credits" className="footer__heading">
            Photo credits
          </h2>
          <ul className="footer__list footer__credits">
            {PHOTOS.map((photo) => (
              <li key={photo.file}>
                <a href={photo.sourceUrl} {...external}>
                  {photo.title}
                </a>{' '}
                by {photo.credit},{' '}
                <a href={photo.licenceUrl} {...external}>
                  {photo.licence}
                </a>
                {photo.cropped && ', cropped'}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </footer>
  )
}
