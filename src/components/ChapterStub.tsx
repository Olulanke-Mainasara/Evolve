import { useRef } from 'react'
import { gsap, useGSAP } from '../lib/gsap'
import './ChapterStub.css'

export function ChapterStub() {
  const ref = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      gsap.from('.chapter__inner > *', {
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
    <section ref={ref} className="chapter" aria-labelledby="chapter-1-title">
      <div className="chapter__inner">
        <p className="chapter__number">Chapter 1</p>
        <h2 id="chapter-1-title" className="chapter__title">
          The story starts here.
        </h2>
      </div>
    </section>
  )
}
