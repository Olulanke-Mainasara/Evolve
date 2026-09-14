import type { Ref } from 'react'
import { useTheme } from '../../lib/useTheme'

const themeButton =
  'cursor-pointer px-[0.1em] py-[0.25em] opacity-50 transition-opacity duration-200 hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-current aria-pressed:underline aria-pressed:decoration-1 aria-pressed:underline-offset-[0.35em] aria-pressed:opacity-100'

export function Nav({ ref }: { ref?: Ref<HTMLElement> }) {
  const { theme, setTheme } = useTheme()

  return (
    <header
      ref={ref}
      data-on="ground"
      className="fixed inset-x-0 top-0 z-10 flex items-baseline justify-between px-[clamp(16px,3vw,44px)] py-[clamp(16px,2.4vw,32px)] font-mono text-[clamp(13px,1vw,15px)] text-fg transition-colors duration-350 data-[on=photo]:text-light data-[on=void]:text-bone"
    >
      <span className="text-[1.15em] leading-none font-medium">Evolve</span>
      <div role="group" aria-label="Color theme" className="flex items-baseline gap-[0.3em]">
        <button type="button" aria-pressed={theme === 'light'} onClick={() => setTheme('light')} className={themeButton}>
          Light
        </button>
        <span aria-hidden="true">/</span>
        <button type="button" aria-pressed={theme === 'dark'} onClick={() => setTheme('dark')} className={themeButton}>
          Dark
        </button>
      </div>
    </header>
  )
}
