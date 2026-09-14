import { useRef } from 'react'
import { Nav } from './components/Nav/Nav'

export default function App() {
  const navRef = useRef<HTMLElement>(null)

  return (
    <>
      <Nav ref={navRef} />
      <main />
    </>
  )
}
