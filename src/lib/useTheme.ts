import { useEffect, useState } from 'react'
import { applyTheme, currentTheme, onSystemThemeChange, readStoredTheme, saveTheme, type Theme } from './theme'

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(currentTheme)

  useEffect(
    () =>
      onSystemThemeChange((next) => {
        if (readStoredTheme()) return
        applyTheme(next)
        setThemeState(next)
      }),
    [],
  )

  const setTheme = (next: Theme) => {
    applyTheme(next)
    saveTheme(next)
    setThemeState(next)
  }

  return { theme, setTheme }
}
