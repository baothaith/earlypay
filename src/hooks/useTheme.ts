/**
 * useTheme — lightweight theme context hook.
 *
 * - Reads/writes `data-theme` attribute on <html>.
 * - Persists to localStorage under key "ep-theme".
 * - Defaults to system preference (prefers-color-scheme) when no saved value.
 * - Exported as a plain hook (no context provider needed — it reads/writes DOM directly).
 * - Flash-of-Wrong-Theme is prevented by an inline script in index.html that
 *   applies data-theme before React renders.
 */

import { useState, useCallback, useEffect } from 'react'

export type Theme = 'dark' | 'light'

const LS_KEY = 'ep-theme'

function getSystemPreference(): Theme {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'
  const saved = localStorage.getItem(LS_KEY) as Theme | null
  if (saved === 'light' || saved === 'dark') return saved
  return getSystemPreference()
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.setAttribute('data-theme', theme)
  // Update <meta name="theme-color"> so browser chrome reflects the theme
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (meta) {
    meta.content = theme === 'light' ? '#e8eef8' : '#0d1b2f'
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme)

  // Apply on mount and whenever theme changes
  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  // Listen for system preference changes (only affects users without a saved preference)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const handler = (e: MediaQueryListEvent) => {
      // Only follow system if user hasn't explicitly set a preference
      if (!localStorage.getItem(LS_KEY)) {
        const next: Theme = e.matches ? 'light' : 'dark'
        setThemeState(next)
      }
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const setTheme = useCallback((next: Theme) => {
    localStorage.setItem(LS_KEY, next)
    setThemeState(next)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [theme, setTheme])

  return { theme, setTheme, toggleTheme, isDark: theme === 'dark' }
}
