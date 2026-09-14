import { useRef } from 'react'
import { gsap, useGSAP } from '../lib/gsap'

export function ChapterStub() {
  const ref = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      gsap.from('[data-reveal]', {
        autoAlpha: 0,
        duration: 0.9,
        ease: 'power2.out',
        stagger: 0.15,
        scrollTrigger: { trigger: ref.current, start: 'top 55%', toggleActions: 'play none none reverse' },
      })
    },
    { scope: ref },
  )

  return (
    <section
      ref={ref}
      aria-labelledby="chapter-1-title"
      className="grid min-h-svh place-items-center bg-void px-[clamp(16px,6vw,96px)] py-[16svh] text-bone"
    >
      <div className="max-w-[18ch] text-center">
        <p data-reveal className="mb-[0.6em] font-serif text-[clamp(20px,2vw,28px)] italic">
          Chapter 1
        </p>
        <h2
          data-reveal
          id="chapter-1-title"
          className="font-display text-[clamp(40px,7vw,112px)] leading-[0.95] font-extrabold tracking-[-0.02em] font-stretch-semi-expanded"
        >
          The story starts here.
        </h2>
      </div>
    </section>
  )
}
