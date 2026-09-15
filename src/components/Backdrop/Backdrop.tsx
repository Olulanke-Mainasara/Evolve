import { useLayoutEffect, useRef, type RefObject } from 'react'
import { connectGround, followGround } from '../../lib/ground'
import './Backdrop.css'

/** Fixed page ground behind the chapters: the theme colour, with a black layer the story fades in and out. */
export function Backdrop({ navRef }: { navRef: RefObject<HTMLElement | null> }) {
  const blackRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const black = blackRef.current
    const nav = navRef.current
    if (!black || !nav) return
    const disconnect = connectGround(black)
    const unfollow = followGround(nav)
    return () => {
      disconnect()
      unfollow()
    }
  }, [navRef])

  return (
    <div className="backdrop" aria-hidden="true">
      <div ref={blackRef} className="backdrop__black" />
    </div>
  )
}
