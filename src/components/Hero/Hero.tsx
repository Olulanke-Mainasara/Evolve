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

/** The three word copies (base, light, ink) share this box so they align exactly. */
const layer = 'absolute top-0 left-0 grid h-svh w-full place-items-center'

function Word({ slotPart }: { slotPart?: string }) {
  return (
    <p
      aria-hidden="true"
      className="relative font-display text-(length:--word-size,14vw) leading-none font-black font-stretch-125% tracking-[-0.01em] whitespace-nowrap select-none"
    >
      <span>EV</span>
      <span data-part={slotPart} className="mx-[0.1em] inline-block h-[1cap] w-[1.5cap] align-baseline" />
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
    <section ref={heroRef} id="top" className="group relative h-lvh overflow-hidden bg-ground">
      <h1 className="sr-only">Evolve</h1>
      <div data-part="stage" className="invisible absolute inset-0 text-fg opacity-0">
        <div data-part="base-layer" className={layer}>
          <Word slotPart="slot" />
        </div>
        <div data-part="light-layer" className={`${layer} hero-sweep invisible text-light`}>
          <Word />
          <EyeIcon part="eye-light" />
        </div>
        <div data-part="reveal" className="invisible absolute inset-0">
          <picture>
            <source srcSet={PHOTO.avif} type="image/avif" />
            <img
              data-part="photo"
              src={PHOTO.webp}
              width={PHOTO.width}
              height={PHOTO.height}
              style={{ width: PHOTO.width, height: PHOTO.height }}
              alt=""
              className="absolute top-0 left-0 max-w-none origin-top-left select-none"
            />
          </picture>
          <div
            data-part="dim"
            className="invisible absolute top-0 left-0 box-content rounded-[50%] border-solid border-black/55"
          />
          <div className={`${layer} text-light`}>
            <Word />
          </div>
        </div>
        <EyeIcon part="eye" />
        <div data-part="pupil-cover" className="absolute top-0 left-0 size-0 rounded-full bg-void opacity-0" />
      </div>
      <div data-part="void" className="pointer-events-none absolute inset-0 bg-void opacity-0" />
      <p
        data-part="tagline"
        className="invisible absolute inset-x-0 top-[calc(50svh+var(--word-size,14vw)*0.55)] px-4 text-center font-mono text-[clamp(14px,1.3vw,19px)] text-light opacity-0 group-data-[photo=failed]:text-fg"
      >
        Birds never stopped being dinosaurs.
      </p>
      <p
        data-part="cue"
        className="invisible absolute inset-x-0 bottom-[calc(100lvh-100svh+clamp(20px,4svh,40px))] px-4 text-center font-mono text-[clamp(11px,0.85vw,13px)] text-light opacity-0 group-data-[photo=failed]:text-fg"
      >
        Scroll to look closer
      </p>
    </section>
  )
}
