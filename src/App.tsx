import { useEffect, useRef } from 'react'
import { Backdrop } from './components/Backdrop/Backdrop'
import { ChapterSection } from './components/Chapter/ChapterSection'
import { Counter } from './components/Counter/Counter'
import { Footer } from './components/Footer/Footer'
import { Hero } from './components/Hero/Hero'
import { Nav } from './components/Nav/Nav'
import { CHAPTERS } from './content/chapters'
import { initSmoothScroll } from './lib/smoothScroll'

export default function App() {
  const navRef = useRef<HTMLElement>(null)

  useEffect(() => initSmoothScroll(), [])

  return (
    <>
      <Nav ref={navRef} />
      <Backdrop navRef={navRef} />
      <Counter />
      <main>
        <Hero navRef={navRef} />
        {CHAPTERS.map((chapter, index) => (
          <ChapterSection key={chapter.id} chapter={chapter} index={index} />
        ))}
      </main>
      <Footer />
    </>
  )
}
