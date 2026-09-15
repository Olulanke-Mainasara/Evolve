import { useEffect, useRef } from 'react'
import { Archaeopteryx } from './components/Archaeopteryx/Archaeopteryx'
import { Backdrop } from './components/Backdrop/Backdrop'
import { Counter } from './components/Counter/Counter'
import { FamilyTree } from './components/FamilyTree/FamilyTree'
import { Feathers } from './components/Feathers/Feathers'
import { Footer } from './components/Footer/Footer'
import { Habits } from './components/Habits/Habits'
import { Hero } from './components/Hero/Hero'
import { Impact } from './components/Impact/Impact'
import { Nav } from './components/Nav/Nav'
import { Origins } from './components/Origins/Origins'
import { StillHere } from './components/StillHere/StillHere'
import { initSmoothScroll } from './lib/smoothScroll'

export default function App() {
  const navRef = useRef<HTMLElement>(null)

  useEffect(() => initSmoothScroll(), [])

  // Chapters stay in time order (the order of CHAPTERS): the counter only counts down.
  return (
    <>
      <Nav ref={navRef} />
      <Backdrop navRef={navRef} />
      <Counter />
      <main>
        <Hero navRef={navRef} />
        <Origins />
        <FamilyTree />
        <Archaeopteryx />
        <Feathers />
        <Habits />
        <Impact />
        <StillHere />
      </main>
      <Footer />
    </>
  )
}
