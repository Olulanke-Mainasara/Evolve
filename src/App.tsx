import { useEffect, useRef } from 'react'
import { ChapterStub } from './components/ChapterStub'
import { Hero } from './components/Hero/Hero'
import { Nav } from './components/Nav/Nav'
import { initSmoothScroll } from './lib/smoothScroll'

export default function App() {
  const navRef = useRef<HTMLElement>(null)

  useEffect(() => initSmoothScroll(), [])

  return (
    <>
      <Nav ref={navRef} />
      <main>
        <Hero navRef={navRef} />
        <ChapterStub />
      </main>
    </>
  )
}
