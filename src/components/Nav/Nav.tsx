import type { Ref } from 'react'
import { useTheme } from '../../lib/useTheme'
import './Nav.css'

export function Nav({ ref }: { ref?: Ref<HTMLElement> }) {
  const { theme, setTheme } = useTheme()

  return (
    <header ref={ref} className="nav" data-on="ground">
      <span className="nav__name">Evolve</span>
      <div className="nav__theme" role="group" aria-label="Color theme">
        <button type="button" aria-pressed={theme === 'light'} onClick={() => setTheme('light')}>
          Day
        </button>
        <span aria-hidden="true">/</span>
        <button type="button" aria-pressed={theme === 'dark'} onClick={() => setTheme('dark')}>
          Night
        </button>
      </div>
    </header>
  )
}
