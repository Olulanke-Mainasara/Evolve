import { useLayoutEffect, useRef } from 'react'
import { connectCounter } from '../../lib/counter'
import { followGround } from '../../lib/ground'
import './Counter.css'

/** Fixed "million years ago" readout. Chapters drive it through lib/counter. */
export function Counter() {
  const rootRef = useRef<HTMLDivElement>(null)
  const valueRef = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    const root = rootRef.current
    const value = valueRef.current
    if (!root || !value) return
    const disconnect = connectCounter(root, value)
    const unfollow = followGround(root)
    return () => {
      disconnect()
      unfollow()
    }
  }, [])

  // Decorative: every chapter's copy and labels already carry its time.
  return (
    <div ref={rootRef} className="counter" data-on="void" aria-hidden="true">
      <span ref={valueRef} className="counter__value" />
      <span className="counter__label">million years ago</span>
    </div>
  )
}
