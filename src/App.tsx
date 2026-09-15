import { useEffect, useRef, type ComponentType } from 'react'
import { Backdrop } from './components/Backdrop/Backdrop'
import { ChapterSection } from './components/Chapter/ChapterSection'
import { Counter } from './components/Counter/Counter'
import { Feathers } from './components/Feathers/Feathers'
import { Footer } from './components/Footer/Footer'
import { Habits } from './components/Habits/Habits'
import { Hero } from './components/Hero/Hero'
import { Nav } from './components/Nav/Nav'
import { Origins } from './components/Origins/Origins'
import { StillHere } from './components/StillHere/StillHere'
import { CHAPTERS } from './content/chapters'
import { initSmoothScroll } from './lib/smoothScroll'

// Chapters with their own layout; the rest use ChapterSection until they get one.
const BESPOKE: Record<string, ComponentType> = {
  origins: Origins,
  feathers: Feathers,
  habits: Habits,
  'still-here': StillHere,
}

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
        {CHAPTERS.map((chapter, index) => {
          const Bespoke = BESPOKE[chapter.id]
          return Bespoke ? <Bespoke key={chapter.id} /> : <ChapterSection key={chapter.id} chapter={chapter} index={index} />
        })}
      </main>
      <Footer />
    </>
  )
}
