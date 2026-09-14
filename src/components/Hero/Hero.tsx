import { useRef, type RefObject } from 'react'
import { gsap, ScrollTrigger, useGSAP } from '../../lib/gsap'
import { lockScroll, unlockScroll } from '../../lib/smoothScroll'
import { drawEye } from './drawEye'
import { EyeIcon } from './EyeIcon'
import { createIntro, type Intro } from './introTimeline'
import {
  applyRevealedState,
  collectParts,
  measureHero,
  setSpotlight,
  waitForAssets,
  type HeroGeometry,
} from './layout'
import { PHOTO } from './photo'
import { createPupilDive, type PupilDive } from './pupilDive'
import './Hero.css'

function Word({ slotPart }: { slotPart?: string }) {
  return (
    <p className="word" aria-hidden="true">
      <span>EV</span>
      <span className="word__slot" data-part={slotPart} />
      <span>LVE</span>
    </p>
  )
}

export function Hero({ navRef }: { navRef: RefObject<HTMLElement | null> }) {
  const heroRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const hero = heroRef.current
      const nav = navRef.current
      if (!hero || !nav) return
      const parts = collectParts(hero)
      gsap.set([nav, parts.tagline, parts.cue], { autoAlpha: 0, y: 12 })

      const mm = gsap.matchMedia()
      mm.add(
        { reduce: '(prefers-reduced-motion: reduce)', motion: '(prefers-reduced-motion: no-preference)' },
        (context) => {
          const reduce = Boolean(context.conditions?.reduce)
          let cancelled = false
          let geo: HeroGeometry | null = null
          let intro: Intro | null = null
          let dive: PupilDive | null = null
          let revealed = false
          let frame = 0

          const getGeo = () => {
            if (!geo) throw new Error('Hero geometry read before measurement')
            return geo
          }

          const relayout = () => {
            if (!geo) return
            geo = measureHero(parts)
            if (revealed) {
              applyRevealedState(parts, geo)
            } else {
              setSpotlight(parts.dim, geo.spotlight)
              intro?.redraw()
            }
            dive?.render()
          }

          const onResize = () => {
            cancelAnimationFrame(frame)
            frame = requestAnimationFrame(relayout)
          }

          const settle = (photoOk: boolean) => {
            nav.dataset.on = photoOk ? 'photo' : 'ground'
            unlockScroll()
            dive = createPupilDive(parts, nav, getGeo, {
              mode: photoOk && !reduce ? 'zoom' : 'fade',
              restingBackdrop: photoOk ? 'photo' : 'ground',
            })
            ScrollTrigger.refresh()
          }

          if (!reduce) lockScroll()

          waitForAssets(parts.photo).then(({ photoOk }) => {
            if (cancelled) return
            context.add(() => {
              hero.dataset.photo = photoOk ? 'ok' : 'failed'
              geo = measureHero(parts)
              window.addEventListener('resize', onResize)
              document.fonts.ready.then(() => {
                if (!cancelled) relayout()
              })

              if (reduce) {
                if (photoOk) {
                  revealed = true
                  applyRevealedState(parts, geo)
                  gsap.set(parts.eye, { autoAlpha: 0 })
                  gsap.set([parts.reveal, parts.dim], { autoAlpha: 1 })
                } else {
                  drawEye(parts.eye, geo.almond, 1, geo.strokeWidth)
                }
                nav.dataset.on = photoOk ? 'photo' : 'ground'
                gsap.to([parts.stage, nav, parts.tagline, parts.cue], {
                  autoAlpha: 1,
                  y: 0,
                  duration: 0.4,
                  ease: 'power1.out',
                  onComplete: () => settle(photoOk),
                })
                return
              }

              intro = createIntro(parts, nav, getGeo, {
                photoOk,
                onComplete: () => {
                  if (photoOk) {
                    revealed = true
                    applyRevealedState(parts, getGeo())
                  }
                  settle(photoOk)
                },
              })
            })
          })

          return () => {
            cancelled = true
            cancelAnimationFrame(frame)
            window.removeEventListener('resize', onResize)
            dive?.kill()
            unlockScroll()
          }
        },
      )

      return () => mm.revert()
    },
    { scope: heroRef },
  )

  return (
    <section ref={heroRef} className="hero" id="top">
      <h1 className="sr-only">Evolve</h1>
      <div className="hero__stage" data-part="stage">
        <div className="hero__layer" data-part="base-layer">
          <Word slotPart="slot" />
        </div>
        <div className="hero__layer hero__layer--light" data-part="light-layer">
          <Word />
          <EyeIcon part="eye-light" />
        </div>
        <div className="hero__reveal" data-part="reveal">
          <picture>
            <source srcSet={PHOTO.avif} type="image/avif" />
            <img
              className="hero__photo"
              data-part="photo"
              src={PHOTO.webp}
              width={PHOTO.width}
              height={PHOTO.height}
              style={{ width: PHOTO.width, height: PHOTO.height }}
              alt=""
            />
          </picture>
          <div className="hero__dim" data-part="dim" />
          <div className="hero__layer">
            <Word />
          </div>
        </div>
        <EyeIcon part="eye" />
        <div className="hero__pupil-cover" data-part="pupil-cover" />
      </div>
      <div className="hero__void" data-part="void" />
      <p className="hero__tagline" data-part="tagline">
        Birds never stopped being dinosaurs.
      </p>
      <p className="hero__cue" data-part="cue">
        Scroll to look closer
      </p>
    </section>
  )
}
