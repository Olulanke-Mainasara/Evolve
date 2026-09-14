export type Theme = 'light' | 'dark'

/** Must match the key read by the inline script in index.html. */
export const THEME_STORAGE_KEY = 'evolve-theme'

const darkQuery = () => window.matchMedia('(prefers-color-scheme: dark)')

export function readStoredTheme(): Theme | null {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY)
    return value === 'light' || value === 'dark' ? value : null
  } catch {
    return null
  }
}

export function saveTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Storage unavailable (private mode, blocked); the choice lasts for this page view only.
  }
}

export function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme
}

export function onSystemThemeChange(callback: (theme: Theme) => void): () => void {
  const query = darkQuery()
  const handle = () => callback(query.matches ? 'dark' : 'light')
  query.addEventListener('change', handle)
  return () => query.removeEventListener('change', handle)
}
